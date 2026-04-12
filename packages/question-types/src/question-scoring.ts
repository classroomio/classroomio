import type { AnswerData } from './answer-data';
import type { ExerciseQuestionModel, ExerciseQuestionOption } from './exercise-types';
import { QUESTION_TYPE_KEY } from './question-type-keys';
import { getQuestionTypeById } from './question-type-lookup';
import { QUESTION_TYPE_ID_TO_KEY } from './question-type-registry';
import { supportsPartialCredit } from './question-type-capabilities';
import { getStarRatingMaxFromSettings, isValidStarRatingValue } from './star-rating-settings';

export type DbQuestionForScoring = {
  id: number;
  title?: string | null;
  questionTypeId: number;
  points: number | null;
  settings?: Record<string, unknown> | null;
  options: Array<{
    id?: number | null;
    label?: string | null;
    value?: string | null;
    isCorrect?: boolean | null;
  }>;
};

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

export function dbQuestionToExerciseQuestionModel(q: DbQuestionForScoring): ExerciseQuestionModel {
  const key = QUESTION_TYPE_ID_TO_KEY[q.questionTypeId] ?? QUESTION_TYPE_KEY.RADIO;
  const options: ExerciseQuestionOption[] = (q.options ?? [])
    .filter((o) => o.id != null)
    .map((o) => ({
      id: o.id as number,
      label: String(o.label ?? ''),
      value: o.value ?? undefined,
      isCorrect: o.isCorrect ?? false
    }));

  const rawSettings = q.settings;
  const settings =
    rawSettings && typeof rawSettings === 'object' && !Array.isArray(rawSettings) ? { ...rawSettings } : {};

  return {
    id: q.id,
    title: q.title ?? '',
    questionType: key,
    points: Number(q.points ?? 0),
    options,
    settings
  };
}

/** True when every question type id refers to an auto-gradable type (from registry). */
export function isExerciseAutoGradable(questionTypeIds: number[]): boolean {
  if (questionTypeIds.length === 0) return false;
  return questionTypeIds.every((id) => {
    const meta = getQuestionTypeById(id);
    return meta?.autoGradable === true;
  });
}

function clampPoints(raw: number, max: number): number {
  if (!Number.isFinite(raw) || raw < 0) return 0;
  return Math.min(Math.round(raw * 100) / 100, max);
}

function scoreRadio(
  question: ExerciseQuestionModel,
  answer: Extract<AnswerData, { type: 'RADIO' }>,
  maxPoints: number
): number {
  const selected = question.options?.find((o) => Number(o.id) === Number(answer.optionId));
  if (!selected?.isCorrect) return 0;
  return maxPoints;
}

function scoreCheckbox(
  question: ExerciseQuestionModel,
  answer: Extract<AnswerData, { type: 'CHECKBOX' }>,
  maxPoints: number,
  partial: boolean
): number {
  const options = question.options ?? [];
  const correctIds = new Set(
    options
      .filter((o) => o.isCorrect)
      .map((o) => Number(o.id))
      .filter((id) => Number.isFinite(id))
  );
  const selected = new Set(answer.optionIds.map((id) => Number(id)));
  if (correctIds.size === 0) return 0;

  let correctSelected = 0;
  let wrongSelected = 0;
  for (const id of selected) {
    if (correctIds.has(id)) correctSelected++;
    else wrongSelected++;
  }

  if (!partial) {
    return correctSelected === correctIds.size && wrongSelected === 0 ? maxPoints : 0;
  }

  const incorrectPool = Math.max(1, options.length - correctIds.size);
  const ratio = correctSelected / correctIds.size - wrongSelected / incorrectPool;
  return clampPoints(Math.max(0, ratio) * maxPoints, maxPoints);
}

function scoreTrueFalse(
  question: ExerciseQuestionModel,
  answer: Extract<AnswerData, { type: 'TRUE_FALSE' }>,
  maxPoints: number
): number {
  const opts = question.options ?? [];
  const trueOpt = opts.find((o) => normalizeText(o.label) === 'true');
  const falseOpt = opts.find((o) => normalizeText(o.label) === 'false');
  const correctFromSettings = question.settings?.correctValue;
  let correctIsTrue: boolean;
  if (typeof correctFromSettings === 'boolean') {
    correctIsTrue = correctFromSettings;
  } else if (trueOpt?.isCorrect) {
    correctIsTrue = true;
  } else if (falseOpt?.isCorrect) {
    correctIsTrue = false;
  } else {
    correctIsTrue = true;
  }

  return answer.value === correctIsTrue ? maxPoints : 0;
}

function scoreStar(
  question: ExerciseQuestionModel,
  answer: Extract<AnswerData, { type: 'STAR' }>,
  maxPoints: number
): number {
  const maxStars = getStarRatingMaxFromSettings(question.settings);
  const rawCorrect = question.settings?.correctValue;
  const correct = typeof rawCorrect === 'number' ? rawCorrect : rawCorrect != null ? Number(rawCorrect) : NaN;
  if (!isValidStarRatingValue(correct, maxStars)) return 0;
  if (!isValidStarRatingValue(answer.value, maxStars)) return 0;

  return answer.value === correct ? maxPoints : 0;
}

function scoreNumeric(
  question: ExerciseQuestionModel,
  answer: Extract<AnswerData, { type: 'NUMERIC' }>,
  maxPoints: number
): number {
  const rawCorrect = question.settings?.correctValue;
  const correct = typeof rawCorrect === 'number' ? rawCorrect : rawCorrect != null ? Number(rawCorrect) : NaN;
  if (Number.isNaN(correct)) return 0;

  const rawTol = question.settings?.tolerance;
  const tol = typeof rawTol === 'number' && Number.isFinite(rawTol) ? rawTol : rawTol != null ? Number(rawTol) : 0;
  const diff = Math.abs(answer.value - correct);
  return diff <= tol ? maxPoints : 0;
}

function scoreFillBlank(
  question: ExerciseQuestionModel,
  answer: Extract<AnswerData, { type: 'FILL_BLANK' }>,
  maxPoints: number,
  partial: boolean
): number {
  const raw = String(question.settings?.acceptedAnswers ?? '');
  const expected = raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const studentVals = answer.values.map((v) => String(v).trim().toLowerCase());
  if (expected.length === 0) return 0;

  let correct = 0;
  for (let i = 0; i < expected.length; i++) {
    if (studentVals[i] === expected[i]) correct++;
  }

  if (!partial) {
    return correct === expected.length && studentVals.length === expected.length ? maxPoints : 0;
  }
  return (correct / expected.length) * maxPoints;
}

function scoreWordBank(
  question: ExerciseQuestionModel,
  answer: Extract<AnswerData, { type: 'WORD_BANK' }>,
  maxPoints: number,
  partial: boolean
): number {
  const rawCorrect = question.settings?.correctAnswers;
  const expected = Array.isArray(rawCorrect)
    ? (rawCorrect as unknown[]).map((s) => String(s).trim().toLowerCase()).filter(Boolean)
    : [];
  if (expected.length === 0) return 0;

  const studentVals = (answer.filledBlanks ?? []).map((v) => String(v).trim().toLowerCase());

  let correct = 0;
  for (let i = 0; i < expected.length; i++) {
    if (studentVals[i] === expected[i]) correct++;
  }

  if (!partial) {
    return correct === expected.length && studentVals.length === expected.length ? maxPoints : 0;
  }
  return (correct / expected.length) * maxPoints;
}

function pairKey(left: string, right: string): string {
  return `${normalizeText(left)}::${normalizeText(right)}`;
}

function scoreMatching(
  question: ExerciseQuestionModel,
  answer: Extract<AnswerData, { type: 'MATCHING' }>,
  maxPoints: number,
  partial: boolean
): number {
  const rawPairs = question.settings?.pairs;
  const correctPairs = Array.isArray(rawPairs) ? (rawPairs as Array<{ left: string; right: string }>) : [];
  if (correctPairs.length === 0) return 0;

  const correctSet = new Set(correctPairs.map((p) => pairKey(p.left, p.right)));
  const studentPairs = answer.pairs ?? [];
  let matches = 0;
  for (const p of studentPairs) {
    if (correctSet.has(pairKey(p.left, p.right))) matches++;
  }

  if (!partial) {
    return matches === correctSet.size && studentPairs.length === correctSet.size ? maxPoints : 0;
  }
  return (matches / correctSet.size) * maxPoints;
}

type OrderingItem = { label: string; answerValue: string };

function getOrderingItems(question: ExerciseQuestionModel): OrderingItem[] {
  const opts = question.options ?? [];
  if (opts.length > 0) {
    return opts.map((o, index) => {
      const label = String(o.label ?? o.value ?? '').trim() || String(index + 1);
      const id = String(o.id ?? o.value ?? o.label ?? `ordering-${index + 1}`);
      const answerValue = String(o.id ?? o.value ?? o.label ?? id);
      return { label, answerValue };
    });
  }
  const rawItems = Array.isArray(question.settings?.items) ? (question.settings.items as string[]) : [];
  return rawItems.map((label, index) => ({
    label: String(label).trim() || String(index + 1),
    answerValue: String(label).trim()
  }));
}

function getExpectedOrderingValues(question: ExerciseQuestionModel): string[] {
  const items = getOrderingItems(question);
  const settingsItems = Array.isArray(question.settings?.items) ? (question.settings!.items as string[]) : [];
  if (settingsItems.length > 0) {
    const byLabel = new Map(items.map((i) => [normalizeText(i.label), i.answerValue]));
    return settingsItems.map((l) => byLabel.get(normalizeText(l)) ?? String(l));
  }
  return items.map((i) => i.answerValue);
}

function scoreOrdering(
  question: ExerciseQuestionModel,
  answer: Extract<AnswerData, { type: 'ORDERING' }>,
  maxPoints: number,
  partial: boolean
): number {
  const expected = getExpectedOrderingValues(question);
  const student = (answer.orderedValues ?? []).map((v) => String(v).trim());
  if (expected.length === 0) return 0;
  if (student.length !== expected.length) {
    return partial ? 0 : 0;
  }

  let correct = 0;
  for (let i = 0; i < expected.length; i++) {
    if (normalizeText(student[i]) === normalizeText(expected[i])) correct++;
  }

  if (!partial) {
    return correct === expected.length ? maxPoints : 0;
  }
  return (correct / expected.length) * maxPoints;
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

const HOTSPOT_TOLERANCE = 12;

function scoreHotspot(
  question: ExerciseQuestionModel,
  answer: Extract<AnswerData, { type: 'HOTSPOT' }>,
  maxPoints: number,
  partial: boolean
): number {
  const raw = question.settings?.hotspots;
  const hotspots = Array.isArray(raw) ? (raw as Array<{ x: number; y: number }>) : [];
  if (hotspots.length === 0) return 0;

  const coords = answer.coordinates ?? [];
  let hits = 0;
  for (const h of hotspots) {
    if (coords.some((c) => distance(c, h) <= HOTSPOT_TOLERANCE)) hits++;
  }

  if (!partial) {
    return hits === hotspots.length && coords.length >= hotspots.length ? maxPoints : 0;
  }
  return (hits / hotspots.length) * maxPoints;
}

export function scoreAnswerForQuestion(question: ExerciseQuestionModel, answer: AnswerData | null | undefined): number {
  const maxPoints = Number(question.points ?? 0);
  if (maxPoints <= 0) return 0;
  if (!answer || typeof answer !== 'object' || !('type' in answer)) return 0;

  const key = question.questionType;
  const partial = supportsPartialCredit(key);

  switch (answer.type) {
    case 'RADIO':
      if (key !== QUESTION_TYPE_KEY.RADIO) return 0;
      return scoreRadio(question, answer, maxPoints);
    case 'CHECKBOX':
      if (key !== QUESTION_TYPE_KEY.CHECKBOX) return 0;
      return clampPoints(scoreCheckbox(question, answer, maxPoints, partial), maxPoints);
    case 'TRUE_FALSE':
      if (key !== QUESTION_TYPE_KEY.TRUE_FALSE) return 0;
      return scoreTrueFalse(question, answer, maxPoints);
    case 'NUMERIC':
      if (key !== QUESTION_TYPE_KEY.NUMERIC) return 0;
      return scoreNumeric(question, answer, maxPoints);
    case 'STAR':
      if (key !== QUESTION_TYPE_KEY.STAR) return 0;
      return scoreStar(question, answer, maxPoints);
    case 'FILL_BLANK':
      if (key !== QUESTION_TYPE_KEY.FILL_BLANK) return 0;
      return clampPoints(scoreFillBlank(question, answer, maxPoints, partial), maxPoints);
    case 'WORD_BANK':
      if (key !== QUESTION_TYPE_KEY.WORD_BANK) return 0;
      return clampPoints(scoreWordBank(question, answer, maxPoints, partial), maxPoints);
    case 'MATCHING':
      if (key !== QUESTION_TYPE_KEY.MATCHING) return 0;
      return clampPoints(scoreMatching(question, answer, maxPoints, partial), maxPoints);
    case 'ORDERING':
      if (key !== QUESTION_TYPE_KEY.ORDERING) return 0;
      return clampPoints(scoreOrdering(question, answer, maxPoints, partial), maxPoints);
    case 'HOTSPOT':
      if (key !== QUESTION_TYPE_KEY.HOTSPOT) return 0;
      return clampPoints(scoreHotspot(question, answer, maxPoints, partial), maxPoints);
    default:
      return 0;
  }
}

export type ScoreSubmissionResult = {
  scores: Array<{ questionId: number; points: number }>;
  total: number;
};

/**
 * Computes per-question scores and total for auto-graded exercises.
 * Missing answers score 0.
 */
export function scoreSubmissionAnswers(
  questions: DbQuestionForScoring[],
  answersByQuestionId: ReadonlyMap<number, AnswerData | null | undefined>
): ScoreSubmissionResult {
  const scores: Array<{ questionId: number; points: number }> = [];
  let total = 0;

  for (const q of questions) {
    const model = dbQuestionToExerciseQuestionModel(q);
    const meta = getQuestionTypeById(q.questionTypeId);
    if (!meta?.autoGradable) {
      scores.push({ questionId: q.id, points: 0 });
      continue;
    }

    const answer = answersByQuestionId.get(q.id);
    const pts = Math.round(scoreAnswerForQuestion(model, answer ?? null));
    scores.push({ questionId: q.id, points: pts });
    total += pts;
  }

  return { scores, total };
}
