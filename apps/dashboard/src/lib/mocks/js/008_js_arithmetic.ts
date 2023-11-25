import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'JavaScript Arithmetic Operators Quiz',
  description: 'Test your knowledge of JavaScript arithmetic operators.',
  questionnaire: {
    questions: [
      {
        title: 'What is the result of 5 + 3?',
        name: 'q1',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: '5',
            is_correct: false
          },
          {
            label: '8',
            is_correct: true
          },
          {
            label: '53',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which operator is used for string concatenation in JavaScript?',
        name: 'q2',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO type
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
          }
        ]
      },
      {
        title: 'What is the result of "10" - 5?',
        name: 'q3',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: '10',
            is_correct: false
          },
          {
            label: '5',
            is_correct: false
          },
          {
            label: '5 (as a number)',
            is_correct: true
          }
        ]
      },
      {
        title: 'Which operator is used to find the remainder of a division?',
        name: 'q4',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: '+',
            is_correct: false
          },
          {
            label: '-',
            is_correct: false
          },
          {
            label: '%',
            is_correct: true
          }
        ]
      },
      {
        title: 'What is the result of "20" == 20?',
        name: 'q5',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'true',
            is_correct: true
          },
          {
            label: 'false',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which operator is used to compare if two values are equal without type conversion?',
        name: 'q6',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: '==',
            is_correct: true
          },
          {
            label: '===',
            is_correct: false
          },
          {
            label: '!=',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the result of 5 > 3 && 2 < 4?',
        name: 'q7',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'true',
            is_correct: true
          },
          {
            label: 'false',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which operator is used to assign a value to a variable?',
        name: 'q8',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: '=',
            is_correct: true
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
        title: 'What is the result of true || false?',
        name: 'q9',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'true',
            is_correct: true
          },
          {
            label: 'false',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which operator is used for the logical NOT?',
        name: 'q10',
        points: 1,
        order: 10,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: '&&',
            is_correct: false
          },
          {
            label: '!',
            is_correct: true
          },
          {
            label: '||',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
