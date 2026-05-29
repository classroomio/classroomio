import { QUESTION_TYPE_KEY, type QuestionTypeKey } from './question-type-keys';

/**
 * Question types that require a paid plan. On the free (BASIC) plan these
 * are hidden in the dashboard editor, the AI agent's prompt does not list
 * them, and the agent tool boundary refuses to create them.
 */
export const PREMIUM_QUESTION_TYPE_KEYS: ReadonlySet<QuestionTypeKey> = new Set<QuestionTypeKey>([
  QUESTION_TYPE_KEY.FILE_UPLOAD,
  QUESTION_TYPE_KEY.ORDERING,
  QUESTION_TYPE_KEY.LINK,
  QUESTION_TYPE_KEY.STAR,
  QUESTION_TYPE_KEY.VIDEO_RECORDING
]);
