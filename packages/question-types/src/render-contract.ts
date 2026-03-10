import type {
  ExerciseQuestionFileUploader,
  ExerciseQuestionImageUploader,
  ExerciseQuestionLabelKey,
  ExerciseQuestionLabels,
  ExerciseQuestionModel,
  ExerciseSubmissionModel,
  ExerciseRendererMode
} from './exercise-types';
import type { AnswerData } from './answer-data';

export interface ExerciseQuestionRenderContract {
  mode: ExerciseRendererMode;
  question: ExerciseQuestionModel;
  answer?: AnswerData | null;
  submissions?: ExerciseSubmissionModel[];
  maxSubmissionItems?: number;
  disabled?: boolean;
  labels?: ExerciseQuestionLabels;
  onImageUpload?: ExerciseQuestionImageUploader;
  onFileUpload?: ExerciseQuestionFileUploader;
}

export interface ExerciseQuestionListRenderContract {
  mode: ExerciseRendererMode;
  questions: ExerciseQuestionModel[];
  answersByKey?: Record<string, AnswerData>;
  submissions?: ExerciseSubmissionModel[];
  maxSubmissionItems?: number;
  disabled?: boolean;
  labels?: ExerciseQuestionLabels;
  onImageUpload?: ExerciseQuestionImageUploader;
  onFileUpload?: ExerciseQuestionFileUploader;
}

export function getExerciseQuestionLabel(
  labels: ExerciseQuestionLabels | undefined,
  key: ExerciseQuestionLabelKey,
  fallback = ''
): string {
  return labels?.[key] ?? fallback;
}

export function getExerciseQuestionContractKey(question: ExerciseQuestionModel, fallbackIndex = 0): string {
  if (question.key) return question.key;
  if (question.id !== undefined && question.id !== null) return String(question.id);
  return String(fallbackIndex);
}
