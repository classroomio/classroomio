import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'TypeScript Aliases and Interfaces Quiz',
  description: 'Test your knowledge of TypeScript aliases and interfaces.',
  questionnaire: {
    questions: [
      {
        title: 'What is an interface in TypeScript?',
        name: 'q1',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'A way to create custom data types.',
            is_correct: false
          },
          {
            label: 'A way to implement classes in TypeScript.',
            is_correct: false
          },
          {
            label: 'A way to define the structure of an object.',
            is_correct: true
          },
          {
            label: 'A way to declare variables in TypeScript.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is a type alias in TypeScript?',
        name: 'q2',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'A way to assign a type to a variable.',
            is_correct: false
          },
          {
            label: 'A way to create an alias for a type, making it easier to refer to.',
            is_correct: true
          },
          {
            label: 'A way to create an instance of a class.',
            is_correct: false
          },
          {
            label: 'A way to define interfaces in TypeScript.',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which keyword is used to define an interface in TypeScript?',
        name: 'q3',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'interface',
            is_correct: true
          },
          {
            label: 'class',
            is_correct: false
          },
          {
            label: 'type',
            is_correct: false
          },
          {
            label: 'alias',
            is_correct: false
          }
        ]
      },
      {
        title: 'In TypeScript, can a class implement multiple interfaces?',
        name: 'q4',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'No, a class can only implement one interface.',
            is_correct: false
          },
          {
            label: 'Yes, a class can implement multiple interfaces.',
            is_correct: true
          },
          {
            label: 'Interfaces cannot be implemented by classes in TypeScript.',
            is_correct: false
          },
          {
            label: 'Classes in TypeScript do not support interfaces.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the benefit of using type aliases in TypeScript?',
        name: 'q5',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Type aliases provide better performance than interfaces.',
            is_correct: false
          },
          {
            label: 'Type aliases are used to create new classes in TypeScript.',
            is_correct: false
          },
          {
            label: 'Type aliases make it easier to refer to complex types.',
            is_correct: true
          },
          {
            label: 'Type aliases are used to define interfaces in TypeScript.',
            is_correct: false
          }
        ]
      },
      {
        title: 'Can you add properties to an object using an interface in TypeScript?',
        name: 'q6',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'No, interfaces are only used for type checking.',
            is_correct: true
          },
          {
            label: 'Yes, interfaces can be used to add properties to objects.',
            is_correct: false
          },
          {
            label: 'Interfaces are not used to work with objects in TypeScript.',
            is_correct: false
          },
          {
            label: 'Interfaces can only be used with classes in TypeScript.',
            is_correct: false
          }
        ]
      },
      {
        title:
          'What is a benefit of using interfaces for function type declarations in TypeScript?',
        name: 'q7',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Interfaces are not used for function type declarations in TypeScript.',
            is_correct: false
          },
          {
            label: 'Interfaces allow you to define the expected function signature.',
            is_correct: true
          },
          {
            label: 'Interfaces make functions easier to call in TypeScript.',
            is_correct: false
          },
          {
            label: 'Interfaces add runtime validation to functions in TypeScript.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of an index signature in TypeScript?',
        name: 'q8',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Index signatures are not used in TypeScript.',
            is_correct: false
          },
          {
            label: 'Index signatures define the data types of object properties.',
            is_correct: false
          },
          {
            label: 'Index signatures allow dynamic property access on objects.',
            is_correct: true
          },
          {
            label: 'Index signatures are used to create new types in TypeScript.',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which keyword is used to define a type alias in TypeScript?',
        name: 'q9',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'type',
            is_correct: true
          },
          {
            label: 'interface',
            is_correct: false
          },
          {
            label: 'alias',
            is_correct: false
          },
          {
            label: 'class',
            is_correct: false
          }
        ]
      },
      {
        title: 'In TypeScript, can you extend multiple type aliases?',
        name: 'q10',
        points: 1,
        order: 10,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'No, you can only extend one type alias at a time.',
            is_correct: false
          },
          {
            label: 'Yes, you can extend multiple type aliases in TypeScript.',
            is_correct: true
          },
          {
            label: 'Type aliases cannot be extended in TypeScript.',
            is_correct: false
          },
          {
            label: 'Type aliases can only be extended by classes in TypeScript.',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
