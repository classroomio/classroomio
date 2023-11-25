import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'React ES6 Spread Operator Quiz',
  description: 'Test your knowledge of the React ES6 spread operator.',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of the spread operator (...) in JavaScript?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To concatenate arrays', is_correct: false },
          { label: 'To clone an object or array', is_correct: true },
          { label: 'To create a new function', is_correct: false }
        ]
      },
      {
        title: 'How do you use the spread operator to copy an array in JavaScript?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'array.copy()', is_correct: false },
          { label: 'array.clone()', is_correct: false },
          { label: '[...array]', is_correct: true }
        ]
      },
      {
        title: 'Which of the following is a valid use case for the spread operator in JavaScript?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Merging two arrays', is_correct: true },
          { label: 'Creating a new object', is_correct: false },
          { label: 'Defining a function', is_correct: false }
        ]
      },
      {
        title: 'What is the output of the following code: `const arr = [1, 2, ...[3, 4], 5];`?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '[1, 2, [3, 4], 5]', is_correct: false },
          { label: '[1, 2, 3, 4, 5]', is_correct: true },
          { label: '[1, 2, ...[3, 4], ...5]', is_correct: false }
        ]
      },
      {
        title: 'Select all valid use cases for the spread operator in JavaScript.',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'Cloning an array', is_correct: true },
          { label: 'Concatenating arrays', is_correct: true },
          { label: 'Merging objects', is_correct: true },
          { label: 'Defining a new function', is_correct: false }
        ]
      },
      {
        title: 'Write an example of using the spread operator to merge two objects in JavaScript.',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Explain the concept of shallow copying using the spread operator in JavaScript.',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What are the advantages of using the spread operator in JavaScript?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'List some common use cases for the spread operator in JavaScript.',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What happens if you use the spread operator on a non-iterable value in JavaScript?',
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
