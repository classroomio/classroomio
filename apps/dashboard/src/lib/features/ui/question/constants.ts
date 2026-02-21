import { QUESTION_TYPE } from '@cio/utils/validation/constants';

export const QUESTION_TYPES = [
  {
    id: QUESTION_TYPE.RADIO,
    label: 'course.navItem.lessons.exercises.all_exercises.edit_mode.question_types.single'
  },
  {
    id: QUESTION_TYPE.CHECKBOX,
    label: 'course.navItem.lessons.exercises.all_exercises.edit_mode.question_types.multiple'
  },
  {
    id: QUESTION_TYPE.TEXTAREA,
    label: 'course.navItem.lessons.exercises.all_exercises.edit_mode.question_types.paragraph'
  }
];

export const QUESTION_TEMPLATE = {
  id: 1,
  title: '',
  type: QUESTION_TYPE.RADIO,
  answers: [],
  options: [
    {
      id: 1,
      value: null
    }
  ]
};
