import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Python Variables Quiz',
  description: 'Test your knowledge of Python variables',
  questionnaire: {
    questions: [
      {
        title: 'What is a variable in Python?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A reserved keyword', is_correct: false },
          { label: 'A container for storing data', is_correct: true },
          { label: 'A function in Python', is_correct: false },
        ],
      },
      {
        title: 'How do you declare a variable in Python?',
        name: 'question2',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'var x;', is_correct: false },
          { label: 'x = 5', is_correct: true },
          { label: 'let x;', is_correct: false },
        ],
      },
      {
        title: 'What is the correct way to comment a variable declaration in Python?',
        name: 'question3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '/* This is a comment */', is_correct: false },
          { label: '# This is a comment', is_correct: true },
          { label: '// This is a comment', is_correct: false },
        ],
      },
      {
        title: 'What is a valid variable name in Python?',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: '123variable', is_correct: false },
          { label: 'my_variable', is_correct: true },
          { label: 'variable@name', is_correct: false },
          { label: '_variable', is_correct: true },
        ],
      },
      {
        title: 'Explain the purpose of variable names in Python.',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'How do you assign a value to a variable in Python?',
        name: 'question6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'x = value', is_correct: true },
          { label: 'assign(x, value)', is_correct: false },
          { label: 'set x to value', is_correct: false },
        ],
      },
      {
        title: 'Which data types are supported by Python variables?',
        name: 'question7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'Number', is_correct: true },
          { label: 'Boolean', is_correct: true },
          { label: 'Array', is_correct: false },
          { label: 'Object', is_correct: false },
        ],
      },
      {
        title: 'What is the scope of a variable in Python?',
        name: 'question8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Local scope', is_correct: true },
          { label: 'Global scope', is_correct: true },
          { label: 'Function scope', is_correct: false },
        ],
      },
      {
        title: 'Explain the purpose of variable assignment in Python.',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'How do you check the data type of a variable in Python?',
        name: 'question10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'type()', is_correct: true },
          { label: 'typeof', is_correct: false },
          { label: 'isinstance()', is_correct: true },
        ],
      },
    ],
  },
};

export default template;
