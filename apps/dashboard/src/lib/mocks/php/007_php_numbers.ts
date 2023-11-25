import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'PHP Numbers Quiz',
  description: 'Test your knowledge of PHP numeric operations.',
  questionnaire: {
    questions: [
      {
        title: 'Which of the following is not a valid numeric data type in PHP?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'int',
            is_correct: false
          },
          {
            label: 'float',
            is_correct: false
          },
          {
            label: 'string',
            is_correct: true
          },
          {
            label: 'double',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the result of the expression: `5 + 3 * 2` in PHP?',
        name: 'question2',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: '16',
            is_correct: false
          },
          {
            label: '11',
            is_correct: true
          },
          {
            label: '13',
            is_correct: false
          },
          {
            label: '10',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which PHP function is used to check if a variable is an integer?',
        name: 'question3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'is_int()',
            is_correct: true
          },
          {
            label: 'intval()',
            is_correct: false
          },
          {
            label: 'is_integer()',
            is_correct: false
          },
          {
            label: 'int_check()',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the correct way to increment a variable `$x` by 1 in PHP?',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: '$x = $x++',
            is_correct: false
          },
          {
            label: '$x++',
            is_correct: true
          },
          {
            label: '$x += 1',
            is_correct: false
          },
          {
            label: '$x = ++$x',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which PHP function is used to round a float to the nearest integer?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'round()',
            is_correct: true
          },
          {
            label: 'ceil()',
            is_correct: false
          },
          {
            label: 'floor()',
            is_correct: false
          },
          {
            label: 'intval()',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the result of the expression: `10 / 0` in PHP?',
        name: 'question6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: '0',
            is_correct: false
          },
          {
            label: '10',
            is_correct: false
          },
          {
            label: 'Infinity',
            is_correct: true
          },
          {
            label: 'Error',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which PHP function is used to find the minimum value among a list of numbers?',
        name: 'question7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'min()',
            is_correct: true
          },
          {
            label: 'maximum()',
            is_correct: false
          },
          {
            label: 'minimum()',
            is_correct: false
          },
          {
            label: 'smallest()',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the result of the expression: `5 == "5"` in PHP?',
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
            label: 'Error',
            is_correct: false
          },
          {
            label: '0',
            is_correct: false
          }
        ]
      },
      {
        title: 'How can you check if a PHP variable is NaN (Not-a-Number)?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'Use `is_nan()` function',
            is_correct: true
          },
          {
            label: 'Compare the variable to itself using `!==`',
            is_correct: true
          },
          {
            label: 'Use `isNaN()` function',
            is_correct: false
          },
          {
            label: 'Check if the variable is equal to `NaN`',
            is_correct: true
          }
        ]
      },
      {
        title: 'What is the correct way to convert the string "123" to an integer in PHP?',
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
