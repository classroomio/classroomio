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
