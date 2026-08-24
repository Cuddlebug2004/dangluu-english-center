import bcrypt from "bcryptjs";
import { getSql } from "../../_lib/db.js";
import {
  cccdLookupHash,
  createSessionToken,
  normalizeCccd,
  SESSION_IDLE_MINUTES,
  SESSION_MAX_HOURS,
  setSessionCookie,
  validateDateOfBirth,
  validatePassword,
} from "../../_lib/learning-auth.js";
import { assertSameOrigin, handleApiError, HttpError, method, readJson, sendJson } from "../../_lib/http.js";

export default async function handler(req, res) {
  try {
    method(req, ["POST"]);
    assertSameOrigin(req);
    const body = readJson(req);
    const cccd = normalizeCccd(body.cccd);
    const dateOfBirth = validateDateOfBirth(body.dateOfBirth);
    const activationCode = String(body.activationCode || "").trim().toUpperCase();
    const password = validatePassword(body.password, cccd);
    if (!/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{10}$/.test(activationCode)) {
      throw new HttpError(400, "Thông tin kích hoạt không đúng hoặc đã hết hạn.", "ACTIVATION_FAILED");
    }

    const sql = getSql();
    const lookupHash = cccdLookupHash(cccd);
    const rows = await sql.query(
      `SELECT a.id, a.student_id, a.activation_code_hash, a.activation_expires_at,
              a.learning_level, a.locked_until, s.name
         FROM learning_student_accounts a
         JOIN students s ON s.id = a.student_id
        WHERE a.login_lookup_hash = $1
          AND s.date_of_birth = $2::date
          AND a.is_active = TRUE
        LIMIT 1`,
      [lookupHash, dateOfBirth],
    );
    const account = rows[0];
    const validCode = account?.activation_code_hash
      ? await bcrypt.compare(activationCode, account.activation_code_hash)
      : false;
    const locked = account?.locked_until && new Date(account.locked_until) > new Date();
    if (!account || !validCode || locked || new Date(account.activation_expires_at) <= new Date()) {
      if (account && !locked) {
        await sql.query(
          `UPDATE learning_student_accounts
              SET failed_login_attempts = failed_login_attempts + 1,
                  locked_until = CASE
                    WHEN failed_login_attempts + 1 >= 5
                    THEN CURRENT_TIMESTAMP + INTERVAL '15 minutes'
                    ELSE locked_until END,
                  updated_at = CURRENT_TIMESTAMP
            WHERE id = $1`,
          [account.id],
        );
      }
      throw new HttpError(400, "Thông tin kích hoạt không đúng hoặc đã hết hạn.", "ACTIVATION_FAILED");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const token = createSessionToken();
    const now = Date.now();
    const idleExpires = new Date(now + SESSION_IDLE_MINUTES * 60_000).toISOString();
    const maxExpires = new Date(now + SESSION_MAX_HOURS * 3_600_000).toISOString();
    const results = await sql.transaction((tx) => [
      tx.query(
        `UPDATE learning_student_sessions
            SET revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP),
                revoke_reason = COALESCE(revoke_reason, 'account_activated')
          WHERE account_id = $1 AND revoked_at IS NULL
            AND EXISTS (
              SELECT 1 FROM learning_student_accounts a
               WHERE a.id = $1 AND a.activation_code_hash = $2
            )`,
        [account.id, account.activation_code_hash],
      ),
      tx.query(
        `UPDATE learning_student_accounts
            SET password_hash = $1, activation_code_hash = NULL,
                activation_expires_at = NULL, activated_at = CURRENT_TIMESTAMP,
                must_change_password = FALSE, failed_login_attempts = 0,
                locked_until = NULL, session_version = session_version + 1,
                last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2 AND activation_code_hash = $3
          RETURNING session_version`,
        [passwordHash, account.id, account.activation_code_hash],
      ),
    ]);
    if (!results[1].length) {
      throw new HttpError(409, "Mã kích hoạt vừa được sử dụng. Vui lòng đăng nhập.", "ALREADY_ACTIVATED");
    }
    const sessionVersion = Number(results[1][0].session_version);
    await sql.transaction((tx) => [
      tx.query(
        `INSERT INTO learning_student_sessions
           (account_id, token_hash, session_version, idle_expires_at, expires_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [account.id, token.hash, sessionVersion, idleExpires, maxExpires],
      ),
      tx.query(
        `INSERT INTO learning_audit_logs
           (actor_type, actor_id, action, entity_type, entity_id, metadata)
         VALUES ('student', $1, 'student_account.activate',
                 'learning_student_account', $1, $2::jsonb)`,
        [account.id, JSON.stringify({ level: account.learning_level })],
      ),
    ]);
    setSessionCookie(res, token.raw);
    return sendJson(res, 200, {
      ok: true,
      student: { name: account.name, level: account.learning_level },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
}
