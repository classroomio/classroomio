import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'CSS Table Quiz',
  description: 'Test your knowledge of CSS table styling',
  questionnaire: {
    questions: [
      {
        title: 'Which CSS property is used to set the width of a table border?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'table-width', is_correct: false },
          { label: 'border-width', is_correct: true },
          { label: 'table-border-width', is_correct: false },
          { label: 'width', is_correct: false },
        ],
      },
      {
        title: 'How can you set the background color for a table row?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'row-color', is_correct: false },
          { label: 'background-row', is_correct: false },
          { label: 'row-background-color', is_correct: false },
          { label: 'background-color', is_correct: true },
        ],
      },
      {
        title: 'What CSS property is used to remove the spacing between table cells?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'table-spacing', is_correct: false },
          { label: 'cell-spacing', is_correct: false },
          { label: 'spacing', is_correct: false },
          { label: 'border-collapse', is_correct: true },
        ],
      },
      {
        title: 'How do you align text to the right within a table cell?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'text-align: right;', is_correct: true },
          { label: 'align-text: right;', is_correct: false },
          { label: 'text-align: center;', is_correct: false },
          { label: 'align-text: center;', is_correct: false },
        ],
      },
      {
        title: 'Explain the purpose of the "border-collapse" property in CSS table styling.',
        name: 'q5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'What is the default value of the "border-collapse" property for a table?',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'separate', is_correct: false },
          { label: 'collapse', is_correct: true },
          { label: 'hidden', is_correct: false },
          { label: 'inherit', is_correct: false },
        ],
      },
      {
        title: 'How can you set the width of a table to be a percentage of its containing element?',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'table-width: 50%;', is_correct: false },
          { label: 'width: 50%;', is_correct: true },
          { label: 'table-size: 50%;', is_correct: false },
          { label: 'size: 50%;', is_correct: false },
        ],
      },
      {
        title: 'What is the purpose of the "table-layout" property in CSS table styling?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To set the table width', is_correct: false },
          { label: 'To control the layout algorithm used for the table', is_correct: true },
          { label: 'To set the border-collapse value', is_correct: false },
          { label: 'To control the spacing between table cells', is_correct: false },
        ],
      },
      {
        title: 'How can you add a border to a table cell?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'cell-border: 1px;', is_correct: false },
          { label: 'border-cell: 1px;', is_correct: false },
          { label: 'border: 1px solid;', is_correct: true },
          { label: 'table-cell-border: 1px;', is_correct: false },
        ],
      },
      {
        title: 'How can you center-align a table on a web page?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'align: center;', is_correct: false },
          { label: 'text-align: center;', is_correct: false },
          { label: 'center-align: true;', is_correct: false },
          { label: 'margin: 0 auto;', is_correct: true },
        ],
      },
    ],
  },
};


export default template;
