import { getSql } from "../../_lib/db.js";
import { requireStudent } from "../../_lib/learning-auth.js";
import { handleApiError, method, sendJson } from "../../_lib/http.js";

export default async function handler(req, res) {
  try {
    method(req, ["GET"]);
    const student = await requireStudent(req);
    const sql = getSql();
    const [active, available] = await Promise.all([
      sql.query(
        `SELECT a.public_id, t.title
           FROM learning_attempts a
           JOIN learning_tests t ON t.id = a.test_id
          WHERE a.student_id = $1 AND a.status = 'in_progress'
          ORDER BY a.started_at DESC LIMIT 1`,
        [student.student_id],
      ),
      sql.query(
        `SELECT COUNT(*)::integer AS count
           FROM learning_tests t
          WHERE t.learning_level = $1 AND t.status = 'published'
            AND (t.listening_pdf_path IS NOT NULL OR t.reading_pdf_path IS NOT NULL)
            AND ((t.listening_pdf_path IS NULL) = (t.listening_audio_path IS NULL))
            AND EXISTS (SELECT 1 FROM learning_questions q WHERE q.test_id = t.id)
            AND NOT EXISTS (
              SELECT 1 FROM learning_attempts a
               WHERE a.student_id = $2 AND a.test_id = t.id
            )`,
        [student.learning_level, student.student_id],
      ),
    ]);
    return sendJson(res, 200, {
      ok: true,
      student: { name: student.name, level: student.learning_level },
      activeAttempt: active.length
        ? { id: String(active[0].public_id), title: active[0].title }
        : null,
      availableTests: Number(available[0]?.count || 0),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
}
