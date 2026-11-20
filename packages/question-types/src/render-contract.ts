import type {
  ExerciseQuestionFileUploader,
  ExerciseQuestionImageUploader,
  ExerciseQuestionVideoRecordingUploader,
  ExerciseQuestionLabelKey,
  ExerciseQuestionLabels,
  ExerciseQuestionModel,
  ExerciseSubmissionModel,
  ExerciseRendererMode
} from './exercise-types';
import type { AnswerData } from './answer-data';
import { MATH_QUESTION_LABEL_DEFAULTS, type MathQuestionLabelKey } from './math-labels';

export interface ExerciseQuestionRenderContract {
  mode: ExerciseRendererMode;
  question: ExerciseQuestionModel;
  answer?: AnswerData | null;
  submissions?: ExerciseSubmissionModel[];
  maxSubmissionItems?: number;
  disabled?: boolean;
  labels?: ExerciseQuestionLabels;
  /** Platform-wide cap for exercise file uploads (megabytes). */
  platformMaxFileSizeMb?: number;
  onImageUpload?: ExerciseQuestionImageUploader;
  onFileUpload?: ExerciseQuestionFileUploader;
  onVideoRecordingUpload?: ExerciseQuestionVideoRecordingUploader;
}

export interface ExerciseQuestionListRenderContract {
  mode: ExerciseRendererMode;
  questions: ExerciseQuestionModel[];
  answersByKey?: Record<string, AnswerData>;
  /** Points earned per question key; multi-part questions show the sum of their parts. */
  scoresByKey?: Record<string, number>;
  submissions?: ExerciseSubmissionModel[];
  maxSubmissionItems?: number;
  disabled?: boolean;
  labels?: ExerciseQuestionLabels;
  /** Platform-wide cap for exercise file uploads (megabytes). */
  platformMaxFileSizeMb?: number;
  onImageUpload?: ExerciseQuestionImageUploader;
  onFileUpload?: ExerciseQuestionFileUploader;
  onVideoRecordingUpload?: ExerciseQuestionVideoRecordingUploader;
}

export function getExerciseQuestionLabel(
  labels: ExerciseQuestionLabels | undefined,
  key: ExerciseQuestionLabelKey,
  fallback = ''
): string {
  return labels?.[key] ?? fallback;
}

/** Reads a math renderer label, falling back to its English default. */
export function getMathQuestionLabel(labels: ExerciseQuestionLabels | undefined, key: MathQuestionLabelKey): string {
  return labels?.[key] ?? MATH_QUESTION_LABEL_DEFAULTS[key];
}

export function getExerciseQuestionContractKey(question: ExerciseQuestionModel, fallbackIndex = 0): string {
  if (question.key) return question.key;
  if (question.id !== undefined && question.id !== null) return String(question.id);
  return String(fallbackIndex);
}
