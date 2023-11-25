import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Python Comments Quiz',
  description: 'Test your knowledge of Python comments',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of comments in Python?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To add color to your code', is_correct: false },
          { label: 'To explain the code and make it more readable', is_correct: true },
          { label: 'To hide code from others', is_correct: false }
        ]
      },
      {
        title: 'Which symbol is used to start a single-line comment in Python?',
        name: 'question2',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '//', is_correct: false },
          { label: '/*', is_correct: false },
          { label: '#', is_correct: true }
        ]
      },
      {
        title: 'How do you write a multi-line comment in Python?',
        name: 'question3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '/* This is a comment */', is_correct: false },
          { label: '// This is a comment //', is_correct: false },
          { label: '""" This is a comment """', is_correct: true }
        ]
      },
      {
        title: 'What is the correct way to comment out a single line of code in Python?',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'Using a hash symbol (#)', is_correct: true },
          { label: 'Using double slashes (//)', is_correct: false },
          { label: "Using triple quotes (''')", is_correct: false }
        ]
      },
      {
        title: 'Explain the purpose of docstrings in Python.',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the main purpose of writing comments in your code?',
        name: 'question6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To increase the size of your code', is_correct: false },
          { label: 'To make your code look more colorful', is_correct: false },
          { label: 'To make the code understandable for you and others', is_correct: true }
        ]
      },
      {
        title: 'How can you comment out multiple lines of code in Python?',
        name: 'question7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'Using a hash symbol (#)', is_correct: false },
          { label: "Using triple quotes (''')", is_correct: true },
          { label: 'Using double slashes (//)', is_correct: false }
        ]
      },
      {
        title: 'What is the purpose of triple-quoted strings in Python?',
        name: 'question8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To define a string that spans multiple lines', is_correct: true },
          { label: 'To make your code more colorful', is_correct: false },
          { label: 'To indicate the end of a Python program', is_correct: false }
        ]
      },
      {
        title: 'Explain the purpose of inline comments in Python.',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title:
          'Which type of comment is used for documenting functions, classes, and modules in Python?',
        name: 'question10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Single-line comments', is_correct: false },
          { label: 'Multi-line comments', is_correct: false },
          { label: 'Docstrings', is_correct: true }
        ]
      }
    ]
  }
};

export default template;
