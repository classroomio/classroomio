import type { MathGradeReason, MathMisconception, MathRequiredForm } from './math-settings';

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

/** How the server graded a math answer: the reason the review view shows and the results grid groups by. */
export type MathAnswerGrading = {
  reason: MathGradeReason;
  matchedAnswer?: string;
  requiredForm?: MathRequiredForm;
  feedback?: string;
  misconception?: MathMisconception;
};

/** `mathjson` is the canonical MathJSON string from `normaliseMathAnswer`, set by the server for grouping answers. */
export type MathExpressionAnswerData = {
  type: 'MATH_EXPRESSION';
  latex: string;
  mathjson?: string;
  grading?: MathAnswerGrading;
};
export type WorkedSolutionFile = { kind: 'drawing' | 'photo'; fileKey: string; fileName: string; fileUrl?: string };
export type WorkedSolutionAnswerData = {
  type: 'WORKED_SOLUTION';
  latex: string;
  mathjson?: string;
  grading?: MathAnswerGrading;
  working: { lines: string[]; files: WorkedSolutionFile[] };
};

/** One step of a teacher rubric, as the AI reviewer and the grading popup read it. */
export type AiReviewStepMark = { stepId: string; awarded: number; max: number; comment?: string };

/** An AI suggestion for the working part of an answer; nothing here is a grade until a teacher accepts it. */
export type AiReview = {
  model: string;
  reviewedAt: string;
  rubricVersion: string;
  stepMarks: AiReviewStepMark[];
  /** Points suggested for the working: the sum of `stepMarks`. */
  suggestedPoints: number;
  maxPoints: number;
  firstWrongStep: string | null;
  comment: string;
  /** The reviewer's own certainty from 0 to 1. */
  confidence: number;
  /** Set when a teacher acted on the suggestion. */
  decision?: {
    status: 'accepted' | 'edited' | 'rejected';
    decidedAt: string;
    decidedBy: string;
    awardedPoints?: number;
  };
};

/** The teacher's decision for this answer's cluster, stamped from the question's `clusterOverrides` rule. */
export type AnswerClusterOverride = {
  key: string;
  verdict?: 'correct' | 'partial' | 'wrong';
  points?: number;
  feedback?: string;
  setBy: string;
  setAt: string;
};

/** Fields any answer can carry beside its type-specific data. */
export type AnswerExtras = {
  clusterOverride?: AnswerClusterOverride;
  /** The variant seed the student answered, for parameterised questions. */
  seed?: string;
  /** When the student first saw the question and when they gave this answer, ISO strings clamped by the API. Reporting only, never graded. */
  startedAt?: string;
  answeredAt?: string;
  aiReview?: AiReview;
};

export type AnswerData = (
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
  | WorkedSolutionAnswerData
) &
  AnswerExtras;
