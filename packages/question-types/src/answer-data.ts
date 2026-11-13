export type RadioAnswerData = { type: 'RADIO'; optionId: number };
export type CheckboxAnswerData = { type: 'CHECKBOX'; optionIds: number[] };
export type TrueFalseAnswerData = { type: 'TRUE_FALSE'; value: boolean };
export type ThumbsAnswerData = { type: 'THUMBS'; value: boolean };
export type TextareaAnswerData = { type: 'TEXTAREA'; text: string };
export type ShortAnswerData = { type: 'SHORT_ANSWER'; text: string };
/** `latex` holds what the student typed (e.g. `\frac{3}{4}`); `value` is its numeric value. */
export type NumericAnswerData = { type: 'NUMERIC'; value: number; latex?: string };
export type FillBlankAnswerData = { type: 'FILL_BLANK'; values: string[] };
export type WordBankAnswerData = { type: 'WORD_BANK'; filledBlanks: string[] };
export type FileUploadAnswerData = {
  type: 'FILE_UPLOAD';
  fileKey: string;
  fileName: string;
  mimeType?: string;
  size?: number;
  fileUrl?: string;
};
export type MatchingAnswerData = { type: 'MATCHING'; pairs: Array<{ left: string; right: string }> };
export type OrderingAnswerData = { type: 'ORDERING'; orderedValues: string[] };
export type LinkAnswerData = { type: 'LINK'; urls: string[] };
export type HotspotAnswerData = { type: 'HOTSPOT'; coordinates: Array<{ x: number; y: number }> };
export type StarAnswerData = { type: 'STAR'; value: number };
export type VideoRecordingAnswerData = {
  type: 'VIDEO_RECORDING';
  assetId: string;
  storageKey: string;
  fileName: string;
  mimeType: string;
  size: number;
  durationSeconds: number;
  recordedAt: string;
  uploadedAt: string;
  provider: 'cloudflare';
  retakeCount?: number;
  playbackUrl?: string;
};

/** `mathjson` is the canonical MathJSON string from `normaliseMathAnswer`, set by the server for grouping answers. */
export type MathExpressionAnswerData = { type: 'MATH_EXPRESSION'; latex: string; mathjson?: string };
export type WorkedSolutionFile = { kind: 'drawing' | 'photo'; fileKey: string; fileName: string; fileUrl?: string };
export type WorkedSolutionAnswerData = {
  type: 'WORKED_SOLUTION';
  latex: string;
  mathjson?: string;
  working: { lines: string[]; files: WorkedSolutionFile[] };
};

export type AnswerData =
  | RadioAnswerData
  | CheckboxAnswerData
  | TrueFalseAnswerData
  | ThumbsAnswerData
  | TextareaAnswerData
  | ShortAnswerData
  | NumericAnswerData
  | FillBlankAnswerData
  | WordBankAnswerData
  | FileUploadAnswerData
  | MatchingAnswerData
  | OrderingAnswerData
  | LinkAnswerData
  | HotspotAnswerData
  | StarAnswerData
  | VideoRecordingAnswerData
  | MathExpressionAnswerData
  | WorkedSolutionAnswerData;
