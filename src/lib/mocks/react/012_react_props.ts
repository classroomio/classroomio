import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'React Props Quiz',
  description: 'Test your knowledge of React props.',
  questionnaire: {
    questions: [
      {
        title: 'What are props in React?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A method to define component styles', is_correct: false },
          { label: 'Data that is passed from a parent component to a child component', is_correct: true },
          { label: 'A way to define component state', is_correct: false },
        ],
      },
      {
        title: 'How do you pass props to a child component in React?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Using the `state` property', is_correct: false },
          { label: 'Using the `props` attribute in the child component\'s JSX', is_correct: true },
          { label: 'By directly modifying the child component\'s state', is_correct: false },
        ],
      },
      {
        title: 'Can props be modified within a child component in React?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Yes, props can be modified within a child component', is_correct: false },
          { label: 'No, props are immutable within a child component', is_correct: true },
          { label: 'Props can only be modified within a parent component', is_correct: false },
        ],
      },
      {
        title: 'Select all valid ways to define and use props in a React component.',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'Define props using the `props` attribute', is_correct: false },
          { label: 'Define props using a JavaScript object', is_correct: true },
          { label: 'Access props within a component using `this.props`', is_correct: true },
          { label: 'Access props directly as function parameters', is_correct: false },
        ],
      },
      {
        title: 'Write an example of passing and using props in a React component.',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'Explain the concept of "prop drilling" in React.',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'What is the significance of default props in React?',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'List some benefits of using props for component communication in React.',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'How can you handle missing props in a React component?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'Can you pass non-primitive data types (e.g., objects, arrays) as props in React?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Yes, you can pass non-primitive data types as props', is_correct: true },
          { label: 'No, only primitive data types can be passed as props', is_correct: false },
          { label: 'Non-primitive data types can only be passed as state', is_correct: false },
        ],
      },
    ],
  },
};

export default template;
