import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Python Strings Quiz',
  description: 'Test your knowledge of Python strings',
  questionnaire: {
    questions: [
      {
        title: 'What is a string in Python?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A sequence of numbers', is_correct: false },
          { label: 'A sequence of characters', is_correct: true },
          { label: 'A data type in Python', is_correct: false },
        ],
      },
      {
        title: 'How do you declare a string in Python?',
        name: 'question2',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'str x', is_correct: false },
          { label: 'x = "Hello"', is_correct: true },
          { label: 'string x', is_correct: false },
        ],
      },
      {
        title: 'Which of the following is a valid string declaration in Python?',
        name: 'question3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'x = "Hello, World!"', is_correct: true },
          { label: 'x = 42', is_correct: false },
          { label: 'x = \'Python\'', is_correct: true },
          { label: 'x = True', is_correct: false },
        ],
      },
      {
        title: 'How do you access characters in a string in Python?',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Using parentheses', is_correct: false },
          { label: 'By index', is_correct: true },
          { label: 'Using curly braces', is_correct: false },
        ],
      },
      {
        title: 'Explain the concept of string concatenation in Python.',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'Which operator is used for string concatenation in Python?',
        name: 'question6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '+', is_correct: true },
          { label: '-', is_correct: false },
          { label: '*', is_correct: false },
        ],
      },
      {
        title: 'What is the result of "Hello" * 3 in Python?',
        name: 'question7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'HelloHelloHello', is_correct: true },
          { label: 'HelloHello', is_correct: false },
          { label: '333', is_correct: false },
        ],
      },
      {
        title: 'What is the purpose of string methods in Python?',
        name: 'question8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'How do you check the length of a string in Python?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'len(string)', is_correct: true },
          { label: 'string.length', is_correct: false },
          { label: 'string.len()', is_correct: false },
        ],
      },
      {
        title: 'Which method is used to remove whitespace from the beginning and end of a string in Python?',
        name: 'question10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'strip()', is_correct: true },
          { label: 'trim()', is_correct: false },
          { label: 'clean()', is_correct: false },
          { label: 'clear()', is_correct: false },
        ],
      },
    ],
  },
};

export default template;
