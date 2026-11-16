export const QUESTION_TYPE_KEY = {
  RADIO: 'RADIO',
  CHECKBOX: 'CHECKBOX',
  TEXTAREA: 'TEXTAREA',
  TRUE_FALSE: 'TRUE_FALSE',
  SHORT_ANSWER: 'SHORT_ANSWER',
  NUMERIC: 'NUMERIC',
  FILL_BLANK: 'FILL_BLANK',
  FILE_UPLOAD: 'FILE_UPLOAD',
  MATCHING: 'MATCHING',
  ORDERING: 'ORDERING',
  HOTSPOT: 'HOTSPOT',
  LINK: 'LINK',
  WORD_BANK: 'WORD_BANK',
  STAR: 'STAR',
  VIDEO_RECORDING: 'VIDEO_RECORDING',
  THUMBS: 'THUMBS',
  MATH_EXPRESSION: 'MATH_EXPRESSION',
  WORKED_SOLUTION: 'WORKED_SOLUTION',
  GRAPH_PLOT: 'GRAPH_PLOT',
  GRAPH_READ: 'GRAPH_READ'
} as const;

/** True for question types whose answers can be grouped into clusters; free text, files and graphs cannot. */
export function isClusterableQuestionType(questionType: string): boolean {
  return (
    questionType !== QUESTION_TYPE_KEY.TEXTAREA &&
    questionType !== QUESTION_TYPE_KEY.FILE_UPLOAD &&
    questionType !== QUESTION_TYPE_KEY.GRAPH_PLOT &&
    questionType !== QUESTION_TYPE_KEY.GRAPH_READ
  );
}

export type QuestionTypeKey = (typeof QUESTION_TYPE_KEY)[keyof typeof QUESTION_TYPE_KEY];

export const LEGACY_QUESTION_TYPE_KEYS = [
  QUESTION_TYPE_KEY.RADIO,
  QUESTION_TYPE_KEY.CHECKBOX,
  QUESTION_TYPE_KEY.TEXTAREA
] as const;
