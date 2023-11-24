import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'TypeScript Null and Undefined Quiz',
  description: 'Test your knowledge of TypeScript null and undefined!',
  questionnaire: {
    questions: [
      {
        title: 'What is the value of a variable that has been declared but not assigned in TypeScript?',
        name: 'q1',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'null', is_correct: false },
          { label: 'undefined', is_correct: true },
          { label: '0', is_correct: false },
        ],
      },
      {
        title: 'What is the difference between null and undefined in TypeScript?',
        name: 'q2',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'There is no difference; they are the same.', is_correct: false },
          { label: 'null represents an intentional absence of any object value, while undefined represents a variable that has been declared but not assigned.', is_correct: true },
          { label: 'null is a number with a value of zero, while undefined is a number with a value of NaN.', is_correct: false },
        ],
      },
      {
        title: 'How can you explicitly set a variable to have a value of null in TypeScript?',
        name: 'q3',
        points: 2,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Using the "undefined" keyword', is_correct: false },
          { label: 'By assigning the value null to the variable', is_correct: true },
          { label: 'By using the "NaN" keyword', is_correct: false },
        ],
      },
      {
        title: 'Which of the following statements is true about the "undefined" type in TypeScript?',
        name: 'q4',
        points: 2,
        order: 4,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'It represents the absence of a value', is_correct: true },
          { label: 'It is a subtype of all other types', is_correct: true },
          { label: 'It is the same as "null"', is_correct: false },
          { label: 'It cannot be assigned to a variable', is_correct: false },
        ],
      },
      {
        title: 'In TypeScript, how do you check if a variable is null or undefined?',
        name: 'q5',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Using the "void" keyword', is_correct: false },
          { label: 'Using the "isNullOrUndefined" function', is_correct: false },
          { label: 'Using strict equality operators (===)', is_correct: true },
        ],
      },
      {
        title: 'What does the "nullish coalescing operator (??)" do in TypeScript?',
        name: 'q6',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'It performs bitwise operations on null and undefined values', is_correct: false },
          { label: 'It throws an error when used with null or undefined values', is_correct: false },
          { label: 'It returns the right-hand operand if the left-hand operand is null or undefined, otherwise it returns the left-hand operand', is_correct: true },
        ],
      },
      {
        title: 'What is the value of a variable that has not been declared in TypeScript?',
        name: 'q7',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'null', is_correct: false },
          { label: 'undefined', is_correct: false },
          { label: 'An error is thrown', is_correct: true },
        ],
      },
      {
        title: 'How do you assign a variable to be explicitly undefined in TypeScript?',
        name: 'q8',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Using the "null" keyword', is_correct: false },
          { label: 'By not assigning any value to the variable', is_correct: false },
          { label: 'By assigning the value undefined to the variable', is_correct: true },
        ],
      },
      {
        title: 'What does the "void" keyword represent in TypeScript?',
        name: 'q9',
        points: 2,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'An empty value', is_correct: true },
          { label: 'A null value', is_correct: false },
          { label: 'An undefined value', is_correct: false },
        ],
      },
      {
        title: 'In TypeScript, can you use "undefined" as a variable name?',
        name: 'q10',
        points: 2,
        order: 10,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Yes, "undefined" is a valid variable name', is_correct: true },
          { label: 'No, "undefined" is a reserved keyword and cannot be used as a variable name', is_correct: false },
        ],
      },
    ],
  },
};

export default template;
