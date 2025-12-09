import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'TypeScript keyof Quiz',
  description: 'Test your knowledge of TypeScript keyof!',
  questionnaire: {
    questions: [
      {
        title: 'What does the "keyof" keyword do in TypeScript?',
        name: 'q1',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Creates a new key in an object', is_correct: false },
          { label: 'Returns an array of keys from an object', is_correct: false },
          { label: 'Returns a union of keys from an object', is_correct: true }
        ]
      },
      {
        title: 'How do you use the "keyof" keyword to access the keys of an object type?',
        name: 'q2',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'keyof object', is_correct: true },
          { label: 'object.keys', is_correct: false },
          { label: 'object.keys()', is_correct: false }
        ]
      },
      {
        title: 'What is the type of a variable declared using the "keyof" keyword?',
        name: 'q3',
        points: 2,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'string', is_correct: true },
          { label: 'number', is_correct: false },
          { label: 'boolean', is_correct: false }
        ]
      },
      {
        title: 'In TypeScript, can you use "keyof" with object instances?',
        name: 'q4',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Yes, "keyof" works with both object types and instances', is_correct: false },
          { label: 'No, "keyof" only works with object types', is_correct: true }
        ]
      },
      {
        title: 'What is the purpose of using "keyof" with mapped types in TypeScript?',
        name: 'q5',
        points: 2,
        order: 5,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'To create new keys in an object', is_correct: false },
          { label: 'To create a union of keys from multiple objects', is_correct: true },
          { label: 'To filter out specific keys from an object', is_correct: false }
        ]
      },
      {
        title: 'How do you use "keyof" with generic types in TypeScript?',
        name: 'q6',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'keyof T', is_correct: true },
          { label: 'keyof<T>', is_correct: false },
          { label: 'keyof(T)', is_correct: false }
        ]
      },
      {
        title: 'Which of the following is a valid use case for "keyof" in TypeScript?',
        name: 'q7',
        points: 2,
        order: 7,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'Creating new object keys', is_correct: false },
          { label: 'Accessing the values of an object', is_correct: false },
          { label: 'Accessing object keys as string literals', is_correct: true }
        ]
      },
      {
        title: 'What is the return type of the "keyof" keyword in TypeScript?',
        name: 'q8',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'string', is_correct: true },
          { label: 'number', is_correct: false },
          { label: 'boolean', is_correct: false }
        ]
      },
      {
        title: 'In TypeScript, is "keyof" limited to object types, or can it also be used with other types?',
        name: 'q9',
        points: 2,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'It can only be used with object types', is_correct: false },
          { label: 'It can be used with any type', is_correct: true }
        ]
      },
      {
        title: 'What is the purpose of "keyof" in TypeScript when working with type constraints?',
        name: 'q10',
        points: 2,
        order: 10,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To limit the type of keys that can be accessed', is_correct: false },
          { label: 'To specify which keys are required in an object', is_correct: false },
          { label: 'To ensure that a key exists in a given type', is_correct: true }
        ]
      }
    ]
  }
};

export default template;
