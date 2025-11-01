import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'React Forms Quiz',
  description: 'Test your knowledge of React forms.',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of forms in React?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To collect user input data', is_correct: true },
          { label: 'To style web pages', is_correct: false },
          { label: 'To render lists of items', is_correct: false }
        ]
      },
      {
        title: 'Which HTML element is commonly used to create forms in React?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '<form>', is_correct: true },
          { label: '<div>', is_correct: false },
          { label: '<input>', is_correct: false }
        ]
      },
      {
        title: 'What is the purpose of the `onChange` event handler in React forms?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To submit the form data', is_correct: false },
          { label: 'To trigger an action when the form input changes', is_correct: true },
          { label: 'To reset the form', is_correct: false }
        ]
      },
      {
        title: 'Select all the types of form inputs commonly used in React forms.',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'Text input', is_correct: true },
          { label: 'Radio buttons', is_correct: true },
          { label: 'Dropdown select', is_correct: true },
          { label: 'Checkbox', is_correct: true }
        ]
      },
      {
        title: 'Write an example of a controlled form input in React.',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the purpose of the `value` attribute in controlled form inputs?',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Explain the concept of form validation in React.',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you prevent the default form submission behavior in React?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the purpose of the `onSubmit` event handler in React forms?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Can you use the same form for both controlled and uncontrolled form inputs in React?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: "Yes, it doesn't matter", is_correct: false },
          {
            label: 'No, each form should use either controlled or uncontrolled inputs',
            is_correct: true
          },
          { label: 'Only if you use a special wrapper component', is_correct: false }
        ]
      }
    ]
  }
};

export default template;
