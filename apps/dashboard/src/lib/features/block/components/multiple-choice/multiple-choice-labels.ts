import type { MultipleChoiceBlockLabels } from '@cio/ui/custom/block';
import { t } from '$lib/utils/functions/translations';

const KEY = 'course.navItem.lessons.materials.blocks.multiple_choice';

export function getMultipleChoiceLabels(): MultipleChoiceBlockLabels {
  return {
    editHint: t.get(`${KEY}.edit_hint`),
    learnerHint: t.get(`${KEY}.learner_hint`),
    questionPlaceholder: t.get(`${KEY}.question_placeholder`),
    optionPlaceholder: t.get(`${KEY}.option_placeholder`),
    markCorrect: t.get(`${KEY}.mark_correct`),
    correctBadge: t.get(`${KEY}.correct_badge`),
    addOption: t.get(`${KEY}.add_option`),
    removeOption: t.get(`${KEY}.remove_option`),
    addMedia: t.get(`${KEY}.add_media`),
    imageOption: t.get('course.navItem.lessons.materials.blocks.types.image'),
    removeImage: t.get(`${KEY}.remove_image`),
    check: t.get(`${KEY}.check`),
    tryAgain: t.get(`${KEY}.try_again`),
    correctFeedback: t.get(`${KEY}.correct_feedback`),
    wrongFeedback: t.get(`${KEY}.wrong_feedback`)
  };
}

export function getMultipleChoiceExampleCopy() {
  return {
    question: t.get(`${KEY}.example.question`),
    correctOption: t.get(`${KEY}.example.correct_option`),
    otherOptions: [t.get(`${KEY}.example.other_option_1`), t.get(`${KEY}.example.other_option_2`)]
  };
}

export function getNewOptionText(): string {
  return t.get(`${KEY}.new_option`);
}
