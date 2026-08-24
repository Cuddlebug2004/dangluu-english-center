import test from "node:test";
import assert from "node:assert/strict";

import { gradeAnswer, gradeAttempt, normalizeText } from "../api/_lib/grading.js";
import { normalizeCccd, validateDateOfBirth, validatePassword } from "../api/_lib/learning-auth.js";

test("normalizes typed English answers without accepting different words", () => {
  assert.equal(normalizeText("  Fifteen! "), "fifteen");
  assert.equal(gradeAnswer("text", { accepted: ["15", "fifteen"] }, { value: " FIFTEEN. " }), true);
  assert.equal(gradeAnswer("text", { accepted: ["wall"] }, { value: "ball" }), false);
});

test("grades every supported interaction type", () => {
  assert.equal(gradeAnswer("boolean", { value: false }, { value: false }), true);
  assert.equal(gradeAnswer("choice", { value: "B" }, { value: "b" }), true);
  assert.equal(gradeAnswer("connect", { target: "girl_reading" }, { target: "girl_reading" }), true);
  assert.equal(gradeAnswer("color", { value: "yellow" }, { value: "Yellow" }), true);
  assert.equal(gradeAnswer("boolean", { value: false }, {}), false);
});

test("builds percentages for each Part and the full attempt", () => {
  const questions = [
    { id: 1, paper: "listening", part_no: 1, question_type: "choice", points: 1, answer_key: { value: "A" } },
    { id: 2, paper: "listening", part_no: 1, question_type: "choice", points: 1, answer_key: { value: "B" } },
    { id: 3, paper: "reading_writing", part_no: 2, question_type: "text", points: 2, answer_key: { accepted: ["spiders"] } },
  ];
  const result = gradeAttempt(questions, [
    { question_id: 1, answer_json: { value: "A" } },
    { question_id: 2, answer_json: { value: "C" } },
    { question_id: 3, answer_json: { value: "spiders" } },
  ]);
  assert.equal(result.earnedPoints, 2);
  assert.equal(result.maxPoints, 3);
  assert.equal(result.percentage, 66.67);
  assert.deepEqual(result.partScores.map((part) => part.percentage), [50, 100]);
});

test("validates student identifiers and passwords", () => {
  assert.equal(normalizeCccd("0792 0012 3456"), "079200123456");
  assert.equal(validateDateOfBirth("2016-04-09"), "2016-04-09");
  assert.equal(validatePassword("Strong!Pass9", "079200123456"), "Strong!Pass9");
  assert.throws(() => normalizeCccd("123"));
  assert.throws(() => validateDateOfBirth("2016-02-31"));
  assert.throws(() => validatePassword("short", "079200123456"));
});
