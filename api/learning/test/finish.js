import { getSql } from "../../_lib/db.js";
import { gradeAttempt } from "../../_lib/grading.js";
import { requireStudent } from "../../_lib/learning-auth.js";
import { assertSameOrigin, handleApiError, HttpError, method, readJson, sendJson } from "../../_lib/http.js";

async function completedResult(sql, attemptId, studentId) {
  const attempts = await sql.query(
    `SELECT id, earned_points, max_points, percentage, finished_at
       FROM learning_attempts
      WHERE public_id = $1::uuid AND student_id = $2 AND status = 'completed'
      LIMIT 1`,
    [attemptId, studentId],
  );
  if (!attempts.length) return null;
  const attempt = attempts[0];
  const [parts, answers] = await Promise.all([
    sql.query(
      `SELECT paper, part_no, correct_count, total_questions,
              earned_points, max_points, percentage
         FROM learning_part_scores
        WHERE attempt_id = $1
        ORDER BY CASE paper WHEN 'listening' THEN 1 ELSE 2 END, part_no`,
      [attempt.id],
    ),
    sql.query(
      `SELECT question_id, is_correct
         FROM learning_attempt_answers
        WHERE attempt_id = $1`,
      [attempt.id],
    ),
  ]);
  return {
    earnedPoints: Number(attempt.earned_points),
    maxPoints: Number(attempt.max_points),
    percentage: Number(attempt.percentage),
    finishedAt: attempt.finished_at,
    partScores: parts.map((part) => ({
      paper: part.paper,
      partNo: Number(part.part_no),
      correctCount: Number(part.correct_count),
      totalQuestions: Number(part.total_questions),
      earnedPoints: Number(part.earned_points),
      maxPoints: Number(part.max_points),
      percentage: Number(part.percentage),
    })),
    questionResults: answers.map((answer) => ({
      questionId: Number(answer.question_id),
      isCorrect: Boolean(answer.is_correct),
    })),
  };
}

export default async function handler(req, res) {
  let gradingAttemptId = null;
  try {
    method(req, ["POST"]);
    assertSameOrigin(req);
    const student = await requireStudent(req);
    const body = readJson(req);
    const attemptId = String(body.attemptId || "");
    if (!/^[0-9a-f-]{36}$/i.test(attemptId)) {
      throw new HttpError(400, "Lượt làm bài không hợp lệ.", "INVALID_ATTEMPT");
    }
    const sql = getSql();
    const previous = await completedResult(sql, attemptId, student.student_id);
    if (previous) return sendJson(res, 200, { ok: true, result: previous });

    const claimed = await sql.query(
      `UPDATE learning_attempts
          SET status = 'grading', last_saved_at = CURRENT_TIMESTAMP
        WHERE public_id = $1::uuid AND student_id = $2 AND status = 'in_progress'
        RETURNING id, test_id`,
      [attemptId, student.student_id],
    );
    if (!claimed.length) {
      throw new HttpError(409, "Bài đang được chấm hoặc không còn mở.", "ATTEMPT_CLOSED");
    }
    gradingAttemptId = Number(claimed[0].id);
    const testId = Number(claimed[0].test_id);
    const [questions, answers] = await Promise.all([
      sql.query(
        `SELECT id, paper, part_no, question_type, answer_key
           FROM learning_questions WHERE test_id = $1
          ORDER BY CASE paper WHEN 'listening' THEN 1 ELSE 2 END, part_no, question_no`,
        [testId],
      ),
      sql.query(
        `SELECT question_id, answer_json FROM learning_attempt_answers
          WHERE attempt_id = $1`,
        [gradingAttemptId],
      ),
    ]);
    if (!questions.length) {
      throw new Error("Attempt test contains no questions");
    }
    const grade = gradeAttempt(questions, answers);
    const answerPayload = grade.gradedAnswers.map((answer) => ({
      question_id: answer.questionId,
      answer: answer.answer,
      is_correct: answer.isCorrect,
      points_awarded: answer.pointsAwarded,
    }));
    const partPayload = grade.partScores.map((part) => ({
      paper: part.paper,
      part_no: part.partNo,
      correct_count: part.correctCount,
      total_questions: part.totalQuestions,
      earned_points: part.earnedPoints,
      max_points: part.maxPoints,
      percentage: part.percentage,
    }));

    await sql.transaction((tx) => [
      tx.query(
        `INSERT INTO learning_attempt_answers
           (attempt_id, question_id, answer_json, is_correct, points_awarded)
         SELECT $1, x.question_id, x.answer, x.is_correct, x.points_awarded
           FROM jsonb_to_recordset($2::jsonb)
                AS x(question_id bigint, answer jsonb, is_correct boolean, points_awarded numeric)
         ON CONFLICT (attempt_id, question_id) DO UPDATE
           SET answer_json = EXCLUDED.answer_json,
               is_correct = EXCLUDED.is_correct,
               points_awarded = EXCLUDED.points_awarded,
               answered_at = CURRENT_TIMESTAMP`,
        [gradingAttemptId, JSON.stringify(answerPayload)],
      ),
      tx.query("DELETE FROM learning_part_scores WHERE attempt_id = $1", [gradingAttemptId]),
      tx.query(
        `INSERT INTO learning_part_scores
           (attempt_id, paper, part_no, correct_count, total_questions,
            earned_points, max_points, percentage)
         SELECT $1, x.paper, x.part_no, x.correct_count, x.total_questions,
                x.earned_points, x.max_points, x.percentage
           FROM jsonb_to_recordset($2::jsonb)
                AS x(paper text, part_no integer, correct_count integer,
                     total_questions integer, earned_points numeric,
                     max_points numeric, percentage numeric)`,
        [gradingAttemptId, JSON.stringify(partPayload)],
      ),
      tx.query(
        `UPDATE learning_attempts
            SET status = 'completed', finished_at = CURRENT_TIMESTAMP,
                earned_points = $2, max_points = $3, percentage = $4,
                last_saved_at = CURRENT_TIMESTAMP
          WHERE id = $1 AND status = 'grading'`,
        [gradingAttemptId, grade.earnedPoints, grade.maxPoints, grade.percentage],
      ),
      tx.query(
        `INSERT INTO learning_audit_logs
           (actor_type, actor_id, action, entity_type, entity_id, metadata)
         VALUES ('student', $1, 'attempt.finish', 'learning_attempt', $2, $3::jsonb)`,
        [student.account_id, gradingAttemptId, JSON.stringify({ percentage: grade.percentage })],
      ),
    ]);
    const result = await completedResult(sql, attemptId, student.student_id);
    return sendJson(res, 200, { ok: true, result });
  } catch (error) {
    if (gradingAttemptId) {
      try {
        const sql = getSql();
        await sql.query(
          "UPDATE learning_attempts SET status = 'in_progress' WHERE id = $1 AND status = 'grading'",
          [gradingAttemptId],
        );
      } catch (resetError) {
        console.error("Could not release grading attempt", resetError);
      }
    }
    return handleApiError(res, error);
  }
}
