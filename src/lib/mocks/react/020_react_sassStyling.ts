import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'React Sass Styling Quiz',
  description: 'Test your knowledge of styling React components using Sass.',
  questionnaire: {
    questions: [
      {
        title: 'What is Sass?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A CSS preprocessor', is_correct: true },
          { label: 'A JavaScript library', is_correct: false },
          { label: 'A CSS framework', is_correct: false },
        ],
      },
      {
        title: 'How do you import Sass files into a React component?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'What is the primary advantage of using Sass variables?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Reuse and maintain consistent values', is_correct: true },
          { label: 'Enhance browser compatibility', is_correct: false },
          { label: 'Improve performance', is_correct: false },
        ],
      },
      {
        title: 'In Sass, how do you nest CSS rules?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'What is the purpose of the Sass function `darken()`?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To make a color darker', is_correct: true },
          { label: 'To create a CSS class', is_correct: false },
          { label: 'To import external stylesheets', is_correct: false },
        ],
      },
      {
        title: 'How can you use mixins in Sass?',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'What is the purpose of the `@import` directive in Sass?',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To include styles from other Sass files', is_correct: true },
          { label: 'To import JavaScript modules', is_correct: false },
          { label: 'To define CSS animations', is_correct: false },
        ],
      },
      {
        title: 'How do you comment out code in Sass?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'Using // for single-line comments', is_correct: true },
          { label: 'Using /* */ for multi-line comments', is_correct: true },
          { label: 'Using # for comments', is_correct: false },
          { label: 'Using <!-- --> for comments', is_correct: false },
        ],
      },
      {
        title: 'What is the output format of the `compressed` style in Sass?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Minified and compressed CSS', is_correct: true },
          { label: 'Human-readable and indented CSS', is_correct: false },
          { label: 'JSON format', is_correct: false },
        ],
      },
      {
        title: 'How do you compile Sass code into CSS?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'Using a Sass compiler or command-line tool', is_correct: true },
          { label: 'By embedding Sass directly in HTML', is_correct: false },
          { label: 'By using the browser\'s built-in Sass support', is_correct: false },
        ],
      },
    ],
  },
};

export default template;
