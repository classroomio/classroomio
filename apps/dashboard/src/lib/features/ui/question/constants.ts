import { QUESTION_TYPE_KEY, QUESTION_TYPE_REGISTRY, type QuestionTypeKey } from '@cio/question-types';

/** Question types that require a paid plan. On free plan, these show a premium icon and open upgrade modal on click. */
export const PREMIUM_QUESTION_TYPE_KEYS = new Set<QuestionTypeKey>([
  QUESTION_TYPE_KEY.FILE_UPLOAD,
  QUESTION_TYPE_KEY.ORDERING,
  QUESTION_TYPE_KEY.LINK
]);

const QUESTION_TYPE_LABEL_KEYS: Partial<Record<QuestionTypeKey, string>> = {
  [QUESTION_TYPE_KEY.RADIO]: 'course.navItem.lessons.exercises.all_exercises.edit_mode.question_types.single',
  [QUESTION_TYPE_KEY.CHECKBOX]: 'course.navItem.lessons.exercises.all_exercises.edit_mode.question_types.multiple',
  [QUESTION_TYPE_KEY.TEXTAREA]: 'course.navItem.lessons.exercises.all_exercises.edit_mode.question_types.paragraph',
  [QUESTION_TYPE_KEY.TRUE_FALSE]: 'course.navItem.lessons.exercises.all_exercises.edit_mode.question_types.true_false',
  [QUESTION_TYPE_KEY.SHORT_ANSWER]:
    'course.navItem.lessons.exercises.all_exercises.edit_mode.question_types.short_answer',
  [QUESTION_TYPE_KEY.NUMERIC]: 'course.navItem.lessons.exercises.all_exercises.edit_mode.question_types.numeric',
  [QUESTION_TYPE_KEY.FILL_BLANK]: 'course.navItem.lessons.exercises.all_exercises.edit_mode.question_types.fill_blank',
  [QUESTION_TYPE_KEY.FILE_UPLOAD]:
    'course.navItem.lessons.exercises.all_exercises.edit_mode.question_types.file_upload',
  [QUESTION_TYPE_KEY.MATCHING]: 'course.navItem.lessons.exercises.all_exercises.edit_mode.question_types.matching',
  [QUESTION_TYPE_KEY.ORDERING]: 'course.navItem.lessons.exercises.all_exercises.edit_mode.question_types.ordering',
  [QUESTION_TYPE_KEY.HOTSPOT]: 'course.navItem.lessons.exercises.all_exercises.edit_mode.question_types.hotspot',
  [QUESTION_TYPE_KEY.LINK]: 'course.navItem.lessons.exercises.all_exercises.edit_mode.question_types.link'
};

// Temp hidden: MATCHING, HOTSPOT
const HIDDEN_QUESTION_TYPE_KEYS = new Set<QuestionTypeKey>([QUESTION_TYPE_KEY.MATCHING, QUESTION_TYPE_KEY.HOTSPOT]);

export const QUESTION_TYPES = QUESTION_TYPE_REGISTRY.filter((qt) => !HIDDEN_QUESTION_TYPE_KEYS.has(qt.key)).map(
  (questionType) => ({
    id: questionType.id,
    key: questionType.key,
    label: questionType.label,
    labelKey: QUESTION_TYPE_LABEL_KEYS[questionType.key]
  })
);

export const DEFAULT_QUESTION_TYPE = QUESTION_TYPES.find(
  (questionType) => questionType.key === QUESTION_TYPE_KEY.RADIO
) ??
  QUESTION_TYPES[0] ?? {
    id: 1,
    key: QUESTION_TYPE_KEY.RADIO,
    label: 'Single answer',
    labelKey: 'course.navItem.lessons.exercises.all_exercises.edit_mode.question_types.single'
  };

export const QUESTION_TEMPLATE = {
  id: 1,
  title: '',
  type: DEFAULT_QUESTION_TYPE.id,
  answers: [],
  options: [
    {
      id: 1,
      value: null
    }
  ]
};
