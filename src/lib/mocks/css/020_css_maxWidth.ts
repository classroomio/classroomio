import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'CSS Max-Width Quiz',
  description: 'Test your knowledge of CSS max-width property',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of the CSS "max-width" property?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'Which CSS property is used to set the maximum width of an element?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'max-height', is_correct: false },
          { label: 'min-width', is_correct: false },
          { label: 'width', is_correct: false },
          { label: 'max-width', is_correct: true },
        ],
      },
      {
        title: 'What is the default value of the "max-width" property?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'auto', is_correct: true },
          { label: '100%', is_correct: false },
          { label: '0', is_correct: false },
          { label: 'none', is_correct: false },
        ],
      },
      {
        title: 'How can you make sure an image never exceeds a specified width?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'max-width: 100%;', is_correct: true },
          { label: 'max-width: none;', is_correct: false },
          { label: 'max-width: auto;', is_correct: false },
          { label: 'max-width: inherit;', is_correct: false },
        ],
      },
      {
        title: 'What is the effect of setting "max-width" to "none"?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'When should you use the "max-width" property in CSS?',
        name: 'q6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'Which CSS property is used to set the maximum width of an image?',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'image-max-width', is_correct: false },
          { label: 'img-width', is_correct: false },
          { label: 'width-max', is_correct: false },
          { label: 'max-width', is_correct: true },
        ],
      },
      {
        title: 'What happens if the content of an element exceeds its "max-width"?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'How can you center-align a block-level element with a maximum width?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'text-align: center;', is_correct: false },
          { label: 'margin: 0 auto;', is_correct: true },
          { label: 'align: center;', is_correct: false },
          { label: 'position: center;', is_correct: false },
        ],
      },
      {
        title: 'What is the syntax for setting a specific maximum width in CSS using "max-width"?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      }
    ],
  },
};


export default template;
