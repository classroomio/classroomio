import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'PHP Math Quiz',
  description: 'Test your knowledge of PHP mathematical operations.',
  questionnaire: {
    questions: [
      {
        title: 'Which of the following operators is used for exponentiation in PHP?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: '**',
            is_correct: true
          },
          {
            label: '^',
            is_correct: false
          },
          {
            label: '^^',
            is_correct: false
          },
          {
            label: 'exp()',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the result of the expression: `5 + 3` in PHP?',
        name: 'question2',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: '15',
            is_correct: false
          },
          {
            label: '8',
            is_correct: true
          },
          {
            label: '53',
            is_correct: false
          },
          {
            label: 'Error',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which PHP function is used to find the square root of a number?',
        name: 'question3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'sqrt()',
            is_correct: true
          },
          {
            label: 'pow()',
            is_correct: false
          },
          {
            label: 'log()',
            is_correct: false
          },
          {
            label: 'exp()',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the correct way to generate a random number between 1 and 100 in PHP?',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'rand(1, 100)',
            is_correct: true
          },
          {
            label: 'random(1, 100)',
            is_correct: false
          },
          {
            label: 'mt_rand(1, 100)',
            is_correct: false
          },
          {
            label: 'random_int(1, 100)',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the result of the expression: `floor(6.75)` in PHP?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: '7',
            is_correct: false
          },
          {
            label: '6.75',
            is_correct: false
          },
          {
            label: '6',
            is_correct: true
          },
          {
            label: 'Error',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which PHP function is used to calculate the absolute (positive) value of a number?',
        name: 'question6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'abs()',
            is_correct: true
          },
          {
            label: 'absolute()',
            is_correct: false
          },
          {
            label: 'pos()',
            is_correct: false
          },
          {
            label: 'positive()',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the result of the expression: `pi()` in PHP?',
        name: 'question7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: '3.14159265359',
            is_correct: true
          },
          {
            label: '3.14',
            is_correct: false
          },
          {
            label: '22/7',
            is_correct: false
          },
          {
            label: 'Error',
            is_correct: false
          }
        ]
      },
      {
        title: 'How can you calculate the factorial of a number in PHP?',
        name: 'question8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'Use a loop to calculate the factorial',
            is_correct: true
          },
          {
            label: 'Use the `factorial()` function',
            is_correct: false
          },
          {
            label: 'Multiply the number by itself repeatedly',
            is_correct: true
          },
          {
            label: 'Use recursion to calculate the factorial',
            is_correct: true
          }
        ]
      },
      {
        title: 'What is the result of the expression: `log10(100)` in PHP?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: '2',
            is_correct: true
          },
          {
            label: '10',
            is_correct: false
          },
          {
            label: '0.01',
            is_correct: false
          },
          {
            label: 'Error',
            is_correct: false
          }
        ]
      },
      {
        title: 'How can you round a floating-point number to the nearest integer in PHP?',
        name: 'question10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [
          {
            label: 'Enter your answer here',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
