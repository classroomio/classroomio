import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'React ES6 Arrow Functions Quiz',
  description: 'Test your knowledge of React ES6 arrow functions.',
  questionnaire: {
    questions: [
      {
        title: 'What is an arrow function in ES6?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A traditional function', is_correct: false },
          { label: 'A function expression', is_correct: false },
          { label: 'A concise way to write functions', is_correct: true }
        ]
      },
      {
        title: 'Which of the following statements about arrow functions is correct?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Arrow functions can have their own "this" value', is_correct: false },
          { label: 'Arrow functions cannot have parameters', is_correct: false },
          { label: 'Arrow functions do not have their own "this" value', is_correct: true }
        ]
      },
      {
        title: 'How do you write a multi-line arrow function in JavaScript?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Using parentheses around the function body', is_correct: false },
          { label: 'Using curly braces around the function body', is_correct: true },
          { label: 'Using square brackets around the function body', is_correct: false }
        ]
      },
      {
        title: 'What is the main advantage of using arrow functions in React components?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'They have a shorter syntax', is_correct: true },
          { label: 'They can be asynchronous', is_correct: false },
          { label: 'They automatically bind "this"', is_correct: false }
        ]
      },
      {
        title: 'When should you NOT use an arrow function for a class method in React?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'When you want to access "this"', is_correct: true },
          { label: 'When the method is static', is_correct: false },
          { label: 'When the method is a constructor', is_correct: false }
        ]
      },
      {
        title: 'Select all valid use cases for arrow functions in JavaScript.',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'Defining methods in a class', is_correct: true },
          { label: 'Creating event handlers', is_correct: true },
          { label: 'Defining constructors', is_correct: false },
          { label: 'Using in a "for" loop', is_correct: true }
        ]
      },
      {
        title: 'Write an example of a single-line arrow function in JavaScript.',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Explain the concept of lexical scoping in arrow functions.',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the difference between regular functions and arrow functions in terms of "this" binding?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'List some potential drawbacks of using arrow functions in certain situations.',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      }
    ]
  }
};

export default template;
