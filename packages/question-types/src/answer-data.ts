export type RadioAnswerData = { type: 'RADIO'; optionId: number };
export type CheckboxAnswerData = { type: 'CHECKBOX'; optionIds: number[] };
export type TrueFalseAnswerData = { type: 'TRUE_FALSE'; value: boolean };
export type TextareaAnswerData = { type: 'TEXTAREA'; text: string };
export type ShortAnswerData = { type: 'SHORT_ANSWER'; text: string };
export type NumericAnswerData = { type: 'NUMERIC'; value: number };
export type FillBlankAnswerData = { type: 'FILL_BLANK'; values: string[] };
export type FileUploadAnswerData = {
  type: 'FILE_UPLOAD';
  fileKey: string;
  fileName: string;
  mimeType?: string;
  size?: number;
};
export type MatchingAnswerData = { type: 'MATCHING'; pairs: Array<{ left: string; right: string }> };
export type OrderingAnswerData = { type: 'ORDERING'; orderedValues: string[] };
export type LinkAnswerData = { type: 'LINK'; urls: string[] };
export type HotspotAnswerData = { type: 'HOTSPOT'; coordinates: Array<{ x: number; y: number }> };

export type AnswerData =
  | RadioAnswerData
  | CheckboxAnswerData
  | TrueFalseAnswerData
  | TextareaAnswerData
  | ShortAnswerData
  | NumericAnswerData
  | FillBlankAnswerData
  | FileUploadAnswerData
  | MatchingAnswerData
  | OrderingAnswerData
  | LinkAnswerData
  | HotspotAnswerData;
