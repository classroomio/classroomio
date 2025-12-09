import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'TypeScript Simple Types Quiz',
  description: 'Test your knowledge of TypeScript simple types.',
  questionnaire: {
    questions: [
      {
        title: 'What is the TypeScript type for representing a string?',
        name: 'q1',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'str',
            is_correct: false
          },
          {
            label: 'string',
            is_correct: true
          },
          {
            label: 'text',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which keyword is used to declare a constant in TypeScript?',
        name: 'q2',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'let',
            is_correct: false
          },
          {
            label: 'const',
            is_correct: true
          },
          {
            label: 'var',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the TypeScript type for representing a boolean value?',
        name: 'q3',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'bool',
            is_correct: false
          },
          {
            label: 'boolean',
            is_correct: true
          },
          {
            label: 'truefalse',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which TypeScript type can hold multiple values, such as a list of numbers?',
        name: 'q4',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'array',
            is_correct: false
          },
          {
            label: 'number[]',
            is_correct: true
          },
          {
            label: 'list',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the TypeScript type for representing a function?',
        name: 'q5',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'function',
            is_correct: false
          },
          {
            label: 'func',
            is_correct: false
          },
          {
            label: '() => void',
            is_correct: true
          }
        ]
      },
      {
        title: 'Which TypeScript type represents a value that can be either a number or a string?',
        name: 'q6',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'number|string',
            is_correct: true
          },
          {
            label: 'mixed',
            is_correct: false
          },
          {
            label: 'any',
            is_correct: false
          }
        ]
      },
      {
        title: 'In TypeScript, how do you declare a variable without specifying its type?',
        name: 'q7',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Using the `var` keyword',
            is_correct: false
          },
          {
            label: 'Using the `let` keyword',
            is_correct: false
          },
          {
            label: 'Using the `const` keyword',
            is_correct: false
          },
          {
            label: 'Using the `any` keyword',
            is_correct: true
          }
        ]
      },
      {
        title: 'Which TypeScript type represents a value that can be null or undefined?',
        name: 'q8',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'null',
            is_correct: false
          },
          {
            label: 'undefined',
            is_correct: false
          },
          {
            label: 'null|undefined',
            is_correct: true
          }
        ]
      },
      {
        title: 'What is the TypeScript type for representing an object with specific properties?',
        name: 'q9',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'object',
            is_correct: false
          },
          {
            label: 'Record<string, any>',
            is_correct: false
          },
          {
            label: 'Custom interface/type',
            is_correct: true
          }
        ]
      },
      {
        title: 'Which TypeScript type can be used to represent a value that is not available yet or an error?',
        name: 'q10',
        points: 1,
        order: 10,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'unknown',
            is_correct: true
          },
          {
            label: 'undefined',
            is_correct: false
          },
          {
            label: 'null',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
