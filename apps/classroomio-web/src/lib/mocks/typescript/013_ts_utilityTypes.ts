import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'TypeScript Utility Types Quiz',
  description: 'Test your knowledge of TypeScript utility types!',
  questionnaire: {
    questions: [
      {
        title: 'What are TypeScript utility types?',
        name: 'q1',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Built-in TypeScript types', is_correct: true },
          { label: 'JavaScript utility functions', is_correct: false },
          { label: 'Custom types defined by developers', is_correct: false }
        ]
      },
      {
        title:
          'Which TypeScript utility type is used to create a new type that is a subset of an existing type?',
        name: 'q2',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Partial', is_correct: false },
          { label: 'Pick', is_correct: false },
          { label: 'Omit', is_correct: false },
          { label: 'Subset', is_correct: true }
        ]
      },
      {
        title: 'What does the TypeScript utility type "Partial" do?',
        name: 'q3',
        points: 2,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Makes a type required', is_correct: false },
          { label: 'Makes a type optional', is_correct: true },
          { label: 'Creates a union type', is_correct: false }
        ]
      },
      {
        title:
          'Which TypeScript utility type allows you to pick specific properties from an object type?',
        name: 'q4',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Partial', is_correct: false },
          { label: 'Pick', is_correct: true },
          { label: 'Omit', is_correct: false }
        ]
      },
      {
        title: 'How do you use the TypeScript utility type "Record" to define a dictionary type?',
        name: 'q5',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Record<string, T>', is_correct: true },
          { label: 'Record<T, string>', is_correct: false },
          { label: 'Record<key, value>', is_correct: false }
        ]
      },
      {
        title: 'Which TypeScript utility type removes specific properties from an object type?',
        name: 'q6',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Partial', is_correct: false },
          { label: 'Pick', is_correct: false },
          { label: 'Omit', is_correct: true }
        ]
      },
      {
        title: 'What is the purpose of the TypeScript utility type "Required"?',
        name: 'q7',
        points: 2,
        order: 7,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'Makes all properties in a type required', is_correct: true },
          { label: 'Makes all properties in a type optional', is_correct: false },
          { label: 'Creates a new type with some required properties', is_correct: false }
        ]
      },
      {
        title:
          'Which TypeScript utility type is used to create a new type that is the opposite of the specified type?',
        name: 'q8',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Partial', is_correct: false },
          { label: 'Required', is_correct: false },
          { label: 'Exclude', is_correct: true },
          { label: 'Extract', is_correct: false }
        ]
      },
      {
        title: 'What is the purpose of the TypeScript utility type "Exclude"?',
        name: 'q9',
        points: 2,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Includes specific properties in a type', is_correct: false },
          { label: 'Excludes specific properties from a type', is_correct: true },
          { label: 'Creates a union type', is_correct: false }
        ]
      },
      {
        title:
          'Which TypeScript utility type is used to create a new type that is the intersection of the specified types?',
        name: 'q10',
        points: 2,
        order: 10,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Partial', is_correct: false },
          { label: 'Required', is_correct: false },
          { label: 'Exclude', is_correct: false },
          { label: 'Extract', is_correct: true }
        ]
      }
    ]
  }
};

export default template;
