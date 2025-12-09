import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'React useRef Hook Quiz',
  description: 'Test your knowledge about the React useRef hook.',
  questionnaire: {
    questions: [
      {
        title: 'What is the primary use case for the useRef hook in React?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To manage component state', is_correct: false },
          { label: 'To create functional components', is_correct: false },
          { label: 'To access and interact with DOM elements', is_correct: true }
        ]
      },
      {
        title: 'How do you import the useRef hook in a React component?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'import useRef from "react";', is_correct: false },
          { label: 'import { useRef } from "react";', is_correct: true },
          { label: 'import React, { useRef } from "react";', is_correct: false }
        ]
      },
      {
        title: 'What is the return value of the useRef hook?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'The current component state', is_correct: false },
          { label: 'A ref object', is_correct: true },
          { label: 'The component instance', is_correct: false }
        ]
      },
      {
        title: 'How do you create a ref using the useRef hook?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'const ref = useRef();', is_correct: true },
          { label: 'const ref = useRef(null);', is_correct: true },
          { label: 'const ref = useRef(undefined);', is_correct: false }
        ]
      },
      {
        title: 'What is a common use case for refs in React?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Accessing and interacting with DOM elements', is_correct: true },
          { label: 'Managing component state', is_correct: false },
          { label: 'Creating custom hooks', is_correct: false }
        ]
      },
      {
        title: 'How can you access the current value of a ref?',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'ref.current', is_correct: true },
          { label: 'ref.value', is_correct: false },
          { label: 'ref.get()', is_correct: false }
        ]
      },
      {
        title: 'What happens when you update the current value of a ref?',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'The component re-renders', is_correct: false },
          { label: 'The DOM is updated immediately', is_correct: false },
          { label: 'The value is updated without re-rendering', is_correct: true }
        ]
      },
      {
        title: 'Can you use the useRef hook to create multiple refs in a single component?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'No, it only supports a single ref per component', is_correct: false },
          { label: 'Yes, you can create as many refs as needed', is_correct: true },
          { label: 'Only if you wrap them in an array', is_correct: false }
        ]
      },
      {
        title: 'What is a ref object typically used for in React?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Managing component state', is_correct: false },
          { label: 'Accessing and interacting with DOM elements', is_correct: true },
          { label: 'Defining PropTypes', is_correct: false }
        ]
      },
      {
        title: 'Is it recommended to use refs for managing component state in React?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Yes, it is the preferred method', is_correct: false },
          { label: 'No, it is not recommended for managing state', is_correct: true },
          { label: 'It depends on the specific use case', is_correct: false }
        ]
      }
    ]
  }
};

export default template;
