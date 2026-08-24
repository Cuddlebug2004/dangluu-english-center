import { issueSignedToken, presignUrl } from "@vercel/blob";
import { getSql } from "../../_lib/db.js";
import { requireStudent } from "../../_lib/learning-auth.js";
import { handleApiError, HttpError, method, sendJson } from "../../_lib/http.js";

const ROLE_COLUMNS = {
  listening_pdf: "listening_pdf_path",
  reading_pdf: "reading_pdf_path",
  listening_audio: "listening_audio_path",
};

export default async function handler(req, res) {
  try {
    method(req, ["GET"]);
    const student = await requireStudent(req);
    const attemptId = String(req.query.attempt || "");
    const role = String(req.query.role || "");
    const column = ROLE_COLUMNS[role];
    if (!column || !/^[0-9a-f-]{36}$/i.test(attemptId)) {
      throw new HttpError(400, "Yêu cầu tệp không hợp lệ.", "INVALID_FILE_REQUEST");
    }
    const sql = getSql();
    const rows = await sql.query(
      `SELECT t.${column} AS pathname
         FROM learning_attempts a
         JOIN learning_tests t ON t.id = a.test_id
        WHERE a.public_id = $1::uuid
          AND a.student_id = $2
          AND a.status = 'in_progress'
          AND t.learning_level = $3
        LIMIT 1`,
      [attemptId, student.student_id, student.learning_level],
    );
    const pathname = rows[0]?.pathname;
    if (!pathname) {
      throw new HttpError(404, "Không tìm thấy tệp hoặc bạn không có quyền xem.", "FILE_NOT_FOUND");
    }
    const validUntil = Date.now() + 90 * 60_000;
    const token = await issueSignedToken({
      pathname,
      operations: ["get"],
      validUntil,
    });
    const { presignedUrl } = await presignUrl(token, {
      access: "private",
      operation: "get",
      pathname,
      validUntil,
      useCache: true,
    });
    return sendJson(res, 200, { ok: true, url: presignedUrl, expiresAt: validUntil });
  } catch (error) {
    return handleApiError(res, error);
  }
}
