import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Python Functions Quiz',
  description: 'Test your knowledge of Python functions',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of a function in Python?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To define a variable', is_correct: false },
          { label: 'To execute code repeatedly', is_correct: false },
          { label: 'To group and reuse code', is_correct: true }
        ]
      },
      {
        title: 'How do you define a function in Python?',
        name: 'question2',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'function myFunction:', is_correct: false },
          { label: 'define myFunction:', is_correct: false },
          { label: 'def myFunction():', is_correct: true }
        ]
      },
      {
        title: 'Which keyword is used to call a function in Python?',
        name: 'question3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'call', is_correct: false },
          { label: 'invoke', is_correct: false },
          { label: 'return', is_correct: true }
        ]
      },
      {
        title: 'Explain the concept of function parameters in Python.',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is a "default parameter" in a Python function?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A parameter with a default value', is_correct: true },
          { label: 'A parameter that cannot be changed', is_correct: false },
          { label: 'A reserved keyword', is_correct: false }
        ]
      },
      {
        title: 'How do you return a value from a function in Python?',
        name: 'question6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'use return statement', is_correct: true },
          { label: 'use print statement', is_correct: false },
          { label: 'use break statement', is_correct: false }
        ]
      },
      {
        title: 'Explain the concept of "local variables" in Python functions.',
        name: 'question7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you make a Python function accept an arbitrary number of arguments?',
        name: 'question8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Use a for loop', is_correct: false },
          { label: 'Use the *args parameter', is_correct: true },
          { label: 'Use the $args parameter', is_correct: false }
        ]
      },
      {
        title: 'What is a "lambda function" in Python?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A function defined with the lambda keyword', is_correct: true },
          { label: 'A built-in Python function', is_correct: false },
          { label: 'A function with a long name', is_correct: false }
        ]
      },
      {
        title: 'Explain the concept of "recursion" in Python functions.',
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
