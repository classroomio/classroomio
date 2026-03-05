import type { ExerciseQuestionLabels } from '@cio/question-types';
import { t } from '$lib/utils/functions/translations';

/**
 * Returns translated labels for ExerciseQuestion UI components.
 *
 * Note: The same label keys exist in packages/storybook/src/molecules/exercise-question/question-labels.ts
 * with hardcoded English values for Storybook demos. When adding or changing labels for a question type,
 * update both files to keep them in sync.
 */
export function getExerciseQuestionLabels(): ExerciseQuestionLabels {
  return {
    'common.option_prefix': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.common.option_prefix'
    ),
    'common.remove': t.get('course.navItem.lessons.exercises.all_exercises.shared_question.common.remove'),
    'common.add_option': t.get('course.navItem.lessons.exercises.all_exercises.shared_question.common.add_option'),
    'common.correct_badge': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.common.correct_badge'
    ),
    'common.not_set': t.get('course.navItem.lessons.exercises.all_exercises.shared_question.common.not_set'),
    'navigation.previous': t.get('course.navItem.lessons.exercises.all_exercises.shared_question.navigation.previous'),
    'navigation.next': t.get('course.navItem.lessons.exercises.all_exercises.shared_question.navigation.next'),
    'navigation.finish': t.get('course.navItem.lessons.exercises.all_exercises.shared_question.navigation.finish'),
    'question.edit.title_label': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.question.edit.title_label'
    ),
    'question.edit.title_placeholder': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.question.edit.title_placeholder'
    ),
    'question.edit.description_label': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.question.edit.description_label'
    ),
    'question.edit.description_placeholder': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.question.edit.description_placeholder'
    ),
    'question.edit.add_description': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.question.edit.add_description'
    ),
    'question.edit.remove_description': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.question.edit.remove_description'
    ),
    'question.edit.media_menu_sr': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.question.edit.media_menu_sr'
    ),
    'question.edit.add_image': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.question.edit.add_image'
    ),
    'question.edit.add_video': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.question.edit.add_video'
    ),
    'question.edit.remove_image_tooltip': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.question.edit.remove_image_tooltip'
    ),
    'question.edit.remove_image_sr': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.question.edit.remove_image_sr'
    ),
    'question.edit.remove_video_tooltip': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.question.edit.remove_video_tooltip'
    ),
    'question.edit.remove_video_sr': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.question.edit.remove_video_sr'
    ),
    'question.edit.image_alt': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.question.edit.image_alt'
    ),
    'question.edit.video_modal_title': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.question.edit.video_modal_title'
    ),
    'question.edit.video_link_label': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.question.edit.video_link_label'
    ),
    'question.edit.video_link_placeholder': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.question.edit.video_link_placeholder'
    ),
    'question.edit.video_add_button': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.question.edit.video_add_button'
    ),
    'question.edit.video_invalid_link': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.question.edit.video_invalid_link'
    ),
    'question.edit.upload_error_only_images': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.question.edit.upload_error_only_images'
    ),
    'question.edit.upload_error_skipped': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.question.edit.upload_error_skipped'
    ),
    'question.edit.upload_error_failed': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.question.edit.upload_error_failed'
    ),
    'radio.edit.helper': t.get('course.navItem.lessons.exercises.all_exercises.shared_question.radio.edit.helper'),
    'radio.edit.correct_selected_tooltip': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.radio.edit.correct_selected_tooltip'
    ),
    'radio.edit.mark_correct_tooltip': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.radio.edit.mark_correct_tooltip'
    ),
    'radio.edit.mark_correct_sr': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.radio.edit.mark_correct_sr'
    ),
    'checkbox.edit.helper': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.checkbox.edit.helper'
    ),
    'checkbox.edit.correct_selected_tooltip': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.checkbox.edit.correct_selected_tooltip'
    ),
    'checkbox.edit.toggle_correct_tooltip': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.checkbox.edit.toggle_correct_tooltip'
    ),
    'checkbox.edit.toggle_correct_sr': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.checkbox.edit.toggle_correct_sr'
    ),
    'true_false.true_label': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.true_false.true_label'
    ),
    'true_false.false_label': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.true_false.false_label'
    ),
    'true_false.edit.correct_answer_label': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.true_false.edit.correct_answer_label'
    ),
    'true_false.preview.correct_value_label': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.true_false.preview.correct_value_label'
    ),
    'short_answer.edit.instructions_placeholder': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.short_answer.edit.instructions_placeholder'
    ),
    'short_answer.take.placeholder': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.short_answer.take.placeholder'
    ),
    'short_answer.preview.helper': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.short_answer.preview.helper'
    ),
    'numeric.edit.correct_value_label': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.numeric.edit.correct_value_label'
    ),
    'numeric.edit.correct_value_info': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.numeric.edit.correct_value_info'
    ),
    'numeric.edit.tolerance_label': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.numeric.edit.tolerance_label'
    ),
    'numeric.edit.tolerance_info': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.numeric.edit.tolerance_info'
    ),
    'numeric.edit.correct_value_placeholder': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.numeric.edit.correct_value_placeholder'
    ),
    'numeric.edit.tolerance_placeholder': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.numeric.edit.tolerance_placeholder'
    ),
    'numeric.take.placeholder': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.numeric.take.placeholder'
    ),
    'numeric.preview.correct_value_label': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.numeric.preview.correct_value_label'
    ),
    'numeric.preview.tolerance_label': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.numeric.preview.tolerance_label'
    ),
    'fill_blank.edit.accepted_answers_placeholder': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.fill_blank.edit.accepted_answers_placeholder'
    ),
    'fill_blank.take.placeholder': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.fill_blank.take.placeholder'
    ),
    'fill_blank.preview.accepted_answers_label': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.fill_blank.preview.accepted_answers_label'
    ),
    'file_upload.edit.accepted_types_placeholder': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.file_upload.edit.accepted_types_placeholder'
    ),
    'file_upload.edit.max_size_placeholder': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.file_upload.edit.max_size_placeholder'
    ),
    'file_upload.take.selected_file_label': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.file_upload.take.selected_file_label'
    ),
    'file_upload.take.upload_button': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.file_upload.take.upload_button'
    ),
    'file_upload.take.upload_progress': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.file_upload.take.upload_progress'
    ),
    'file_upload.take.upload_error': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.file_upload.take.upload_error'
    ),
    'file_upload.take.view': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.file_upload.take.view'
    ),
    'file_upload.take.download': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.file_upload.take.download'
    ),
    'file_upload.preview.accepted_types_label': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.file_upload.preview.accepted_types_label'
    ),
    'file_upload.preview.max_size_label': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.file_upload.preview.max_size_label'
    ),
    'link.edit.instructions_placeholder': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.link.edit.instructions_placeholder'
    ),
    'link.edit.helper': t.get('course.navItem.lessons.exercises.all_exercises.shared_question.link.edit.helper'),
    'link.take.helper': t.get('course.navItem.lessons.exercises.all_exercises.shared_question.link.take.helper'),
    'link.take.placeholder': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.link.take.placeholder'
    ),
    'link.take.remove_tooltip': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.link.take.remove_tooltip'
    ),
    'link.take.remove_sr': t.get('course.navItem.lessons.exercises.all_exercises.shared_question.link.take.remove_sr'),
    'link.take.invalid_url_error': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.link.take.invalid_url_error'
    ),
    'link.take.add_button': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.link.take.add_button'
    ),
    'link.preview.empty': t.get('course.navItem.lessons.exercises.all_exercises.shared_question.link.preview.empty'),
    'link.preview.item_label': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.link.preview.item_label'
    ),
    'matching.edit.helper': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.matching.edit.helper'
    ),
    'matching.take.placeholder': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.matching.take.placeholder'
    ),
    'matching.preview.helper': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.matching.preview.helper'
    ),
    'ordering.fallback_step_prefix': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.ordering.fallback_step_prefix'
    ),
    'ordering.edit.helper': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.ordering.edit.helper'
    ),
    'ordering.edit.add_step': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.ordering.edit.add_step'
    ),
    'ordering.edit.empty': t.get('course.navItem.lessons.exercises.all_exercises.shared_question.ordering.edit.empty'),
    'ordering.edit.step_placeholder': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.ordering.edit.step_placeholder'
    ),
    'ordering.edit.remove_step_tooltip': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.ordering.edit.remove_step_tooltip'
    ),
    'ordering.take.helper': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.ordering.take.helper'
    ),
    'ordering.take.empty': t.get('course.navItem.lessons.exercises.all_exercises.shared_question.ordering.take.empty'),
    'ordering.preview.submitted_label': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.ordering.preview.submitted_label'
    ),
    'ordering.preview.expected_label': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.ordering.preview.expected_label'
    ),
    'ordering.preview.matches': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.ordering.preview.matches'
    ),
    'ordering.preview.differs': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.ordering.preview.differs'
    ),
    'hotspot.edit.helper': t.get('course.navItem.lessons.exercises.all_exercises.shared_question.hotspot.edit.helper'),
    'hotspot.take.placeholder': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.hotspot.take.placeholder'
    ),
    'hotspot.preview.helper': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.hotspot.preview.helper'
    ),
    'textarea.edit.placeholder': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.textarea.edit.placeholder'
    ),
    'textarea.take.placeholder': t.get(
      'course.navItem.lessons.exercises.all_exercises.shared_question.textarea.take.placeholder'
    ),
    'submission.common.no_answer': t.get('course.navItem.lessons.exercises.all_exercises.analytics.individual.no'),
    'submission.common.other': t.get('course.navItem.lessons.exercises.all_exercises.analytics.summary.other'),
    'submission.chart.responses': t.get('course.navItem.lessons.exercises.all_exercises.analytics.summary.responses'),
    'submission.chart.no_data': t.get('course.navItem.lessons.exercises.all_exercises.analytics.summary.no_responses'),
    'submission.list.responses': t.get('course.navItem.lessons.exercises.all_exercises.analytics.summary.responses'),
    'submission.list.no_responses': t.get(
      'course.navItem.lessons.exercises.all_exercises.analytics.summary.no_responses'
    )
  };
}
