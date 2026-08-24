import crypto from "node:crypto";
import { getSql } from "../../_lib/db.js";
import { requireStudent } from "../../_lib/learning-auth.js";
import { assertSameOrigin, handleApiError, HttpError, method, sendJson } from "../../_lib/http.js";
import { getAttemptBundle } from "../../_lib/test-data.js";

export default async function handler(req, res) {
  try {
    method(req, ["POST"]);
    assertSameOrigin(req);
    const student = await requireStudent(req);
    const existing = await getAttemptBundle(student);
    if (existing) return sendJson(res, 200, { ok: true, resumed: true, ...existing });

    const sql = getSql();
    const inserted = await sql.query(
      `INSERT INTO learning_attempts (public_id, student_id, test_id)
       SELECT $1::uuid, $2, candidate.id
         FROM (
           SELECT t.id
             FROM learning_tests t
            WHERE t.learning_level = $3
              AND t.status = 'published'
              AND EXISTS (SELECT 1 FROM learning_questions q WHERE q.test_id = t.id)
              AND NOT EXISTS (
                SELECT 1 FROM learning_attempts a
                 WHERE a.student_id = $2 AND a.test_id = t.id
              )
            ORDER BY random()
            LIMIT 1
         ) candidate
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [crypto.randomUUID(), student.student_id, student.learning_level],
    );
    const bundle = await getAttemptBundle(student);
    if (!bundle) {
      throw new HttpError(
        404,
        "Hiện chưa có đề mới cho cấp độ của bạn. Vui lòng quay lại sau.",
        "NO_AVAILABLE_TEST",
      );
    }
    if (inserted.length) {
      await sql.query(
        `INSERT INTO learning_audit_logs
           (actor_type, actor_id, action, entity_type, entity_id)
         VALUES ('student', $1, 'attempt.start', 'learning_attempt', $2)`,
        [student.account_id, inserted[0].id],
      );
    }
    return sendJson(res, 200, { ok: true, resumed: !inserted.length, ...bundle });
  } catch (error) {
    return handleApiError(res, error);
  }
}
