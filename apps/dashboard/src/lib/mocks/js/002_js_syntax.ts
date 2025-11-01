import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'JavaScript Syntax Quiz',
  description: 'Test your knowledge of JavaScript syntax.',
  questionnaire: {
    questions: [
      {
        title: 'What symbol is used for comments in JavaScript?',
        name: 'q1',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: '//',
            is_correct: true
          },
          {
            label: '--',
            is_correct: false
          },
          {
            label: '/* */',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you declare a variable in JavaScript?',
        name: 'q2',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'var',
            is_correct: true
          },
          {
            label: 'int',
            is_correct: false
          },
          {
            label: 'variable',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which of the following is a correct way to assign a value to a variable in JavaScript?',
        name: 'q3',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'x = 5;',
            is_correct: true
          },
          {
            label: 'x := 5;',
            is_correct: false
          },
          {
            label: 'x <- 5;',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the correct way to write an if statement in JavaScript?',
        name: 'q4',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'if (x == 5) {',
            is_correct: true
          },
          {
            label: 'if x == 5:',
            is_correct: false
          },
          {
            label: 'if x = 5;',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which of the following is a valid JavaScript string?',
        name: 'q5',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: '"Hello, World!"',
            is_correct: true
          },
          {
            label: "'Hello, World!'",
            is_correct: false
          },
          {
            label: '`Hello, World!`',
            is_correct: false
          }
        ]
      },
      {
        title: 'What does the operator "===" do in JavaScript?',
        name: 'q6',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Strict equality (equal value and equal type)',
            is_correct: true
          },
          {
            label: 'Assigns a value to a variable',
            is_correct: false
          },
          {
            label: 'Checks if a variable exists',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you write a for loop in JavaScript?',
        name: 'q7',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'for (var i = 0; i < 5; i++) {',
            is_correct: true
          },
          {
            label: 'for i in range(5):',
            is_correct: false
          },
          {
            label: 'loop (var i = 0; i < 5; i++) {',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you write a function in JavaScript?',
        name: 'q8',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'function myFunction() {',
            is_correct: true
          },
          {
            label: 'def myFunction():',
            is_correct: false
          },
          {
            label: 'method myFunction():',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "return" statement in a function?',
        name: 'q9',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'To specify the value to be returned from the function',
            is_correct: true
          },
          {
            label: 'To terminate the function immediately',
            is_correct: false
          },
          {
            label: 'To declare a new variable',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which operator is used for string concatenation in JavaScript?',
        name: 'q10',
        points: 1,
        order: 10,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: '+',
            is_correct: true
          },
          {
            label: '&',
            is_correct: false
          },
          {
            label: '|',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
