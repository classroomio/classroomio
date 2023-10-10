import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'PHP Constants Quiz',
  description: 'Test your knowledge of PHP constants.',
  questionnaire: {
    questions: [
      {
        title: 'Which keyword is used to define a constant in PHP?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'const',
            is_correct: false,
          },
          {
            label: 'var',
            is_correct: false,
          },
          {
            label: 'define',
            is_correct: true,
          },
          {
            label: 'let',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the value of a constant once it is defined in PHP?',
        name: 'question2',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'It cannot be changed',
            is_correct: true,
          },
          {
            label: 'It can be modified at any time',
            is_correct: false,
          },
          {
            label: 'It is automatically initialized to 0',
            is_correct: false,
          },
          {
            label: 'It is set to null',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the correct way to access a constant in PHP?',
        name: 'question3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: '$constant_name',
            is_correct: false,
          },
          {
            label: 'constant_name()',
            is_correct: false,
          },
          {
            label: 'constant("constant_name")',
            is_correct: true,
          },
          {
            label: 'Constant::constant_name',
            is_correct: false,
          },
        ],
      },
      {
        title: 'Which of the following is a valid constant name in PHP?',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'my constant',
            is_correct: false,
          },
          {
            label: 'CONSTANT_NAME',
            is_correct: true,
          },
          {
            label: '123constant',
            is_correct: false,
          },
          {
            label: 'constant-name',
            is_correct: false,
          },
        ],
      },
      {
        title: 'How do you define a case-insensitive constant in PHP?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'Use the `const` keyword',
            is_correct: false,
          },
          {
            label: 'Use the `define` function',
            is_correct: true,
          },
          {
            label: 'Use the `CASE_INSENSITIVE` flag when defining',
            is_correct: false,
          },
          {
            label: 'Use uppercase letters for the constant name',
            is_correct: false,
          },
        ],
      },
      {
        title: 'Which of the following is a predefined constant in PHP that represents the current file name?',
        name: 'question6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: '__FILE__',
            is_correct: true,
          },
          {
            label: '__NAME__',
            is_correct: false,
          },
          {
            label: '__SCRIPT__',
            is_correct: false,
          },
          {
            label: '__FILENAME__',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the value of the predefined constant `PHP_VERSION`?',
        name: 'question7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'The name of the current PHP script',
            is_correct: false,
          },
          {
            label: 'The version number of the PHP interpreter',
            is_correct: true,
          },
          {
            label: 'The date and time of the PHP installation',
            is_correct: false,
          },
          {
            label: 'The server name',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the value of the predefined constant `PHP_OS`?',
        name: 'question8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'The operating system of the server',
            is_correct: true,
          },
          {
            label: 'The name of the PHP interpreter',
            is_correct: false,
          },
          {
            label: 'The version of PHP',
            is_correct: false,
          },
          {
            label: 'The server hostname',
            is_correct: false,
          },
        ],
      },
      {
        title: 'How do you define a constant with a case-insensitive name in PHP?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [
          {
            label: 'Enter your answer here',
            is_correct: false,
          },
        ],
      },
      {
        title: 'Which PHP function is used to check if a constant exists?',
        name: 'question10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'isset()',
            is_correct: false,
          },
          {
            label: 'define()',
            is_correct: false,
          },
          {
            label: 'constant()',
            is_correct: true,
          },
          {
            label: 'check_constant()',
            is_correct: false,
          },
        ],
      },
    ],
  },
};

export default template;
