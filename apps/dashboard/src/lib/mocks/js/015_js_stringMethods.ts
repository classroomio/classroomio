import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'JavaScript String Methods Quiz',
  description: 'Test your knowledge of JavaScript string methods.',
  questionnaire: {
    questions: [
      {
        title: 'Which string method is used to extract a specific number of characters from a string?',
        name: 'q1',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'substr()',
            is_correct: true
          },
          {
            label: 'substring()',
            is_correct: false
          },
          {
            label: 'slice()',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which string method is used to replace a specified value with another value in a string?',
        name: 'q2',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'replace()',
            is_correct: true
          },
          {
            label: 'replaceAll()',
            is_correct: false
          },
          {
            label: 'substitute()',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which method is used to concatenate two or more strings in JavaScript?',
        name: 'q3',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'concat()',
            is_correct: true
          },
          {
            label: 'join()',
            is_correct: false
          },
          {
            label: 'merge()',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the `trim()` method in JavaScript?',
        name: 'q4',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'To remove whitespace from the beginning and end of a string',
            is_correct: true
          },
          {
            label: 'To add whitespace to a string',
            is_correct: false
          },
          {
            label: 'To split a string into an array',
            is_correct: false
          }
        ]
      },
      {
        title:
          'Which string method is used to convert a string to an array of substrings based on a specified separator?',
        name: 'q5',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'split()',
            is_correct: true
          },
          {
            label: 'divide()',
            is_correct: false
          },
          {
            label: 'segment()',
            is_correct: false
          }
        ]
      },
      {
        title: 'What does the `charAt()` method in JavaScript return?',
        name: 'q6',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'The character at a specified index',
            is_correct: true
          },
          {
            label: 'The length of the string',
            is_correct: false
          },
          {
            label: 'A substring of the string',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which string method is used to convert a string to uppercase letters?',
        name: 'q7',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'toUpperCase()',
            is_correct: true
          },
          {
            label: 'toUppercase()',
            is_correct: false
          },
          {
            label: 'upperCase()',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the `charAt()` method in JavaScript?',
        name: 'q8',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'To retrieve the character at a specified index in a string',
            is_correct: true
          },
          {
            label: 'To remove characters from a string',
            is_correct: false
          },
          {
            label: 'To concatenate two strings',
            is_correct: false
          }
        ]
      },
      {
        title:
          'Which string method is used to extract the characters from a string, between two specified indices, and returns the new string?',
        name: 'q9',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'substring()',
            is_correct: true
          },
          {
            label: 'slice()',
            is_correct: false
          },
          {
            label: 'splice()',
            is_correct: false
          }
        ]
      },
      {
        title:
          'What is the return value of the `indexOf()` method if the specified substring is not found in the string?',
        name: 'q10',
        points: 1,
        order: 10,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: '-1',
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
      }
    ]
  }
};

export default template;
