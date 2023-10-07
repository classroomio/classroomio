import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'JavaScript Assignment Operators Quiz',
  description: 'Test your knowledge of JavaScript assignment operators.',
  questionnaire: {
    questions: [
      {
        title: 'What is the result of x = 5, where x is a variable?',
        name: 'q1',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'x = 5',
            is_correct: true
          },
          {
            label: '5',
            is_correct: false
          },
          {
            label: 'Undefined',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which operator is used for addition and assignment?',
        name: 'q2',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: '+=',
            is_correct: true
          },
          {
            label: '=+',
            is_correct: false
          },
          {
            label: '==',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the value of x after the operation x *= 2 if x is initially 3?',
        name: 'q3',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: '3',
            is_correct: false
          },
          {
            label: '6',
            is_correct: true
          },
          {
            label: '2',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which operator is used for subtraction and assignment?',
        name: 'q4',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: '-=',
            is_correct: true
          },
          {
            label: '=+',
            is_correct: false
          },
          {
            label: '--',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the result of x %= 3, where x is initially 8?',
        name: 'q5',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: '2',
            is_correct: false
          },
          {
            label: '0',
            is_correct: true
          },
          {
            label: '1',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which operator is used for division and assignment?',
        name: 'q6',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: '/=',
            is_correct: true
          },
          {
            label: '==',
            is_correct: false
          },
          {
            label: '//=',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the result of y **= 2, where y is initially 4?',
        name: 'q7',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: '16',
            is_correct: true
          },
          {
            label: '8',
            is_correct: false
          },
          {
            label: '6',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which operator is used for exponentiation and assignment?',
        name: 'q8',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: '**=',
            is_correct: true
          },
          {
            label: '^=',
            is_correct: false
          },
          {
            label: '^^=',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the value of x after the operation x &= 3, where x is initially 5?',
        name: 'q9',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: '5',
            is_correct: false
          },
          {
            label: '3',
            is_correct: true
          },
          {
            label: '0',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which operator is used for bitwise AND and assignment?',
        name: 'q10',
        points: 1,
        order: 10,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: '&=',
            is_correct: true
          },
          {
            label: '==',
            is_correct: false
          },
          {
            label: '&&=',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
