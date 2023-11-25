import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'React ES6 Ternary Operator Quiz',
  description: 'Test your knowledge of the React ES6 ternary operator.',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of the ternary operator in JavaScript?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To declare variables', is_correct: false },
          { label: 'To conditionally assign a value based on a condition', is_correct: true },
          { label: 'To define reusable functions', is_correct: false }
        ]
      },
      {
        title: 'How does the ternary operator differ from an "if...else" statement?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'The ternary operator cannot be used for conditional assignments',
            is_correct: false
          },
          { label: 'The ternary operator is shorter and results in a value', is_correct: true },
          {
            label: 'The ternary operator can only be used for boolean conditions',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the syntax of the ternary operator in JavaScript?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'if (condition) { value1 } else { value2 }', is_correct: false },
          { label: 'condition ? value1 : value2', is_correct: true },
          { label: 'condition ? { value1 } : { value2 }', is_correct: false }
        ]
      },
      {
        title: 'How do you use the ternary operator to assign a value based on a condition?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Using "if" statements', is_correct: false },
          { label: 'Using "switch" statements', is_correct: false },
          { label: 'Using the "?" and ":" symbols', is_correct: true }
        ]
      },
      {
        title: 'Select all valid use cases for the ternary operator in JavaScript.',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'Assigning a value based on a condition', is_correct: true },
          { label: 'Replacing "if...else" statements', is_correct: true },
          { label: 'Defining functions', is_correct: false },
          { label: 'Creating arrays', is_correct: false }
        ]
      },
      {
        title:
          'Write an example of using the ternary operator to conditionally assign a value in JavaScript.',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title:
          'Explain the concept of a "truthy" and "falsy" value in the context of the ternary operator.',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title:
          'What is the advantage of using the ternary operator over an "if...else" statement in certain situations?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'List some common pitfalls to avoid when using the ternary operator in JavaScript.',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you nest ternary operators in JavaScript?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      }
    ]
  }
};

export default template;
