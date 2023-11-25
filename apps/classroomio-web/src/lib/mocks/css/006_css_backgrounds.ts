import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'CSS Background Quiz',
  description: 'Test your knowledge of CSS backgrounds',
  questionnaire: {
    questions: [
      {
        title: 'Which CSS property is used to set the background color of an element?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'background-color', is_correct: true },
          { label: 'color', is_correct: false },
          { label: 'text-color', is_correct: false }
        ]
      },
      {
        title: 'How do you specify a background image in CSS?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'image-url', is_correct: false },
          { label: 'background-image', is_correct: true },
          { label: 'img-src', is_correct: false }
        ]
      },
      {
        title:
          'Which property is used to repeat a background image both horizontally and vertically?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'background-repeat', is_correct: true },
          { label: 'repeat-both', is_correct: false },
          { label: 'background-style', is_correct: false }
        ]
      },
      {
        title: 'How can you make a background image not repeat?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'no-repeat', is_correct: true },
          { label: 'background-repeat: none;', is_correct: false },
          { label: 'repeat: none;', is_correct: false }
        ]
      },
      {
        title: 'What is the purpose of the "background-size" property in CSS?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To set the size of the element', is_correct: false },
          { label: 'To control the size of the background image', is_correct: true },
          { label: 'To set the font size', is_correct: false }
        ]
      },
      {
        title: 'Explain the difference between "background-image" and "background-color" in CSS.',
        name: 'q6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you add a background color to an element in CSS?',
        name: 'q7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What CSS property is used to specify the position of a background image?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'background-position', is_correct: true },
          { label: 'image-position', is_correct: false },
          { label: 'position-image', is_correct: false }
        ]
      },
      {
        title: 'How do you set the background image to be fixed (not scrollable) in CSS?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'background-attachment: fixed;', is_correct: true },
          { label: 'background-scroll: none;', is_correct: false },
          { label: 'background-fixed: true;', is_correct: false }
        ]
      },
      {
        title: 'Can you apply multiple background images to a single element in CSS?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'No, only one background image is allowed per element', is_correct: false },
          { label: 'Yes, using the "background-image" property multiple times', is_correct: false },
          {
            label: 'Yes, using the "background-image" property with a comma-separated list',
            is_correct: true
          }
        ]
      }
    ]
  }
};

export default template;
