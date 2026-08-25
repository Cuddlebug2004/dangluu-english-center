import { getSql } from "./db.js";
import { HttpError } from "./http.js";

export async function getAttemptBundle(student, attemptPublicId = null) {
  const sql = getSql();
  const params = [student.student_id];
  let publicFilter = "";
  if (attemptPublicId) {
    params.push(String(attemptPublicId));
    publicFilter = ` AND a.public_id::text = $${params.length}`;
  }
  const attempts = await sql.query(
    `SELECT a.id, a.public_id, a.status, a.started_at, a.last_saved_at,
            t.id AS test_id, t.public_id AS test_public_id, t.title,
            t.learning_level, t.duration_minutes,
            t.listening_pdf_path, t.reading_pdf_path, t.listening_audio_path
       FROM learning_attempts a
       JOIN learning_tests t ON t.id = a.test_id
      WHERE a.student_id = $1
        AND a.status = 'in_progress'
        ${publicFilter}
      ORDER BY a.started_at DESC
      LIMIT 1`,
    params,
  );
  if (!attempts.length) return null;
  const attempt = attempts[0];
  if (attempt.learning_level !== student.learning_level) {
    throw new HttpError(403, "Bạn không được phép truy cập cấp độ này.", "LEVEL_FORBIDDEN");
  }
  const [questions, answers] = await Promise.all([
    sql.query(
      `SELECT id, paper, part_no, question_no, page_no,
              question_type, points, interaction_config
         FROM learning_questions
        WHERE test_id = $1
        ORDER BY CASE paper WHEN 'listening' THEN 1 ELSE 2 END,
                 part_no, question_no`,
      [attempt.test_id],
    ),
    sql.query(
      `SELECT question_id, answer_json
         FROM learning_attempt_answers
        WHERE attempt_id = $1`,
      [attempt.id],
    ),
  ]);
  return {
    attempt: {
      id: String(attempt.public_id),
      title: attempt.title,
      level: attempt.learning_level,
      durationMinutes: Number(attempt.duration_minutes),
      startedAt: attempt.started_at,
      deadlineAt: new Date(
        new Date(attempt.started_at).valueOf() + Number(attempt.duration_minutes) * 60_000,
      ).toISOString(),
    },
    files: {
      ...(attempt.listening_pdf_path
        ? { listening: `/api/learning/test/file-url?attempt=${encodeURIComponent(attempt.public_id)}&role=listening_pdf` }
        : {}),
      ...(attempt.reading_pdf_path
        ? { readingWriting: `/api/learning/test/file-url?attempt=${encodeURIComponent(attempt.public_id)}&role=reading_pdf` }
        : {}),
      ...(attempt.listening_audio_path
        ? { audio: `/api/learning/test/file-url?attempt=${encodeURIComponent(attempt.public_id)}&role=listening_audio` }
        : {}),
    },
    questions: questions.map((question) => ({
      id: Number(question.id),
      paper: question.paper,
      partNo: Number(question.part_no),
      questionNo: Number(question.question_no),
      pageNo: Number(question.page_no),
      type: question.question_type,
      points: Number(question.points || 1),
      interaction: question.interaction_config,
    })),
    answers: Object.fromEntries(
      answers.map((answer) => [String(answer.question_id), answer.answer_json]),
    ),
  };
}
