export function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("en-US")
    .replace(/[\s\u00a0]+/g, " ")
    .replace(/^[.,!?;:'\"()]+|[.,!?;:'\"()]+$/g, "");
}

export function gradeAnswer(questionType, answerKey, submittedAnswer) {
  const submitted = submittedAnswer && typeof submittedAnswer === "object" ? submittedAnswer : {};
  const key = answerKey && typeof answerKey === "object" ? answerKey : {};
  if (questionType === "text") {
    const value = normalizeText(submitted.value);
    return Array.isArray(key.accepted) && key.accepted.some((item) => normalizeText(item) === value);
  }
  if (questionType === "boolean") {
    return typeof submitted.value === "boolean" && submitted.value === key.value;
  }
  if (questionType === "connect") {
    return String(submitted.target || "") === String(key.target || "");
  }
  if (questionType === "choice" || questionType === "color") {
    return String(submitted.value || "").toLocaleLowerCase("en-US") === String(key.value || "").toLocaleLowerCase("en-US");
  }
  return false;
}

export function gradeAttempt(questions, answerRows) {
  const answersByQuestion = new Map(
    answerRows.map((row) => [String(row.question_id), row.answer_json || {}]),
  );
  const gradedAnswers = [];
  const parts = new Map();
  let earnedPoints = 0;
  let maxPoints = 0;

  for (const question of questions) {
    const points = Number(question.points);
    const answer = answersByQuestion.get(String(question.id)) || {};
    const isCorrect = gradeAnswer(question.question_type, question.answer_key, answer);
    const awarded = isCorrect ? points : 0;
    earnedPoints += awarded;
    maxPoints += points;
    gradedAnswers.push({
      questionId: Number(question.id),
      answer,
      isCorrect,
      pointsAwarded: awarded,
    });
    const partKey = `${question.paper}:${question.part_no}`;
    const part = parts.get(partKey) || {
      paper: question.paper,
      partNo: Number(question.part_no),
      correctCount: 0,
      totalQuestions: 0,
      earnedPoints: 0,
      maxPoints: 0,
    };
    part.totalQuestions += 1;
    part.maxPoints += points;
    part.correctCount += isCorrect ? 1 : 0;
    part.earnedPoints += awarded;
    parts.set(partKey, part);
  }

  const partScores = [...parts.values()].map((part) => ({
    ...part,
    percentage: part.maxPoints ? Number(((part.earnedPoints / part.maxPoints) * 100).toFixed(2)) : 0,
  }));
  return {
    gradedAnswers,
    partScores,
    earnedPoints,
    maxPoints,
    percentage: maxPoints ? Number(((earnedPoints / maxPoints) * 100).toFixed(2)) : 0,
  };
}
