import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'TypeScript Union Types Quiz',
  description: 'Test your knowledge of TypeScript union types.',
  questionnaire: {
    questions: [
      {
        title: 'What are union types used for in TypeScript?',
        name: 'q1',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'To define a type that can be one of several types.',
            is_correct: true
          },
          {
            label: 'To create a new type by combining two types.',
            is_correct: false
          },
          {
            label: 'To define a type that must be all types in the union.',
            is_correct: false
          },
          {
            label: 'Union types are not used in TypeScript.',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you declare a union type in TypeScript?',
        name: 'q2',
        points: 1,
        order: 2,
        question_type: QuestionTypes[1], // CHECKBOX type
        options: [
          {
            label: 'Using the `union` keyword.',
            is_correct: false
          },
          {
            label: 'Using the `|` symbol between type names.',
            is_correct: true
          },
          {
            label: 'Using the `&` symbol between type names.',
            is_correct: false
          },
          {
            label: 'Using the `type` keyword followed by parentheses.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the result of a union type that includes `null` or `undefined`?',
        name: 'q3',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'The union type cannot include `null` or `undefined`.',
            is_correct: false
          },
          {
            label: 'It allows the value to be `null`, `undefined`, or any other specified type.',
            is_correct: true
          },
          {
            label: 'It forces the value to be both `null` and `undefined` simultaneously.',
            is_correct: false
          },
          {
            label: 'The union type becomes a non-nullable type.',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which symbol is used to separate type options in a union type?',
        name: 'q4',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Comma (,)',
            is_correct: false
          },
          {
            label: 'Semicolon (;)',
            is_correct: false
          },
          {
            label: 'Pipe (|)',
            is_correct: true
          },
          {
            label: 'Ampersand (&)',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is a discriminated union in TypeScript?',
        name: 'q5',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'A union type with a single option.',
            is_correct: false
          },
          {
            label: 'A union type that combines multiple types without discrimination.',
            is_correct: false
          },
          {
            label:
              'A union type where each option has a common property to discriminate between them.',
            is_correct: true
          },
          {
            label: 'A union type that is only used for numbers.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the TypeScript keyword for a non-null assertion?',
        name: 'q6',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'NotNull',
            is_correct: false
          },
          {
            label: 'NonNull',
            is_correct: false
          },
          {
            label: 'Undefined',
            is_correct: false
          },
          {
            label: '!',
            is_correct: true
          }
        ]
      },
      {
        title: 'In a union type, can you access properties that are not common to all types?',
        name: 'q7',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Yes, TypeScript allows accessing all properties in a union type.',
            is_correct: false
          },
          {
            label: 'No, you can only access properties common to all types in the union.',
            is_correct: true
          },
          {
            label: 'It depends on the specific property being accessed.',
            is_correct: false
          },
          {
            label: 'You can access properties of one type but not the others.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What does the `as` keyword do in TypeScript union types?',
        name: 'q8',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'It creates a new union type.',
            is_correct: false
          },
          {
            label: 'It converts a type to a different type in the union.',
            is_correct: true
          },
          {
            label: 'It enforces strict type checking.',
            is_correct: false
          },
          {
            label: 'It is used for optional properties.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the `never` type in TypeScript?',
        name: 'q9',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'To define a type that can never have any values.',
            is_correct: true
          },
          {
            label: 'To define a type for numeric values only.',
            is_correct: false
          },
          {
            label: 'To create a type that is nullable.',
            is_correct: false
          },
          {
            label: 'To define a type that can have any value.',
            is_correct: false
          }
        ]
      },
      {
        title: 'Can you use TypeScript union types with class constructors?',
        name: 'q10',
        points: 1,
        order: 10,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Yes, union types can be used with class constructors.',
            is_correct: true
          },
          {
            label: 'No, union types are only for primitive types.',
            is_correct: false
          },
          {
            label: 'Union types are used with interfaces, not classes.',
            is_correct: false
          },
          {
            label: 'Union types cannot be used with functions or classes.',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
