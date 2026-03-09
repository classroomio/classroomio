import type { QuestionTypeKey } from './question-type-keys';
import { getQuestionTypeByKey } from './question-type-lookup';

export function isAutoGradableQuestionType(key: QuestionTypeKey): boolean {
  return getQuestionTypeByKey(key).autoGradable;
}

export function supportsPartialCredit(key: QuestionTypeKey): boolean {
  return getQuestionTypeByKey(key).supportsPartialCredit;
}

export function requiresManualGrading(key: QuestionTypeKey): boolean {
  return getQuestionTypeByKey(key).manualGradingRequired;
}
