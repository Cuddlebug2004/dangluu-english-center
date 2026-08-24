import { getSql } from "../../_lib/db.js";
import { requireStudent } from "../../_lib/learning-auth.js";
import { assertSameOrigin, handleApiError, HttpError, method, readJson, sendJson } from "../../_lib/http.js";

function validateAnswers(value) {
  if (!Array.isArray(value) || value.length > 200) {
    throw new HttpError(400, "Danh sách câu trả lời không hợp lệ.", "INVALID_ANSWERS");
  }
  const normalized = [];
  const seen = new Set();
  for (const item of value) {
    const questionId = Number(item?.questionId);
    const answer = item?.answer;
    if (!Number.isSafeInteger(questionId) || questionId < 1 || !answer || typeof answer !== "object" || Array.isArray(answer)) {
      throw new HttpError(400, "Câu trả lời không hợp lệ.", "INVALID_ANSWER");
    }
    if (seen.has(questionId)) continue;
    seen.add(questionId);
    normalized.push({ question_id: questionId, answer });
  }
  if (Buffer.byteLength(JSON.stringify(normalized), "utf8") > 128 * 1024) {
    throw new HttpError(413, "Dữ liệu câu trả lời quá lớn.", "ANSWERS_TOO_LARGE");
  }
  return normalized;
}

export default async function handler(req, res) {
  try {
    method(req, ["POST"]);
    assertSameOrigin(req);
    const student = await requireStudent(req);
    const body = readJson(req);
    const attemptId = String(body.attemptId || "");
    const answers = validateAnswers(body.answers);
    if (!/^[0-9a-f-]{36}$/i.test(attemptId)) {
      throw new HttpError(400, "Lượt làm bài không hợp lệ.", "INVALID_ATTEMPT");
    }
    const sql = getSql();
    const saved = await sql.query(
      `WITH supplied AS (
         SELECT x.question_id, x.answer
           FROM jsonb_to_recordset($1::jsonb)
                AS x(question_id bigint, answer jsonb)
       ), eligible AS (
         SELECT a.id AS attempt_id, supplied.question_id, supplied.answer
           FROM supplied
           JOIN learning_attempts a ON TRUE
           JOIN learning_tests t ON t.id = a.test_id
           JOIN learning_questions q
             ON q.test_id = a.test_id AND q.id = supplied.question_id
          WHERE a.public_id = $2::uuid
            AND a.student_id = $3
            AND a.status = 'in_progress'
            AND a.started_at + (t.duration_minutes + 5) * INTERVAL '1 minute'
                > CURRENT_TIMESTAMP
       )
       INSERT INTO learning_attempt_answers (attempt_id, question_id, answer_json)
       SELECT attempt_id, question_id, answer FROM eligible
       ON CONFLICT (attempt_id, question_id) DO UPDATE
         SET answer_json = EXCLUDED.answer_json,
             answered_at = CURRENT_TIMESTAMP,
             is_correct = NULL,
             points_awarded = NULL
       RETURNING question_id`,
      [JSON.stringify(answers), attemptId, student.student_id],
    );
    if (answers.length && !saved.length) {
      throw new HttpError(409, "Bài làm đã hết thời gian hoặc không còn mở.", "ATTEMPT_CLOSED");
    }
    await sql.query(
      `UPDATE learning_attempts
          SET last_saved_at = CURRENT_TIMESTAMP
        WHERE public_id = $1::uuid AND student_id = $2 AND status = 'in_progress'`,
      [attemptId, student.student_id],
    );
    return sendJson(res, 200, { ok: true, saved: saved.length, savedAt: new Date().toISOString() });
  } catch (error) {
    return handleApiError(res, error);
  }
}
