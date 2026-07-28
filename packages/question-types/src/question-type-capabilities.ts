import type { QuestionTypeKey } from './question-type-keys';
import { getQuestionTypeByKey } from './question-type-lookup';
import { QUESTION_TYPE_REGISTRY } from './question-type-registry';

export function isAutoGradableQuestionType(key: QuestionTypeKey): boolean {
  return getQuestionTypeByKey(key).autoGradable;
}

export function supportsPartialCredit(key: QuestionTypeKey): boolean {
  return getQuestionTypeByKey(key).supportsPartialCredit;
}

export function requiresManualGrading(key: QuestionTypeKey): boolean {
  return getQuestionTypeByKey(key).manualGradingRequired;
}

/** Numeric ids of every auto-gradable question type, pulled from the registry. */
export const AUTO_GRADABLE_QUESTION_TYPE_IDS: readonly number[] = QUESTION_TYPE_REGISTRY.filter(
  (entry) => entry.autoGradable
).map((entry) => entry.id);

/** True when the numeric `questionTypeId` refers to an auto-gradable type. */
export function isAutoGradableQuestionTypeId(questionTypeId: number): boolean {
  return AUTO_GRADABLE_QUESTION_TYPE_IDS.includes(questionTypeId);
}

/** True for open-ended types that are neither auto-graded nor manually graded (e.g. THUMBS). */
export function isOpenEndedQuestionType(key: QuestionTypeKey): boolean {
  const meta = getQuestionTypeByKey(key);
  return !meta.autoGradable && !meta.manualGradingRequired;
}

export function isOpenEndedQuestionTypeId(questionTypeId: number): boolean {
  const entry = QUESTION_TYPE_REGISTRY.find((type) => type.id === questionTypeId);
  if (!entry) return false;

  return !entry.autoGradable && !entry.manualGradingRequired;
}
