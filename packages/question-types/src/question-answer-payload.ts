import { QUESTION_TYPE_KEY, type QuestionTypeKey } from './question-type-keys';

export type QuestionAnswerPayload =
  | RadioAnswerPayload
  | CheckboxAnswerPayload
  | TextareaAnswerPayload
  | TrueFalseAnswerPayload
  | ShortAnswerPayload
  | NumericAnswerPayload
  | FillBlankAnswerPayload
  | FileUploadAnswerPayload
  | MatchingAnswerPayload
  | OrderingAnswerPayload
  | HotspotAnswerPayload
  | LinkAnswerPayload;

interface BaseAnswerPayload {
  type: QuestionTypeKey;
}

export interface RadioAnswerPayload extends BaseAnswerPayload {
  type: typeof QUESTION_TYPE_KEY.RADIO;
  optionId: number;
}

export interface CheckboxAnswerPayload extends BaseAnswerPayload {
  type: typeof QUESTION_TYPE_KEY.CHECKBOX;
  optionIds: number[];
}

export interface TextareaAnswerPayload extends BaseAnswerPayload {
  type: typeof QUESTION_TYPE_KEY.TEXTAREA;
  text: string;
}

export interface TrueFalseAnswerPayload extends BaseAnswerPayload {
  type: typeof QUESTION_TYPE_KEY.TRUE_FALSE;
  value: boolean;
}

export interface ShortAnswerPayload extends BaseAnswerPayload {
  type: typeof QUESTION_TYPE_KEY.SHORT_ANSWER;
  text: string;
}

export interface NumericAnswerPayload extends BaseAnswerPayload {
  type: typeof QUESTION_TYPE_KEY.NUMERIC;
  value: number;
}

export interface FillBlankAnswerPayload extends BaseAnswerPayload {
  type: typeof QUESTION_TYPE_KEY.FILL_BLANK;
  answers: string[];
}

export interface FileUploadAnswerPayload extends BaseAnswerPayload {
  type: typeof QUESTION_TYPE_KEY.FILE_UPLOAD;
  fileId: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
}

export interface MatchingAnswerPayload extends BaseAnswerPayload {
  type: typeof QUESTION_TYPE_KEY.MATCHING;
  pairs: Array<{ left: string; right: string }>;
}

export interface OrderingAnswerPayload extends BaseAnswerPayload {
  type: typeof QUESTION_TYPE_KEY.ORDERING;
  orderedValues: string[];
}

export interface HotspotAnswerPayload extends BaseAnswerPayload {
  type: typeof QUESTION_TYPE_KEY.HOTSPOT;
  points: Array<{ x: number; y: number }>;
}

export interface LinkAnswerPayload extends BaseAnswerPayload {
  type: typeof QUESTION_TYPE_KEY.LINK;
  links: string[];
}
