import type { QuestionTypeKey } from './question-type-keys';

export interface QuestionTypeMetadata {
  key: QuestionTypeKey;
  typename: string;
  label: string;
  id: number;
  autoGradable: boolean;
  supportsPartialCredit: boolean;
  manualGradingRequired: boolean;
  /** Built in code but not offered in the product (no `question_type` row). */
  disabled?: boolean;
}
