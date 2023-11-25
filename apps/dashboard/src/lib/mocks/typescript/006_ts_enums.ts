import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'TypeScript Enums Quiz',
  description: 'Test your knowledge of TypeScript enums.',
  questionnaire: {
    questions: [
      {
        title: 'What is an enum in TypeScript?',
        name: 'q1',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'A keyword used to declare variables in TypeScript.',
            is_correct: false
          },
          {
            label: 'A way to define a collection of related named constant values.',
            is_correct: true
          },
          {
            label: 'A type of function in TypeScript.',
            is_correct: false
          },
          {
            label: 'A type of loop in TypeScript.',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which keyword is used to define an enum in TypeScript?',
        name: 'q2',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'enum',
            is_correct: true
          },
          {
            label: 'class',
            is_correct: false
          },
          {
            label: 'interface',
            is_correct: false
          },
          {
            label: 'type',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the default value of the first enum member if not explicitly assigned?',
        name: 'q3',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: '0',
            is_correct: true
          },
          {
            label: '1',
            is_correct: false
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
      },
      {
        title: 'How do you access enum members in TypeScript?',
        name: 'q4',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'By using dot notation (e.g., `EnumName.MemberName`).',
            is_correct: true
          },
          {
            label: 'By using square brackets (e.g., `EnumName["MemberName"]`).',
            is_correct: false
          },
          {
            label: 'By using parentheses (e.g., `EnumName("MemberName")`).',
            is_correct: false
          },
          {
            label: 'By using the `get` method (e.g., `EnumName.get("MemberName")`).',
            is_correct: false
          }
        ]
      },
      {
        title: 'In TypeScript, can enums have string values as members?',
        name: 'q5',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Yes, enums can only have string values as members.',
            is_correct: false
          },
          {
            label: 'Yes, enums can have both numeric and string values as members.',
            is_correct: true
          },
          {
            label: 'No, enums can only have numeric values as members.',
            is_correct: false
          },
          {
            label: 'No, enums cannot have values assigned to their members.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of using enums in TypeScript?',
        name: 'q6',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'To define classes in TypeScript.',
            is_correct: false
          },
          {
            label: 'To define named constants representing a set of related values.',
            is_correct: true
          },
          {
            label: 'To define functions in TypeScript.',
            is_correct: false
          },
          {
            label: 'To define interfaces in TypeScript.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the benefit of using enums over plain objects in TypeScript?',
        name: 'q7',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Enums provide better performance and memory management.',
            is_correct: false
          },
          {
            label: 'Enums are easier to use when working with a fixed set of values.',
            is_correct: true
          },
          {
            label: 'Enums are not recommended over plain objects in TypeScript.',
            is_correct: false
          },
          {
            label: 'Enums can be used to create instances of objects.',
            is_correct: false
          }
        ]
      },
      {
        title: 'Can enum members have the same name within the same enum?',
        name: 'q8',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Yes, enum members can have the same name within the same enum.',
            is_correct: false
          },
          {
            label: 'No, enum members must have unique names within the same enum.',
            is_correct: true
          },
          {
            label: 'Enum members are not allowed in TypeScript.',
            is_correct: false
          },
          {
            label: 'The naming of enum members does not matter.',
            is_correct: false
          }
        ]
      },
      {
        title:
          'In TypeScript, can you assign a value to an enum member that is not part of the enum?',
        name: 'q9',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Yes, you can assign any value to an enum member in TypeScript.',
            is_correct: true
          },
          {
            label: 'No, enum members must have values that are part of the enum.',
            is_correct: false
          },
          {
            label: 'Enum members do not have values in TypeScript.',
            is_correct: false
          },
          {
            label: 'The assignment of enum values is determined by the compiler.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the benefit of using numeric values for enum members?',
        name: 'q10',
        points: 1,
        order: 10,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Numeric values allow for better type checking and inference in TypeScript.',
            is_correct: true
          },
          {
            label: 'Numeric values make enums harder to use and understand.',
            is_correct: false
          },
          {
            label: 'Numeric values are not recommended for enum members.',
            is_correct: false
          },
          {
            label: 'Numeric values are required for all enum members in TypeScript.',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
