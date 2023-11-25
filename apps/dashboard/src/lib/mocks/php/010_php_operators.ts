import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'PHP Operators Quiz',
  description: 'Test your knowledge of PHP operators.',
  questionnaire: {
    questions: [
      {
        title: 'Which operator is used for addition in PHP?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: '+',
            is_correct: true
          },
          {
            label: '-',
            is_correct: false
          },
          {
            label: '*',
            is_correct: false
          },
          {
            label: '/',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the result of the expression `5 % 2` in PHP?',
        name: 'question2',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: '2',
            is_correct: false
          },
          {
            label: '3',
            is_correct: true
          },
          {
            label: '0',
            is_correct: false
          },
          {
            label: '1',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which operator is used for concatenating strings in PHP?',
        name: 'question3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: '+',
            is_correct: true
          },
          {
            label: '-',
            is_correct: false
          },
          {
            label: '*',
            is_correct: false
          },
          {
            label: '/',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the result of the expression `$x .= $y` in PHP?',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: '$x is assigned the value of $y',
            is_correct: true
          },
          {
            label: '$x is incremented by the value of $y',
            is_correct: false
          },
          {
            label: '$x is compared to $y',
            is_correct: false
          },
          {
            label: 'An error occurs',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which operator is used for logical AND in PHP?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: '&&',
            is_correct: true
          },
          {
            label: '||',
            is_correct: false
          },
          {
            label: '&',
            is_correct: false
          },
          {
            label: '|||',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the result of the expression `true || false` in PHP?',
        name: 'question6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'true',
            is_correct: true
          },
          {
            label: 'false',
            is_correct: false
          },
          {
            label: 'null',
            is_correct: false
          },
          {
            label: '1',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which operator is used for the not equal comparison in PHP?',
        name: 'question7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: '!=',
            is_correct: true
          },
          {
            label: '!==',
            is_correct: false
          },
          {
            label: '==',
            is_correct: false
          },
          {
            label: '===',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the result of the expression `5 == "5"` in PHP?',
        name: 'question8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'true',
            is_correct: true
          },
          {
            label: 'false',
            is_correct: false
          },
          {
            label: 'null',
            is_correct: false
          },
          {
            label: '1',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which operator is used for incrementing a variable in PHP?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: '++',
            is_correct: true
          },
          {
            label: '--',
            is_correct: false
          },
          {
            label: '**',
            is_correct: false
          },
          {
            label: '//',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the result of the expression `10 / 0` in PHP?',
        name: 'question10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'An error occurs',
            is_correct: true
          },
          {
            label: '0',
            is_correct: false
          },
          {
            label: 'Infinity',
            is_correct: false
          },
          {
            label: '1',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
