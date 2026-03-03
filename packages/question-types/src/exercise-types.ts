import type { QuestionTypeKey } from './question-type-keys';

export type ExerciseQuestionTypeKey = QuestionTypeKey;

export type ExerciseRendererMode = 'edit' | 'take' | 'preview' | 'view';

export type ExerciseQuestionLabelKey =
  | 'common.option_prefix'
  | 'common.remove'
  | 'common.add_option'
  | 'common.correct_badge'
  | 'common.not_set'
  | 'navigation.previous'
  | 'navigation.next'
  | 'navigation.finish'
  | 'question.edit.title_label'
  | 'question.edit.title_placeholder'
  | 'question.edit.description_label'
  | 'question.edit.description_placeholder'
  | 'question.edit.add_description'
  | 'question.edit.remove_description'
  | 'question.edit.media_menu_sr'
  | 'question.edit.add_image'
  | 'question.edit.add_video'
  | 'question.edit.remove_image_tooltip'
  | 'question.edit.remove_image_sr'
  | 'question.edit.remove_video_tooltip'
  | 'question.edit.remove_video_sr'
  | 'question.edit.image_alt'
  | 'question.edit.video_modal_title'
  | 'question.edit.video_link_label'
  | 'question.edit.video_link_placeholder'
  | 'question.edit.video_add_button'
  | 'question.edit.video_invalid_link'
  | 'question.edit.upload_error_only_images'
  | 'question.edit.upload_error_skipped'
  | 'question.edit.upload_error_failed'
  | 'radio.edit.helper'
  | 'radio.edit.correct_selected_tooltip'
  | 'radio.edit.mark_correct_tooltip'
  | 'radio.edit.mark_correct_sr'
  | 'checkbox.edit.helper'
  | 'checkbox.edit.correct_selected_tooltip'
  | 'checkbox.edit.toggle_correct_tooltip'
  | 'checkbox.edit.toggle_correct_sr'
  | 'true_false.true_label'
  | 'true_false.false_label'
  | 'true_false.edit.correct_answer_label'
  | 'true_false.preview.correct_value_label'
  | 'short_answer.edit.instructions_placeholder'
  | 'short_answer.take.placeholder'
  | 'short_answer.preview.helper'
  | 'numeric.edit.correct_value_label'
  | 'numeric.edit.correct_value_info'
  | 'numeric.edit.tolerance_label'
  | 'numeric.edit.tolerance_info'
  | 'numeric.edit.correct_value_placeholder'
  | 'numeric.edit.tolerance_placeholder'
  | 'numeric.take.placeholder'
  | 'numeric.preview.correct_value_label'
  | 'numeric.preview.tolerance_label'
  | 'fill_blank.edit.accepted_answers_placeholder'
  | 'fill_blank.take.placeholder'
  | 'fill_blank.preview.accepted_answers_label'
  | 'file_upload.edit.accepted_types_placeholder'
  | 'file_upload.edit.max_size_placeholder'
  | 'file_upload.take.selected_file_label'
  | 'file_upload.take.upload_button'
  | 'file_upload.take.upload_progress'
  | 'file_upload.take.upload_error'
  | 'file_upload.take.download'
  | 'file_upload.take.view'
  | 'file_upload.preview.accepted_types_label'
  | 'file_upload.preview.max_size_label'
  | 'link.edit.instructions_placeholder'
  | 'link.edit.helper'
  | 'link.take.helper'
  | 'link.take.placeholder'
  | 'link.take.remove_tooltip'
  | 'link.take.remove_sr'
  | 'link.take.invalid_url_error'
  | 'link.take.add_button'
  | 'link.preview.empty'
  | 'link.preview.item_label'
  | 'matching.edit.helper'
  | 'matching.take.placeholder'
  | 'matching.preview.helper'
  | 'ordering.fallback_step_prefix'
  | 'ordering.edit.helper'
  | 'ordering.edit.add_step'
  | 'ordering.edit.empty'
  | 'ordering.edit.step_placeholder'
  | 'ordering.edit.remove_step_tooltip'
  | 'ordering.take.helper'
  | 'ordering.take.empty'
  | 'ordering.preview.submitted_label'
  | 'ordering.preview.expected_label'
  | 'ordering.preview.matches'
  | 'ordering.preview.differs'
  | 'hotspot.edit.helper'
  | 'hotspot.take.placeholder'
  | 'hotspot.preview.helper'
  | 'textarea.edit.placeholder'
  | 'textarea.take.placeholder';

export type ExerciseQuestionLabels = Partial<Record<ExerciseQuestionLabelKey, string>>;

export interface ExerciseQuestionOption {
  id?: number | string;
  label: string;
  value?: string;
  isCorrect?: boolean;
  settings?: Record<string, unknown>;
}

export interface ExerciseQuestionModel {
  id?: number | string;
  key?: string;
  title: string;
  questionType: ExerciseQuestionTypeKey;
  points?: number;
  required?: boolean;
  options?: ExerciseQuestionOption[];
  settings?: Record<string, unknown>;
}

export type ExerciseAnswerValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | Record<string, unknown>
  | null
  | undefined;

export type ExerciseQuestionImageUploader = (file: File) => Promise<string>;

export type ExerciseQuestionFileUploader = (
  file: File
) => Promise<{ fileKey: string; fileName: string; fileUrl?: string }>;

export interface ExerciseRendererDefinition<TRenderer = unknown> {
  edit: TRenderer;
  take: TRenderer;
  preview: TRenderer;
}

export interface ExerciseQuestionRendererProps {
  question: ExerciseQuestionModel;
  answer?: ExerciseAnswerValue;
  disabled?: boolean;
  labels?: ExerciseQuestionLabels;
  onAnswerChange?: (answer: ExerciseAnswerValue) => void;
  onQuestionChange?: (question: ExerciseQuestionModel) => void;
  onImageUpload?: ExerciseQuestionImageUploader;
  onFileUpload?: ExerciseQuestionFileUploader;
}
