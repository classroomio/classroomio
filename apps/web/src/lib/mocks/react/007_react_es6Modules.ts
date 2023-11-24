import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'React ES6 Modules Quiz',
  description: 'Test your knowledge of React ES6 modules.',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of ES6 modules in JavaScript?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To declare variables', is_correct: false },
          { label: 'To define reusable pieces of code that can be imported and used in other modules', is_correct: true },
          { label: 'To create new functions', is_correct: false },
        ],
      },
      {
        title: 'How do you export a function or variable from a module in ES6?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Using the `import` keyword', is_correct: false },
          { label: 'Using the `export` keyword', is_correct: true },
          { label: 'Using the `require` keyword', is_correct: false },
        ],
      },
      {
        title: 'Which of the following statements is true about ES6 modules?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Modules can only be used in the browser', is_correct: false },
          { label: 'Modules can be used in both the browser and Node.js', is_correct: true },
          { label: 'Modules are not supported in JavaScript', is_correct: false },
        ],
      },
      {
        title: 'What is the purpose of the default export in ES6 modules?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To export multiple values from a module', is_correct: false },
          { label: 'To specify the main entry point of a module', is_correct: true },
          { label: 'To import all values from a module', is_correct: false },
        ],
      },
      {
        title: 'Select all valid ways to import a named export from a module in ES6.',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'Using the `import` keyword followed by the module path', is_correct: true },
          { label: 'Using the `import * as moduleName` syntax', is_correct: true },
          { label: 'Using the `import defaultExport` syntax', is_correct: false },
          { label: 'Using the `require` keyword', is_correct: false },
        ],
      },
      {
        title: 'Write an example of exporting a named function from a module in ES6.',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'Explain the concept of a default export in ES6 modules.',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'What is the purpose of using ES6 modules in a large JavaScript project?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'List some benefits of using ES6 modules over traditional script tags for including JavaScript in HTML files.',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'How do ES6 modules handle variable scope?',
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
