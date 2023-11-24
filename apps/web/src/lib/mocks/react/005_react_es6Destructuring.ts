import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'React ES6 Destructuring Quiz',
  description: 'Test your knowledge of React ES6 destructuring.',
  questionnaire: {
    questions: [
      {
        title: 'What is destructuring in JavaScript?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A way to create new variables', is_correct: false },
          { label: 'A way to extract values from objects and arrays into distinct variables', is_correct: true },
          { label: 'A way to assign values to multiple variables', is_correct: false },
        ],
      },
      {
        title: 'How do you destructure an object in JavaScript?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Using square brackets', is_correct: false },
          { label: 'Using curly braces', is_correct: true },
          { label: 'Using parentheses', is_correct: false },
        ],
      },
      {
        title: 'Which of the following is a valid use case for array destructuring?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Swapping the values of two variables', is_correct: true },
          { label: 'Accessing object properties', is_correct: false },
          { label: 'Defining a function', is_correct: false },
        ],
      },
      {
        title: 'What happens if you try to destructure a non-existent property from an object?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'An error is thrown', is_correct: false },
          { label: 'The variable is assigned "undefined"', is_correct: true },
          { label: 'The variable is assigned "null"', is_correct: false },
        ],
      },
      {
        title: 'Select all valid methods of destructuring an array in JavaScript.',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'Using square brackets', is_correct: true },
          { label: 'Using curly braces', is_correct: false },
          { label: 'Using parentheses', is_correct: false },
          { label: 'Using the "destruct" keyword', is_correct: false },
        ],
      },
      {
        title: 'Write an example of object destructuring in JavaScript.',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'Explain the concept of nested destructuring in JavaScript.',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'What is the purpose of the rest operator (...) in destructuring?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'What are the advantages of using destructuring in JavaScript?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'List some common use cases for destructuring in JavaScript.',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
    ],
  },
};

export default template;
