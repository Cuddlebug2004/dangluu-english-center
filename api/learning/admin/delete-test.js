import { del } from "@vercel/blob";
import { getSql } from "../../_lib/db.js";
import { handleApiError, HttpError, method, readJson, sendJson } from "../../_lib/http.js";
import { verifyInternalRequest } from "../../_lib/internal-auth.js";

export default async function handler(req, res) {
  try {
    method(req, ["POST"]);
    const body = readJson(req);
    verifyInternalRequest(req, body);

    const testId = Number(body.testId);
    const actorUserId = Number(body.actorUserId);
    if (!Number.isSafeInteger(testId) || testId <= 0) {
      throw new HttpError(400, "Mã đề kiểm tra không hợp lệ.", "INVALID_TEST_ID");
    }
    if (!Number.isSafeInteger(actorUserId) || actorUserId <= 0) {
      throw new HttpError(400, "Tài khoản Admin không hợp lệ.", "INVALID_ACTOR_ID");
    }

    const sql = getSql();
    const deleted = await sql.query(
      `DELETE FROM learning_tests t
        WHERE t.id = $1
          AND t.status = 'draft'
          AND NOT EXISTS (
            SELECT 1 FROM learning_attempts a WHERE a.test_id = t.id
          )
      RETURNING t.id, t.title, t.listening_pdf_path,
                t.reading_pdf_path, t.listening_audio_path`,
      [testId],
    );
    if (!deleted.length) {
      const rows = await sql.query(
        `SELECT t.status,
                EXISTS (SELECT 1 FROM learning_attempts a WHERE a.test_id = t.id) AS used
           FROM learning_tests t
          WHERE t.id = $1
          LIMIT 1`,
        [testId],
      );
      if (!rows.length) {
        throw new HttpError(404, "Không tìm thấy đề kiểm tra.", "TEST_NOT_FOUND");
      }
      if (rows[0].used) {
        throw new HttpError(
          409,
          "Đề đã có lượt làm nên không thể xóa; hãy chuyển sang trạng thái lưu trữ.",
          "TEST_HAS_ATTEMPTS",
        );
      }
      throw new HttpError(
        409,
        "Chỉ có thể xóa đề đang ở trạng thái bản nháp.",
        "TEST_NOT_DRAFT",
      );
    }

    const row = deleted[0];
    const paths = [
      row.listening_pdf_path,
      row.reading_pdf_path,
      row.listening_audio_path,
    ].filter(Boolean);
    let cleanupWarning = false;
    try {
      if (paths.length) await del(paths);
    } catch (error) {
      // The database record is already gone, which is safer than leaving a
      // live test pointing to missing files. Surface a cleanup warning while
      // keeping the delete operation idempotent from the Admin's perspective.
      cleanupWarning = true;
      console.error("Could not delete learning test blobs", { testId, paths, error });
    }

    try {
      await sql.query(
        `INSERT INTO learning_audit_logs
           (actor_type, actor_id, action, entity_type, entity_id, metadata)
         VALUES ('admin', $1, 'test.delete', 'learning_test', $2, $3::jsonb)`,
        [
          actorUserId,
          testId,
          JSON.stringify({
            title: row.title,
            file_count: paths.length,
            storage_cleanup_ok: !cleanupWarning,
          }),
        ],
      );
    } catch (error) {
      console.error("Could not write learning test delete audit", { testId, error });
    }
    return sendJson(res, 200, {
      ok: true,
      deleted: true,
      cleanupWarning,
    });
  } catch (error) {
    return handleApiError(res, error);
  }
}
