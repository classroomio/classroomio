import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'CSS Dimension Quiz',
  description: 'Test your knowledge of CSS dimension properties',
  questionnaire: {
    questions: [
      {
        title: 'Which CSS property is used to set the height and width of an element?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'size', is_correct: false },
          { label: 'dimensions', is_correct: false },
          { label: 'height-width', is_correct: false },
          { label: 'width-height', is_correct: false },
          { label: 'height and width', is_correct: true }
        ]
      },
      {
        title: 'How do you set the height of an element to 100 pixels in CSS?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'height: 100px;', is_correct: true },
          { label: 'height: 100;', is_correct: false },
          { label: 'height: 100pixels;', is_correct: false },
          { label: 'size: 100px;', is_correct: false }
        ]
      },
      {
        title: 'What is the default value of the "width" property in CSS?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'auto', is_correct: true },
          { label: '100%', is_correct: false },
          { label: '0', is_correct: false },
          { label: '10px', is_correct: false }
        ]
      },
      {
        title: 'What is the CSS property used to set the maximum width of an element?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'max-height', is_correct: false },
          { label: 'maximum-width', is_correct: false },
          { label: 'max-width', is_correct: true },
          { label: 'maximum-height', is_correct: false }
        ]
      },
      {
        title: 'Explain the use of the "min-height" and "min-width" properties in CSS.',
        name: 'q5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How do you set the width of an element to be relative to the width of its containing element?',
        name: 'q6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the purpose of the "box-sizing" property in CSS related to dimensions?',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label:
              "To control how the width and height are calculated in relation to the element's total width and height",
            is_correct: true
          },
          { label: 'To change the background color', is_correct: false },
          { label: 'To hide the element', is_correct: false }
        ]
      },
      {
        title: 'How do you create a square element in CSS with equal width and height?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'width: 100%; height: 100%;', is_correct: true },
          { label: 'width: 100px; height: 100px;', is_correct: false },
          { label: 'width: auto; height: auto;', is_correct: false },
          { label: 'width: 1; height: 1;', is_correct: false }
        ]
      },
      {
        title: 'How do you set the minimum width and height of an element to be 100 pixels using CSS?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'min-size: 100px;', is_correct: false },
          { label: 'min-width: 100px; min-height: 100px;', is_correct: true },
          { label: 'minimum-width: 100px; minimum-height: 100px;', is_correct: false },
          { label: 'width-min: 100px; height-min: 100px;', is_correct: false }
        ]
      },
      {
        title:
          'What is the CSS property used to control how an element should be positioned in relation to other elements?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'position', is_correct: true },
          { label: 'alignment', is_correct: false },
          { label: 'layout', is_correct: false },
          { label: 'spacing', is_correct: false }
        ]
      }
    ]
  }
};

export default template;
