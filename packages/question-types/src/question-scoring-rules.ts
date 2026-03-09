export const QUESTION_SCORING_MODE = {
  ALL_OR_NOTHING: 'all_or_nothing',
  PARTIAL: 'partial'
} as const;

export type QuestionScoringMode = (typeof QUESTION_SCORING_MODE)[keyof typeof QUESTION_SCORING_MODE];

export const ATTEMPT_SCORING_RULE = {
  HIGHEST: 'highest',
  LATEST: 'latest',
  AVERAGE: 'average'
} as const;

export type AttemptScoringRule = (typeof ATTEMPT_SCORING_RULE)[keyof typeof ATTEMPT_SCORING_RULE];

export const SHOW_CORRECT_ANSWERS_POLICY = {
  NEVER: 'never',
  AFTER_SUBMIT: 'after_submit',
  AFTER_GRADING: 'after_grading'
} as const;

export type ShowCorrectAnswersPolicy = (typeof SHOW_CORRECT_ANSWERS_POLICY)[keyof typeof SHOW_CORRECT_ANSWERS_POLICY];
