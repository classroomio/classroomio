import type { AnswerData, ExerciseQuestionModel, QuestionTypeKey } from '@cio/question-types';

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

export type LessonVideoCheckpoint = {
  id: string;
  lessonId: string;
  assetId: string;
  timestampSeconds: number;
  resumePolicy: CheckpointResumePolicy;
  question: ExerciseQuestionModel;
};

export type LessonVideoCheckpointAnswer = {
  checkpointId: string;
  profileId: string;
  displayName: string;
  avatarUrl: string;
  answeredAt: string;
  answerData: AnswerData;
  isCorrect: boolean;
};

export const CHECKPOINT_COLLISION_GAP_SECONDS = 2;
