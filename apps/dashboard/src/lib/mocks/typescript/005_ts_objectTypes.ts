import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'TypeScript Object Types Quiz',
  description: 'Test your knowledge of TypeScript object types.',
  questionnaire: {
    questions: [
      {
        title: 'What is an object type in TypeScript?',
        name: 'q1',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'A type that represents a single value, such as a number or string.',
            is_correct: false
          },
          {
            label: 'A type that represents a collection of key-value pairs.',
            is_correct: true
          },
          {
            label: 'A type that represents an array of values.',
            is_correct: false
          },
          {
            label: 'A type that represents a function.',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you define an object type in TypeScript?',
        name: 'q2',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Using the `object` keyword.',
            is_correct: false
          },
          {
            label: 'Using the `type` keyword with key-value pairs.',
            is_correct: true
          },
          {
            label: 'Using the `class` keyword.',
            is_correct: false
          },
          {
            label: 'Using the `interface` keyword.',
            is_correct: false
          }
        ]
      },
      {
        title:
          'What does the following TypeScript object type definition represent?\n\n```\ntype Person = {\n  name: string;\n  age: number;\n};\n```',
        name: 'q3',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'A function type that takes a name and age as arguments and returns a string.',
            is_correct: false
          },
          {
            label:
              'An object type with properties `name` and `age`, where `name` is a string and `age` is a number.',
            is_correct: true
          },
          {
            label: 'A class definition for creating `Person` instances.',
            is_correct: false
          },
          {
            label: 'An array type that contains `Person` objects.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of using optional properties in TypeScript object types?',
        name: 'q4',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'To indicate that a property is required and must have a value.',
            is_correct: false
          },
          {
            label: 'To indicate that a property is optional and may have a value or be undefined.',
            is_correct: true
          },
          {
            label: 'To indicate that a property should not be accessed.',
            is_correct: false
          },
          {
            label: 'To indicate that a property is a function.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the correct way to access properties of an object type in TypeScript?',
        name: 'q5',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'By using the `.` (dot) notation (e.g., `person.name`).',
            is_correct: true
          },
          {
            label: 'By using square brackets (e.g., `person["name"]`).',
            is_correct: false
          },
          {
            label: 'By using the `get` method (e.g., `person.get("name")`).',
            is_correct: false
          },
          {
            label: 'By using parentheses (e.g., `person("name")`).',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is an index signature in TypeScript object types?',
        name: 'q6',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'A type that defines the index of an array.',
            is_correct: false
          },
          {
            label:
              'A type that specifies the data type of the keys and the corresponding value data types in an object.',
            is_correct: true
          },
          {
            label: 'A type that represents the number of properties in an object.',
            is_correct: false
          },
          {
            label: 'A type that represents the order of properties in an object.',
            is_correct: false
          }
        ]
      },
      {
        title: 'Can object types in TypeScript have methods?',
        name: 'q7',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Yes, object types can have methods defined within them.',
            is_correct: true
          },
          {
            label: 'No, object types can only have properties but not methods.',
            is_correct: false
          },
          {
            label: 'Methods in TypeScript are defined separately from object types.',
            is_correct: false
          },
          {
            label: 'Methods can only be defined in classes, not object types.',
            is_correct: false
          }
        ]
      },
      {
        title:
          'What is the key difference between an interface and a type alias for defining object types in TypeScript?',
        name: 'q8',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label:
              'Interfaces are more flexible and allow for dynamic typing, while type aliases are more rigid.',
            is_correct: false
          },
          {
            label: 'Interfaces can be extended and implemented, while type aliases cannot.',
            is_correct: true
          },
          {
            label:
              'Type aliases are more powerful and can define complex types, while interfaces are limited.',
            is_correct: false
          },
          {
            label:
              'There is no difference between interfaces and type aliases for defining object types.',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which keyword is used to define an optional property in TypeScript object types?',
        name: 'q9',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'The `optional` keyword.',
            is_correct: false
          },
          {
            label: 'The `maybe` keyword.',
            is_correct: false
          },
          {
            label: 'The `undefined` keyword.',
            is_correct: false
          },
          {
            label: 'The `?` (question mark) symbol.',
            is_correct: true
          }
        ]
      },
      {
        title: 'What is object destructuring in TypeScript?',
        name: 'q10',
        points: 1,
        order: 10,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'A process of destroying objects to free up memory.',
            is_correct: false
          },
          {
            label: 'A way to create new objects from existing objects.',
            is_correct: false
          },
          {
            label:
              'A technique for extracting properties from objects and assigning them to variables.',
            is_correct: true
          },
          {
            label: 'A method for combining multiple objects into one.',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
