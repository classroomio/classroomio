import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'TypeScript Quiz',
  description: 'Test your TypeScript knowledge!',
  questionnaire: {
    questions: [
      {
        title: 'What is TypeScript?',
        name: 'q1',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A programming language', is_correct: false },
          { label: 'A superset of JavaScript', is_correct: true },
          { label: 'A text editor', is_correct: false }
        ]
      },
      {
        title: 'How do you declare a variable in TypeScript?',
        name: 'q2',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'var x = 5;', is_correct: false },
          { label: 'let x = 5;', is_correct: true },
          { label: 'const x = 5;', is_correct: false }
        ]
      },
      {
        title: 'What is the output of 2 + "2" in TypeScript?',
        name: 'q3',
        points: 2,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '4', is_correct: false },
          { label: '22', is_correct: true },
          { label: 'TypeError', is_correct: false }
        ]
      },
      {
        title: 'How do you define an array in TypeScript?',
        name: 'q4',
        points: 2,
        order: 4,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'let arr = [1, 2, 3];', is_correct: true },
          { label: 'const arr = {1, 2, 3};', is_correct: false },
          { label: 'var arr = [1, 2, 3];', is_correct: true },
          { label: 'array arr = [1, 2, 3];', is_correct: false }
        ]
      },
      {
        title: 'What keyword is used to define a function in TypeScript?',
        name: 'q5',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'function', is_correct: true },
          { label: 'method', is_correct: false },
          { label: 'func', is_correct: false }
        ]
      },
      {
        title: 'How do you typecast in TypeScript?',
        name: 'q6',
        points: 2,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the purpose of TypeScript?',
        name: 'q7',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To add static typing to JavaScript', is_correct: true },
          { label: 'To replace JavaScript', is_correct: false },
          { label: 'To make JavaScript run faster', is_correct: false }
        ]
      },
      {
        title: 'How do you define an interface in TypeScript?',
        name: 'q8',
        points: 2,
        order: 8,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'interface MyInterface {}', is_correct: true },
          { label: 'type MyInterface = {};', is_correct: false },
          { label: 'class MyInterface {}', is_correct: false },
          { label: 'interface = MyInterface {};', is_correct: false }
        ]
      },
      {
        title: 'What is the output of console.log(typeof undefined) in TypeScript?',
        name: 'q9',
        points: 2,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'undefined', is_correct: true },
          { label: 'null', is_correct: false },
          { label: 'object', is_correct: false }
        ]
      },
      {
        title: 'How do you define a class in TypeScript?',
        name: 'q10',
        points: 2,
        order: 10,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'class MyClass {}', is_correct: true },
          { label: 'interface MyClass {}', is_correct: false },
          { label: 'type MyClass = {};', is_correct: false }
        ]
      }
    ]
  }
};

export default template;
