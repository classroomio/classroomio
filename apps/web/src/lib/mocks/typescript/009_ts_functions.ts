import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'TypeScript Functions Quiz',
  description: 'Test your knowledge of TypeScript functions.',
  questionnaire: {
    questions: [
      {
        title: 'What is a function in TypeScript?',
        name: 'q1',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'A function is a variable in TypeScript.',
            is_correct: false
          },
          {
            label: 'A function is a block of code that can be executed and reused.',
            is_correct: true
          },
          {
            label: 'A function is a type of loop in TypeScript.',
            is_correct: false
          },
          {
            label: 'A function is a reserved keyword in TypeScript.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the syntax for defining a function in TypeScript?',
        name: 'q2',
        points: 1,
        order: 2,
        question_type: QuestionTypes[1], // CHECKBOX type
        options: [
          {
            label: 'function functionName() { }',
            is_correct: true
          },
          {
            label: 'func functionName() { }',
            is_correct: false
          },
          {
            label: 'const functionName = () => { }',
            is_correct: true
          },
          {
            label: 'def functionName() { }',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is a parameter in a function?',
        name: 'q3',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'A parameter is a variable declared inside a function.',
            is_correct: true
          },
          {
            label: 'A parameter is a function that takes another function as an argument.',
            is_correct: false
          },
          {
            label: 'A parameter is the return value of a function.',
            is_correct: false
          },
          {
            label: 'A parameter is a built-in keyword in TypeScript.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the `return` statement in a function?',
        name: 'q4',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'The `return` statement defines a new function.',
            is_correct: false
          },
          {
            label: 'The `return` statement is used to exit a loop.',
            is_correct: false
          },
          {
            label: 'The `return` statement specifies the value that the function will return.',
            is_correct: true
          },
          {
            label: 'The `return` statement is not used in functions.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is a TypeScript arrow function?',
        name: 'q5',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'An arrow function is a function with a circular shape.',
            is_correct: false
          },
          {
            label: 'An arrow function is a concise way to write function expressions in TypeScript.',
            is_correct: true
          },
          {
            label: 'An arrow function is a type of function that uses arrows instead of parentheses.',
            is_correct: false
          },
          {
            label: 'An arrow function is a deprecated feature in TypeScript.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the `this` keyword in a function?',
        name: 'q6',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'The `this` keyword refers to the function itself.',
            is_correct: false
          },
          {
            label: 'The `this` keyword refers to the global object.',
            is_correct: false
          },
          {
            label: 'The `this` keyword refers to the current instance of an object.',
            is_correct: true
          },
          {
            label: 'The `this` keyword is not used in functions.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is a TypeScript generator function?',
        name: 'q7',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'A generator function is a function that generates random values.',
            is_correct: false
          },
          {
            label: 'A generator function is a special type of function that can pause and resume its execution.',
            is_correct: true
          },
          {
            label: 'A generator function is a function that generates HTML code.',
            is_correct: false
          },
          {
            label: 'A generator function is not a valid TypeScript feature.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the `yield` keyword in a generator function?',
        name: 'q8',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'The `yield` keyword is used to yield control back to the caller of the generator function.',
            is_correct: true
          },
          {
            label: 'The `yield` keyword is used to terminate the generator function.',
            is_correct: false
          },
          {
            label: 'The `yield` keyword has no specific purpose in generator functions.',
            is_correct: false
          },
          {
            label: 'The `yield` keyword is used to specify the return value of the generator function.',
            is_correct: false
          }
        ]
      },
      {
        title: 'Can a TypeScript function have multiple return statements?',
        name: 'q9',
        points: 1,
        order: 9,
        question_type: QuestionTypes[1], // CHECKBOX type
        options: [
          {
            label: 'Yes, a function can have multiple return statements.',
            is_correct: true
          },
          {
            label: 'No, a function can only have one return statement.',
            is_correct: false
          },
          {
            label: 'It depends on the type of function.',
            is_correct: false
          },
          {
            label: 'Multiple return statements are only allowed in arrow functions.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is function overloading in TypeScript?',
        name: 'q10',
        points: 1,
        order: 10,
        question_type: QuestionTypes[2], // TEXTAREA type
        options: [] // No options for TEXTAREA type
      }
    ]
  }
};

export default template;
