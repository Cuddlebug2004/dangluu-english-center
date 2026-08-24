import bcrypt from "bcryptjs";
import { getSql } from "../../_lib/db.js";
import {
  cccdLookupHash,
  createSessionToken,
  normalizeCccd,
  SESSION_IDLE_MINUTES,
  SESSION_MAX_HOURS,
  setSessionCookie,
} from "../../_lib/learning-auth.js";
import { assertSameOrigin, handleApiError, HttpError, method, readJson, sendJson } from "../../_lib/http.js";

const DUMMY_HASH = "$2b$12$ML0i981as.zIh6R4hifEqe38U.0an8AfEhkxFJo2ss6B3cG0tbJFm";

export default async function handler(req, res) {
  try {
    method(req, ["POST"]);
    assertSameOrigin(req);
    const body = readJson(req);
    const cccd = normalizeCccd(body.cccd);
    const password = String(body.password || "");
    if (!password || Buffer.byteLength(password, "utf8") > 72) {
      throw new HttpError(401, "Thông tin đăng nhập không đúng.", "LOGIN_FAILED");
    }
    const sql = getSql();
    const rows = await sql.query(
      `SELECT a.id, a.student_id, a.password_hash, a.learning_level,
              a.session_version, a.is_active, a.locked_until, s.name
         FROM learning_student_accounts a
         JOIN students s ON s.id = a.student_id
        WHERE a.login_lookup_hash = $1
        LIMIT 1`,
      [cccdLookupHash(cccd)],
    );
    const account = rows[0];
    const passwordMatches = await bcrypt.compare(password, account?.password_hash || DUMMY_HASH);
    const locked = account?.locked_until && new Date(account.locked_until) > new Date();
    if (!account || !passwordMatches || !account.is_active || locked) {
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
      throw new HttpError(401, "Thông tin đăng nhập không đúng hoặc tài khoản tạm khóa.", "LOGIN_FAILED");
    }

    const token = createSessionToken();
    const now = Date.now();
    const idleExpires = new Date(now + SESSION_IDLE_MINUTES * 60_000).toISOString();
    const maxExpires = new Date(now + SESSION_MAX_HOURS * 3_600_000).toISOString();
    await sql.transaction((tx) => [
      tx.query(
        `UPDATE learning_student_accounts
            SET failed_login_attempts = 0, locked_until = NULL,
                last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = $1`,
        [account.id],
      ),
      tx.query(
        `UPDATE learning_student_sessions
            SET revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP),
                revoke_reason = COALESCE(revoke_reason, 'new_login')
          WHERE account_id = $1 AND revoked_at IS NULL`,
        [account.id],
      ),
      tx.query(
        `INSERT INTO learning_student_sessions
           (account_id, token_hash, session_version, idle_expires_at, expires_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [account.id, token.hash, account.session_version, idleExpires, maxExpires],
      ),
      tx.query(
        `INSERT INTO learning_audit_logs
           (actor_type, actor_id, action, entity_type, entity_id)
         VALUES ('student', $1, 'student.login', 'learning_student_account', $1)`,
        [account.id],
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
