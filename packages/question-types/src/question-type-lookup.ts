import type { QuestionTypeMetadata } from './question-type-types';
import type { QuestionTypeKey } from './question-type-keys';
import {
  QUESTION_TYPE_BY_KEY,
  QUESTION_TYPE_IDS,
  QUESTION_TYPE_ID_TO_KEY,
  QUESTION_TYPE_TYPENAME_TO_KEY
} from './question-type-registry';

export function getQuestionTypeByKey(key: QuestionTypeKey): QuestionTypeMetadata {
  return QUESTION_TYPE_BY_KEY[key];
}

export function getQuestionTypeByTypename(typename: string): QuestionTypeMetadata | undefined {
  const key = QUESTION_TYPE_TYPENAME_TO_KEY[typename];
  return key ? QUESTION_TYPE_BY_KEY[key] : undefined;
}

export function getQuestionTypeById(id: number): QuestionTypeMetadata | undefined {
  const key = QUESTION_TYPE_ID_TO_KEY[id];
  return key ? QUESTION_TYPE_BY_KEY[key] : undefined;
}

export function getQuestionTypeId(key: QuestionTypeKey): number {
  return QUESTION_TYPE_IDS[key];
}
