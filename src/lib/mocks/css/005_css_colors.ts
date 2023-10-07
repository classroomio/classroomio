import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'CSS Colors Quiz',
  description: 'Test your knowledge of CSS colors',
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
          { label: 'text-color', is_correct: false },
        ],
      },
      {
        title: 'How do you specify a color in CSS using hexadecimal notation?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '#RRGGBB', is_correct: true },
          { label: 'rgb(R, G, B)', is_correct: false },
          { label: 'color: name;', is_correct: false },
        ],
      },
      {
        title: 'Which CSS property is used to set the text color of an element?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'color', is_correct: true },
          { label: 'text-color', is_correct: false },
          { label: 'background-color', is_correct: false },
        ],
      },
      {
        title: 'What is the CSS property for setting the transparency of an element?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'opacity', is_correct: true },
          { label: 'transparent', is_correct: false },
          { label: 'visibility', is_correct: false },
        ],
      },
      {
        title: 'Which color code represents fully transparent?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'rgba(0, 0, 0, 0)', is_correct: true },
          { label: 'rgba(255, 255, 255, 1)', is_correct: false },
          { label: 'rgb(0, 0, 0)', is_correct: false },
        ],
      },
      {
        title: 'Explain the difference between RGB and hexadecimal color notations in CSS.',
        name: 'q6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'What is the purpose of setting the transparency of an element in CSS?',
        name: 'q7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'Which CSS property is used to set the color of an element when a user hovers over it?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'hover-color', is_correct: false },
          { label: 'color:hover', is_correct: false },
          { label: 'color', is_correct: false },
          { label: 'hover', is_correct: false },
        ],
      },
      {
        title: 'How do you specify the background color of an element using an RGB value?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'background-color: rgb(R, G, B);', is_correct: true },
          { label: 'color: rgb(R, G, B);', is_correct: false },
          { label: 'bg-color: rgb(R, G, B);', is_correct: false },
        ],
      },
      {
        title: 'Can you use color names to specify colors in CSS?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Yes, using predefined color names', is_correct: true },
          { label: 'No, color names are not supported in CSS', is_correct: false },
        ],
      },
    ],
  },
};

export default template;
