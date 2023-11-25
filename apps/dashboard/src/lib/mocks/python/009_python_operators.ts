import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Python Operators Quiz',
  description: 'Test your knowledge of Python operators',
  questionnaire: {
    questions: [
      {
        title: 'What is the result of 5 + 3 in Python?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '8', is_correct: true },
          { label: '53', is_correct: false },
          { label: '35', is_correct: false }
        ]
      },
      {
        title: 'Which operator is used for exponentiation in Python?',
        name: 'question2',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '**', is_correct: true },
          { label: '^', is_correct: false },
          { label: '^^', is_correct: false }
        ]
      },
      {
        title: 'What is the result of 10 / 2 in Python?',
        name: 'question3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '5.0', is_correct: true },
          { label: '5', is_correct: false },
          { label: '2.5', is_correct: false }
        ]
      },
      {
        title: 'Explain the concept of operator precedence in Python.',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Which operator is used to calculate the remainder of a division in Python?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '%', is_correct: true },
          { label: 'remainder', is_correct: false },
          { label: 'remainderOf', is_correct: false }
        ]
      },
      {
        title: 'What is the result of 2 * 3 in Python?',
        name: 'question6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '6', is_correct: true },
          { label: '23', is_correct: false },
          { label: '32', is_correct: false }
        ]
      },
      {
        title: 'Explain the concept of logical operators in Python.',
        name: 'question7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the result of "Hello" + " " + "World" in Python?',
        name: 'question8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'HelloWorld', is_correct: false },
          { label: 'Hello World', is_correct: true },
          { label: '"Hello World"', is_correct: false }
        ]
      },
      {
        title: 'Which operator is used for string repetition in Python?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '*', is_correct: true },
          { label: '+', is_correct: false },
          { label: '++', is_correct: false }
        ]
      },
      {
        title: 'Explain the concept of membership operators in Python.',
        name: 'question10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      }
    ]
  }
};

export default template;
