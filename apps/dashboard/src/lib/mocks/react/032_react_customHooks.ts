import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'React Custom Hooks Quiz',
  description: 'Test your knowledge about custom hooks in React.',
  questionnaire: {
    questions: [
      {
        title: 'What is a custom hook in React?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A built-in React hook', is_correct: false },
          { label: 'A reusable function for sharing logic between components', is_correct: true },
          { label: 'A way to create class components', is_correct: false }
        ]
      },
      {
        title: 'How do you define a custom hook in React?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'By extending the React.Component class', is_correct: false },
          { label: 'By creating a function with a name starting with "use"', is_correct: true },
          { label: 'By importing a hook from a third-party library', is_correct: false }
        ]
      },
      {
        title: 'What is the convention for naming custom hooks in React?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Any valid function name', is_correct: false },
          { label: 'Starting with "use" followed by a descriptive name', is_correct: true },
          { label: 'Starting with "custom" followed by a random name', is_correct: false }
        ]
      },
      {
        title: 'Can custom hooks have their own state?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Yes, but only if they are used within class components', is_correct: false },
          { label: 'No, custom hooks cannot have state', is_correct: false },
          {
            label: 'Yes, custom hooks can have their own state using the "useState" hook',
            is_correct: true
          }
        ]
      },
      {
        title: 'What is the primary advantage of using custom hooks in React?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'They improve component rendering performance', is_correct: false },
          { label: 'They allow you to share logic between components', is_correct: true },
          { label: 'They provide built-in state management', is_correct: false }
        ]
      },
      {
        title: 'In which scenarios might you consider creating a custom hook?',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'When you have logic that is reused across multiple components',
            is_correct: true
          },
          { label: 'When you need to create a new React component', is_correct: false },
          { label: 'When you want to optimize network requests', is_correct: false },
          { label: 'When you need to add styles to a component', is_correct: false }
        ]
      },
      {
        title: 'Can custom hooks accept parameters?',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'No, custom hooks cannot accept parameters', is_correct: false },
          {
            label: 'Yes, custom hooks can accept parameters like any regular function',
            is_correct: true
          },
          { label: 'Only if they are declared inside a class component', is_correct: false }
        ]
      },
      {
        title: 'What is the typical return value of a custom hook?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A JSX element', is_correct: false },
          { label: 'An object containing state and lifecycle methods', is_correct: false },
          { label: 'An array with state values and functions to update them', is_correct: false },
          {
            label: 'An array with values and functions as needed by the component',
            is_correct: true
          }
        ]
      },
      {
        title: 'What is the primary benefit of using custom hooks for state management?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Custom hooks simplify state management', is_correct: false },
          { label: 'Custom hooks encapsulate state logic and make it reusable', is_correct: true },
          { label: 'Custom hooks allow you to directly modify component state', is_correct: false }
        ]
      },
      {
        title: 'What is the recommended approach for sharing custom hooks between components?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Copying and pasting the hook code into each component', is_correct: false },
          {
            label: 'Importing and using the custom hook in the components that need it',
            is_correct: true
          },
          { label: 'Declaring the custom hook as a global variable', is_correct: false }
        ]
      }
    ]
  }
};

export default template;
