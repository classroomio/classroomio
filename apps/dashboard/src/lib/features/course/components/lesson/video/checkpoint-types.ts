import type { QuestionTypeKey } from '@cio/question-types';

export const CHECKPOINT_QUESTION_TYPE_KEYS = [
  'RADIO',
  'CHECKBOX',
  'TRUE_FALSE',
  'NUMERIC',
  'FILL_BLANK',
  'WORD_BANK',
  'ORDERING',
  'STAR'
] as const satisfies readonly QuestionTypeKey[];

export type CheckpointQuestionType = (typeof CHECKPOINT_QUESTION_TYPE_KEYS)[number];

export type CheckpointResumePolicy = 'any' | 'correct';

export const CHECKPOINT_COLLISION_GAP_SECONDS = 2;

export const CHECKPOINT_LOW_CORRECT_PERCENT = 60;
