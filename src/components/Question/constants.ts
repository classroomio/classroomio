export const QUESTION_TYPE = {
  RADIO: 1,
  CHECKBOX: 2,
  TEXTAREA: 3,
};

export const QUESTION_TYPES = [
  {
    id: QUESTION_TYPE.RADIO,
    label: 'Single answer',
  },
  {
    id: QUESTION_TYPE.CHECKBOX,
    label: 'Multiple answers',
  },
  {
    id: QUESTION_TYPE.TEXTAREA,
    label: 'Paragraph',
  },
];

export const QUESTION_TEMPLATE = {
  id: 1,
  title: '',
  type: QUESTION_TYPE.RADIO,
  answers: [],
  options: [
    {
      id: 1,
      value: null,
    },
  ],
};
