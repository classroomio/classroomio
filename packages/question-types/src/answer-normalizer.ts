import type { ExerciseAnswerValue } from './exercise-types';
import { getQuestionTypeById } from './question-type-lookup';
import { QUESTION_TYPE_KEY } from './question-type-keys';

/** Labels that map to boolean true when selected in a TRUE_FALSE question */
const TRUE_LABELS = new Set(['true', '1', 'yes']);
/** Labels that map to boolean false when selected in a TRUE_FALSE question */
const FALSE_LABELS = new Set(['false', '0', 'no']);

function labelToBoolean(label: string): boolean | undefined {
  const normalized = label.trim().toLowerCase();
  if (TRUE_LABELS.has(normalized)) return true;
  if (FALSE_LABELS.has(normalized)) return false;
  return undefined;
}

/**
 * Minimal question shape required for answer normalization.
 * Matches the structure returned by submission/grading APIs.
 */
export interface QuestionForNormalization {
  id: number | string;
  name?: string | null;
  questionTypeId: number;
  options?: Array<{ id: number | string; label?: string | null; value?: string | null }>;
}

/**
 * Deserializes a stored openAnswer value for a given question type.
 * FILL_BLANK is stored as JSON.stringify(string[]) because the DB open_answer
 * column is text-only; this restores the array for consumers.
 * FILE_UPLOAD is stored as JSON.stringify({ fileName, fileKey, mimeType, size });
 * Prefer fixing this at the API layer when building submission responses.
 */
export function deserializeStoredAnswer(
  questionTypeId: number,
  rawValue: string | string[] | null | undefined
): ExerciseAnswerValue {
  if (rawValue === null || rawValue === undefined) return rawValue;

  const metadata = getQuestionTypeById(questionTypeId);
  const questionTypeKey = metadata?.key ?? null;

  if (questionTypeKey === QUESTION_TYPE_KEY.FILL_BLANK && typeof rawValue === 'string') {
    try {
      const parsed = JSON.parse(rawValue) as unknown;
      if (!Array.isArray(parsed)) return rawValue;
      const arr = (parsed as unknown[]).map((x) => String(x).trim()).filter(Boolean);
      return arr.length === 1 ? arr[0] : arr;
    } catch {
      return rawValue;
    }
  }

  if (questionTypeKey === QUESTION_TYPE_KEY.FILE_UPLOAD && typeof rawValue === 'string') {
    try {
      const parsed = JSON.parse(rawValue) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && 'fileKey' in parsed) {
        return parsed as Record<string, unknown>;
      }
      return rawValue;
    } catch {
      return rawValue;
    }
  }

  return rawValue as ExerciseAnswerValue;
}

/**
 * Normalizes raw submission answers into display-ready values.
 * Handles API-specific formats (option IDs) and converts them to values
 * expected by the take/view renderers. Assumes FILL_BLANK is already
 * deserialized by the API (see deserializeStoredAnswer).
 */
export function normalizeAnswerForDisplay(
  rawAnswer: string | string[] | null | undefined,
  question: QuestionForNormalization
): ExerciseAnswerValue {
  if (rawAnswer === null || rawAnswer === undefined) return rawAnswer;

  const metadata = getQuestionTypeById(Number(question.questionTypeId));
  const questionTypeKey = metadata?.key ?? null;

  if (questionTypeKey === QUESTION_TYPE_KEY.TRUE_FALSE && question.options?.length) {
    const firstId = (Array.isArray(rawAnswer) ? rawAnswer[0] : rawAnswer) ?? null;
    if (firstId == null) return rawAnswer as ExerciseAnswerValue;

    const option = question.options.find((o) => String(o.id) === String(firstId));
    const label = String(option?.label ?? option?.value ?? '');
    const resolved = labelToBoolean(label);
    if (resolved !== undefined) return resolved;
  }

  if (questionTypeKey === QUESTION_TYPE_KEY.FILE_UPLOAD && typeof rawAnswer === 'string') {
    try {
      const parsed = JSON.parse(rawAnswer) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && 'fileKey' in parsed) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // fall through
    }
  }

  return rawAnswer as ExerciseAnswerValue;
}

/**
 * Normalizes a full answers map for display given the question list.
 * Uses question name or id as keys to match answers.
 */
export function normalizeAnswersForDisplay(
  answers: Record<string, string | string[]>,
  questions: QuestionForNormalization[]
): Record<string, ExerciseAnswerValue> {
  const result: Record<string, ExerciseAnswerValue> = {};
  const questionByKey = new Map<string, QuestionForNormalization>();

  for (const q of questions) {
    const nameKey = q.name != null && String(q.name).trim() ? String(q.name) : null;
    const idKey = q.id != null ? String(q.id) : null;
    if (nameKey) questionByKey.set(nameKey, q);
    if (idKey) questionByKey.set(idKey, q);
  }

  for (const [answerKey, rawAnswer] of Object.entries(answers)) {
    const question = questionByKey.get(answerKey);
    result[answerKey] = question ? normalizeAnswerForDisplay(rawAnswer, question) : (rawAnswer as ExerciseAnswerValue);
  }

  return result;
}
