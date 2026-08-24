import crypto from "node:crypto";
import { getSql } from "./db.js";
import { HttpError, parseCookies } from "./http.js";

export const SESSION_COOKIE = "__Host-dle_learning_session";
export const SESSION_IDLE_MINUTES = 30;
export const SESSION_MAX_HOURS = 8;

export function normalizeCccd(value) {
  const normalized = String(value || "").replace(/\D/g, "");
  if (!/^\d{12}$/.test(normalized)) {
    throw new HttpError(400, "CCCD/Mã học viên phải gồm đúng 12 chữ số.", "INVALID_CCCD");
  }
  return normalized;
}

export function cccdLookupHash(value) {
  const secret = String(process.env.LEARNING_CCCD_HMAC_SECRET || "");
  if (Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("LEARNING_CCCD_HMAC_SECRET must contain at least 32 bytes");
  }
  return crypto.createHmac("sha256", secret).update(normalizeCccd(value), "ascii").digest("hex");
}

export function validateDateOfBirth(value) {
  const normalized = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new HttpError(400, "Ngày sinh không hợp lệ.", "INVALID_DATE_OF_BIRTH");
  }
  const date = new Date(`${normalized}T00:00:00Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== normalized) {
    throw new HttpError(400, "Ngày sinh không hợp lệ.", "INVALID_DATE_OF_BIRTH");
  }
  return normalized;
}

export function validatePassword(value, cccd = "") {
  const password = String(value || "");
  const bytes = Buffer.byteLength(password, "utf8");
  if (password.length < 12 || bytes > 72) {
    throw new HttpError(400, "Mật khẩu phải từ 12 đến 72 byte.", "WEAK_PASSWORD");
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    throw new HttpError(
      400,
      "Mật khẩu cần có chữ hoa, chữ thường, số và ký tự đặc biệt.",
      "WEAK_PASSWORD",
    );
  }
  const digits = String(cccd || "").replace(/\D/g, "");
  if (digits && (password.includes(digits) || password.includes(digits.slice(-6)))) {
    throw new HttpError(400, "Mật khẩu không được chứa CCCD/Mã học viên.", "WEAK_PASSWORD");
  }
  return password;
}

export function createSessionToken() {
  const raw = crypto.randomBytes(32).toString("base64url");
  return { raw, hash: hashSessionToken(raw) };
}

export function hashSessionToken(raw) {
  return crypto.createHash("sha256").update(String(raw || ""), "utf8").digest("hex");
}

export function setSessionCookie(res, rawToken) {
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${encodeURIComponent(rawToken)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_MAX_HOURS * 3600}`,
  );
}

export function clearSessionCookie(res) {
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
  );
}

export async function requireStudent(req) {
  const rawToken = parseCookies(req)[SESSION_COOKIE];
  if (!rawToken || rawToken.length > 100) {
    throw new HttpError(401, "Phiên đăng nhập đã hết hạn.", "UNAUTHENTICATED");
  }
  const sql = getSql();
  const rows = await sql.query(
    `SELECT ss.id AS session_id, ss.account_id, a.student_id,
            a.learning_level, a.session_version, s.name,
            ss.expires_at, ss.idle_expires_at
       FROM learning_student_sessions ss
       JOIN learning_student_accounts a ON a.id = ss.account_id
       JOIN students s ON s.id = a.student_id
      WHERE ss.token_hash = $1
        AND ss.revoked_at IS NULL
        AND ss.expires_at > CURRENT_TIMESTAMP
        AND ss.idle_expires_at > CURRENT_TIMESTAMP
        AND ss.session_version = a.session_version
        AND a.is_active = TRUE
        AND a.password_hash IS NOT NULL
      LIMIT 1`,
    [hashSessionToken(rawToken)],
  );
  if (!rows.length) {
    throw new HttpError(401, "Phiên đăng nhập đã hết hạn.", "UNAUTHENTICATED");
  }
  const student = rows[0];
  await sql.query(
    `UPDATE learning_student_sessions
        SET last_seen_at = CURRENT_TIMESTAMP,
            idle_expires_at = LEAST(expires_at, CURRENT_TIMESTAMP + INTERVAL '30 minutes')
      WHERE id = $1`,
    [student.session_id],
  );
  return student;
}

export async function revokeCurrentSession(req, reason = "student_logout") {
  const rawToken = parseCookies(req)[SESSION_COOKIE];
  if (!rawToken) return;
  const sql = getSql();
  await sql.query(
    `UPDATE learning_student_sessions
        SET revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP),
            revoke_reason = COALESCE(revoke_reason, $2)
      WHERE token_hash = $1`,
    [hashSessionToken(rawToken), reason],
  );
}
