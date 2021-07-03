export const QUESTION_TYPE = {
  RADIO: "RADIO",
  CHECKBOX: "CHECKBOX",
  TEXTAREA: "TEXTAREA",
};

export const QUESTION_TYPES = [
  {
    id: QUESTION_TYPE.RADIO,
    text: "Single answer",
  },
  {
    id: QUESTION_TYPE.CHECKBOX,
    text: "Multiple answers",
  },
  {
    id: QUESTION_TYPE.TEXTAREA,
    text: "Paragraph",
  },
];

export const QUESTION_TEMPLATE = {
  id: 1,
  title: "",
  code: "",
  type: QUESTION_TYPE.RADIO,
  options: [
    {
      id: 1,
      value: null,
    },
  ],
};
