import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'TypeScript Special Types Quiz',
  description: 'Test your knowledge of TypeScript special types.',
  questionnaire: {
    questions: [
      {
        title: 'What is the special type for defining a variable that may have a null value?',
        name: 'q1',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Nullable',
            is_correct: false
          },
          {
            label: 'Optional',
            is_correct: false
          },
          {
            label: 'null',
            is_correct: false
          },
          {
            label: 'undefined',
            is_correct: false
          },
          {
            label: 'nullish',
            is_correct: true
          }
        ]
      },
      {
        title: 'Which special type represents a collection of unique values?',
        name: 'q2',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'UniqueSet',
            is_correct: false
          },
          {
            label: 'UniqueArray',
            is_correct: false
          },
          {
            label: 'Tuple',
            is_correct: false
          },
          {
            label: 'Enum',
            is_correct: true
          },
          {
            label: 'Record',
            is_correct: false
          }
        ]
      },
      {
        title: 'What special type is used to represent a function that never returns?',
        name: 'q3',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Void',
            is_correct: false
          },
          {
            label: 'Never',
            is_correct: true
          },
          {
            label: 'None',
            is_correct: false
          },
          {
            label: 'Undefined',
            is_correct: false
          },
          {
            label: 'Null',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which special type is used for specifying that a variable can be of multiple types?',
        name: 'q4',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Any',
            is_correct: false
          },
          {
            label: 'Union',
            is_correct: true
          },
          {
            label: 'Intersection',
            is_correct: false
          },
          {
            label: 'Variant',
            is_correct: false
          },
          {
            label: 'Multiple',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which special type represents a property of an object?',
        name: 'q5',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Member',
            is_correct: false
          },
          {
            label: 'Property',
            is_correct: false
          },
          {
            label: 'Field',
            is_correct: true
          },
          {
            label: 'Attribute',
            is_correct: false
          },
          {
            label: 'Variable',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which special type is used for defining the shape of an object?',
        name: 'q6',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'ObjectType',
            is_correct: false
          },
          {
            label: 'ShapeType',
            is_correct: false
          },
          {
            label: 'Interface',
            is_correct: true
          },
          {
            label: 'ObjectShape',
            is_correct: false
          },
          {
            label: 'Struct',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which special type is used for defining a key-value pair object?',
        name: 'q7',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Record',
            is_correct: true
          },
          {
            label: 'Map',
            is_correct: false
          },
          {
            label: 'Dictionary',
            is_correct: false
          },
          {
            label: 'KeyValuePair',
            is_correct: false
          },
          {
            label: 'Object',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which special type is used for defining a variable with a default value?',
        name: 'q8',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'DefaultValue',
            is_correct: false
          },
          {
            label: 'Default',
            is_correct: false
          },
          {
            label: 'InitialValue',
            is_correct: false
          },
          {
            label: 'Value',
            is_correct: false
          },
          {
            label: 'DefaultType',
            is_correct: true
          }
        ]
      },
      {
        title:
          'What is the special type used for representing a value that may be either a specified type or null or undefined?',
        name: 'q9',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'NullableType',
            is_correct: false
          },
          {
            label: 'OptionalType',
            is_correct: false
          },
          {
            label: 'MixedType',
            is_correct: false
          },
          {
            label: 'UnknownType',
            is_correct: false
          },
          {
            label: 'NullableTypeUnion',
            is_correct: true
          }
        ]
      },
      {
        title: 'What special type represents a value that is the result of a computation that may fail?',
        name: 'q10',
        points: 1,
        order: 10,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Result',
            is_correct: true
          },
          {
            label: 'Outcome',
            is_correct: false
          },
          {
            label: 'Error',
            is_correct: false
          },
          {
            label: 'Fail',
            is_correct: false
          },
          {
            label: 'Unsafe',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
