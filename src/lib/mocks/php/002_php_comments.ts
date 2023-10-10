import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'PHP Comments Quiz',
  description: 'Test your knowledge of PHP comments.',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of comments in PHP?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To execute code.',
            is_correct: false,
          },
          {
            label: 'To document code and provide explanations.',
            is_correct: true,
          },
          {
            label: 'To hide code from others.',
            is_correct: false,
          },
        ],
      },
      {
        title: 'Which symbol is used to start a single-line comment in PHP?',
        name: 'question2',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: '#',
            is_correct: true,
          },
          {
            label: '//',
            is_correct: false,
          },
          {
            label: '/*',
            is_correct: false,
          },
          {
            label: '--',
            is_correct: false,
          },
        ],
      },
      {
        title: 'How do you start a multi-line comment in PHP?',
        name: 'question3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: '/*',
            is_correct: true,
          },
          {
            label: '#',
            is_correct: false,
          },
          {
            label: '//',
            is_correct: false,
          },
          {
            label: '--',
            is_correct: false,
          },
        ],
      },
      {
        title: 'How do you end a multi-line comment in PHP?',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: '*/',
            is_correct: true,
          },
          {
            label: '#',
            is_correct: false,
          },
          {
            label: '//',
            is_correct: false,
          },
          {
            label: '--',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the purpose of using comments in code?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'To provide explanations for code.',
            is_correct: true,
          },
          {
            label: 'To disable code temporarily.',
            is_correct: false,
          },
          {
            label: 'To make code execute faster.',
            is_correct: false,
          },
          {
            label: 'To document the author of the code.',
            is_correct: true,
          },
        ],
      },
      {
        title: 'What is the correct way to add a comment in PHP?',
        name: 'question6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'Can comments be nested in PHP?',
        name: 'question7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Yes',
            is_correct: true,
          },
          {
            label: 'No',
            is_correct: false,
          },
        ],
      },
      {
        title: 'Which of the following is not a valid way to comment out a block of code in PHP?',
        name: 'question8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: '/* ... */',
            is_correct: false,
          },
          {
            label: '// ...',
            is_correct: false,
          },
          {
            label: '# ... #',
            is_correct: true,
          },
          {
            label: '-- ... --',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the purpose of a doc comment in PHP?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To disable code temporarily.',
            is_correct: false,
          },
          {
            label: 'To document functions, classes, and methods.',
            is_correct: true,
          },
          {
            label: 'To hide code from others.',
            is_correct: false,
          },
        ],
      },
      {
        title: 'Which PHP function is used to add a single-line comment?',
        name: 'question10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
    ],
  },
};


export default template;
