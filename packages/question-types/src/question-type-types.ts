import type { QuestionTypeKey } from './question-type-keys';

export interface QuestionTypeMetadata {
  key: QuestionTypeKey;
  typename: string;
  label: string;
  id: number;
  autoGradable: boolean;
  supportsPartialCredit: boolean;
  manualGradingRequired: boolean;
}
