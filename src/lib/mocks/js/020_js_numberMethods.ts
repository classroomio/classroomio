import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'JavaScript Number Methods Quiz',
  description: 'Test your knowledge of JavaScript Number Methods.',
  questionnaire: {
    questions: [
      {
        title: 'Which JavaScript method returns the smallest integer greater than or equal to a given number?',
        name: 'q1',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Math.floor()',
            is_correct: false
          },
          {
            label: 'Math.ceil()',
            is_correct: true
          },
          {
            label: 'Math.round()',
            is_correct: false
          }
        ]
      },
      {
        title: 'What does the `toFixed()` method do in JavaScript?',
        name: 'q2',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Returns the number as a fixed-point notation string',
            is_correct: true
          },
          {
            label: 'Returns the number rounded to the nearest integer',
            is_correct: false
          },
          {
            label: 'Returns the square root of the number',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which JavaScript method parses a string and returns a floating-point number?',
        name: 'q3',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'parseFloat()',
            is_correct: true
          },
          {
            label: 'parseInt()',
            is_correct: false
          },
          {
            label: 'Number()',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the result of `Number.isNaN(NaN)` in JavaScript?',
        name: 'q4',
        points: 1,
        order: 4,
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
        title: 'Which JavaScript method converts a number to its exponential notation?',
        name: 'q5',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'toExponential()',
            is_correct: true
          },
          {
            label: 'toFixed()',
            is_correct: false
          },
          {
            label: 'toPrecision()',
            is_correct: false
          }
        ]
      },
      {
        title: 'What does the `isFinite()` method check for in JavaScript?',
        name: 'q6',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Checks if a number is finite (not NaN, Infinity, or -Infinity)',
            is_correct: true
          },
          {
            label: 'Checks if a number is a positive integer',
            is_correct: false
          },
          {
            label: 'Checks if a number is even',
            is_correct: false
          }
        ]
      },
      {
        title: 'What does the `toString()` method do for a number in JavaScript?',
        name: 'q7',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Returns the number as a string',
            is_correct: true
          },
          {
            label: 'Rounds the number to the nearest integer',
            is_correct: false
          },
          {
            label: 'Returns the square root of the number',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you check if a number is an integer in JavaScript?',
        name: 'q8',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Using the `Number.isInteger()` method',
            is_correct: true
          },
          {
            label: 'Using the `Math.round()` method',
            is_correct: false
          },
          {
            label: 'Using the `Math.floor()` method',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which JavaScript method returns the largest integer less than or equal to a given number?',
        name: 'q9',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Math.floor()',
            is_correct: true
          },
          {
            label: 'Math.ceil()',
            is_correct: false
          },
          {
            label: 'Math.round()',
            is_correct: false
          }
        ]
      },
      {
        title: 'What does the `Number.toPrecision()` method do in JavaScript?',
        name: 'q10',
        points: 1,
        order: 10,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Returns a string representing a number to a specified precision',
            is_correct: true
          },
          {
            label: 'Rounds the number to the nearest integer',
            is_correct: false
          },
          {
            label: 'Returns the square root of the number',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
