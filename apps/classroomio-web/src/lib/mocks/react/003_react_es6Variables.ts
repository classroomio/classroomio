import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'React ES6 Variables Quiz',
  description: 'Test your knowledge of React ES6 variables.',
  questionnaire: {
    questions: [
      {
        title: 'What is the difference between "var" and "let" in ES6?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Both "var" and "let" have block scope.', is_correct: false },
          { label: '"var" has block scope, while "let" has function scope.', is_correct: false },
          { label: '"var" has function scope, while "let" has block scope.', is_correct: true }
        ]
      },
      {
        title: 'Which ES6 keyword is used to declare a constant variable?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'const', is_correct: true },
          { label: 'let', is_correct: false },
          { label: 'var', is_correct: false }
        ]
      },
      {
        title: 'What is the value of a variable declared using "const" that is not initialized?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Undefined', is_correct: false },
          { label: 'null', is_correct: false },
          { label: 'It throws an error', is_correct: true }
        ]
      },
      {
        title: 'Which ES6 feature allows you to destructure an object into individual variables?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Spread operator', is_correct: false },
          { label: 'Rest operator', is_correct: false },
          { label: 'Object destructuring', is_correct: true }
        ]
      },
      {
        title: 'What is the purpose of the "let" keyword in ES6?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To declare variables with block scope', is_correct: true },
          { label: 'To declare variables with function scope', is_correct: false },
          { label: 'To declare constant variables', is_correct: false }
        ]
      },
      {
        title: 'Select all valid data types that can be used with "const" declarations in ES6.',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'Number', is_correct: true },
          { label: 'String', is_correct: true },
          { label: 'Array', is_correct: true },
          { label: 'Object', is_correct: true },
          { label: 'Function', is_correct: true }
        ]
      },
      {
        title: 'Write an example of destructuring an object in ES6.',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Explain the difference between "var" and "let" in terms of hoisting.',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the purpose of the "const" keyword in ES6?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'List some common use cases for destructuring in JavaScript.',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      }
    ]
  }
};

export default template;
