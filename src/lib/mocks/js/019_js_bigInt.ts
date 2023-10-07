import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'JavaScript BigInt Quiz',
  description: 'Test your knowledge of JavaScript BigInt.',
  questionnaire: {
    questions: [
      {
        title: 'Which of the following is used to create a BigInt in JavaScript?',
        name: 'q1',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: '12345n',
            is_correct: true
          },
          {
            label: '12345',
            is_correct: false
          },
          {
            label: '"12345"',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the primary use of BigInt in JavaScript?',
        name: 'q2',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'To represent large integers that exceed the limits of regular numbers',
            is_correct: true
          },
          {
            label: 'To perform bitwise operations',
            is_correct: false
          },
          {
            label: 'To store decimal fractions',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which of the following operators can be used with BigInt?',
        name: 'q3',
        points: 1,
        order: 3,
        question_type: QuestionTypes[1], // CHECKBOX type
        options: [
          {
            label: '+',
            is_correct: true
          },
          {
            label: '-',
            is_correct: true
          },
          {
            label: '*',
            is_correct: true
          },
          {
            label: '/',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the result of adding a BigInt and a regular number in JavaScript?',
        name: 'q4',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'A BigInt',
            is_correct: true
          },
          {
            label: 'A regular number',
            is_correct: false
          },
          {
            label: 'A string',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you convert a BigInt to a regular number in JavaScript?',
        name: 'q5',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'By using the `Number()` function',
            is_correct: false
          },
          {
            label: 'By using the `.valueOf()` method',
            is_correct: true
          },
          {
            label: 'By using the `parseInt()` function',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the `BigInt.asUintN()` method in JavaScript?',
        name: 'q6',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'To convert a BigInt to an unsigned integer of a specified bit length',
            is_correct: true
          },
          {
            label: 'To perform bitwise AND operations on BigInts',
            is_correct: false
          },
          {
            label: 'To convert a BigInt to a regular number',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the result of the expression `2n ** 53n` in JavaScript?',
        name: 'q7',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'A BigInt representing 2 to the power of 53',
            is_correct: true
          },
          {
            label: 'A regular number',
            is_correct: false
          },
          {
            label: 'An error',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you create a BigInt from a string in JavaScript?',
        name: 'q8',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'By using the `BigInt()` constructor',
            is_correct: false
          },
          {
            label: 'By appending the letter "n" to the end of the string',
            is_correct: true
          },
          {
            label: 'By using the `parseInt()` function',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the value of `typeof 12345n` in JavaScript?',
        name: 'q9',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'bigint',
            is_correct: true
          },
          {
            label: 'number',
            is_correct: false
          },
          {
            label: 'string',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which of the following statements is true regarding JavaScript BigInt?',
        name: 'q10',
        points: 1,
        order: 10,
        question_type: QuestionTypes[1], // CHECKBOX type
        options: [
          {
            label: 'It can represent arbitrarily large integers',
            is_correct: true
          },
          {
            label: 'It is supported in all JavaScript environments without limitations',
            is_correct: false
          },
          {
            label: 'It is primarily used for representing decimal fractions',
            is_correct: false
          },
          {
            label: 'It can be used with all arithmetic operators',
            is_correct: true
          }
        ]
      }
    ]
  }
};

export default template;
