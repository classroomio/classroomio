import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'JavaScript "let" Quiz',
  description: 'Test your knowledge of the "let" keyword in JavaScript.',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of the "let" keyword in JavaScript?',
        name: 'q1',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'To declare block-scoped variables',
            is_correct: true
          },
          {
            label: 'To declare global variables',
            is_correct: false
          },
          {
            label: 'To declare constant variables',
            is_correct: false
          }
        ]
      },
      {
        title: 'Can you redeclare a variable declared with "let" in the same scope?',
        name: 'q2',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'No, redeclaration is not allowed',
            is_correct: true
          },
          {
            label: 'Yes, redeclaration is allowed',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the scope of a variable declared with "let"?',
        name: 'q3',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Block scope',
            is_correct: true
          },
          {
            label: 'Global scope',
            is_correct: false
          },
          {
            label: 'Function scope',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which of the following statements is true about "let" variables?',
        name: 'q4',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'They are hoisted to the top of the block',
            is_correct: false
          },
          {
            label: 'They are hoisted to the top of the function',
            is_correct: false
          },
          {
            label: 'They are not hoisted',
            is_correct: true
          }
        ]
      },
      {
        title: 'What is the initial value of a variable declared with "let"?',
        name: 'q5',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Undefined',
            is_correct: true
          },
          {
            label: '0',
            is_correct: false
          },
          {
            label: 'null',
            is_correct: false
          }
        ]
      },
      {
        title: 'Can you use a "let" variable before declaring it?',
        name: 'q6',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'No, it will result in a ReferenceError',
            is_correct: true
          },
          {
            label: 'Yes, it will have an initial value of undefined',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which statement is used to declare a constant variable in JavaScript?',
        name: 'q7',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'const',
            is_correct: true
          },
          {
            label: 'var',
            is_correct: false
          },
          {
            label: 'let',
            is_correct: false
          }
        ]
      },
      {
        title: 'What happens if you try to reassign a constant variable?',
        name: 'q8',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'It will result in a TypeError',
            is_correct: true
          },
          {
            label: 'It will reassign the variable without an error',
            is_correct: false
          },
          {
            label: 'It will throw a ReferenceError',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you declare a variable with block scope using "let"?',
        name: 'q9',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Enclose it in curly braces',
            is_correct: true
          },
          {
            label: 'Use the "block" keyword',
            is_correct: false
          },
          {
            label: 'Use the "scope" keyword',
            is_correct: false
          }
        ]
      },
      {
        title: 'In which ECMAScript version was "let" introduced?',
        name: 'q10',
        points: 1,
        order: 10,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'ES6 (ECMAScript 2015)',
            is_correct: true
          },
          {
            label: 'ES5 (ECMAScript 2009)',
            is_correct: false
          },
          {
            label: 'ES7 (ECMAScript 2016)',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
