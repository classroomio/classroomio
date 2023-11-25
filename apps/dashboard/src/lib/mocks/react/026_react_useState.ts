import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'React useState Hook Quiz',
  description: 'Test your knowledge about the React useState hook.',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of the useState hook in React?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To manage state in class components', is_correct: false },
          { label: 'To manage state in functional components', is_correct: true },
          { label: 'To handle events in React', is_correct: false }
        ]
      },
      {
        title: 'How do you import the useState hook in a React component?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'import useState from "react";', is_correct: true },
          { label: 'import { useState } from "react";', is_correct: false },
          { label: 'import React, { useState } from "react";', is_correct: false }
        ]
      },
      {
        title: 'Which of the following is a valid way to use the useState hook?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'const [count, setCount] = useState(0);', is_correct: true },
          { label: 'useState(count);', is_correct: false },
          { label: 'const count = useState(0);', is_correct: false }
        ]
      },
      {
        title: 'What is the value returned by the useState hook?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A function for updating the state', is_correct: false },
          {
            label: 'An array containing the current state value and a function to update it',
            is_correct: true
          },
          { label: 'The current state value', is_correct: false }
        ]
      },
      {
        title: 'In which part of a functional component do you typically call the useState hook?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Inside a JSX element', is_correct: false },
          { label: 'Inside the component function body', is_correct: true },
          { label: 'Inside the component render method', is_correct: false }
        ]
      },
      {
        title: 'How do you update the state using the useState hook?',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'By directly modifying the state variable', is_correct: false },
          {
            label: 'By calling the function returned by useState with the new state value',
            is_correct: true
          },
          { label: 'By using setState() method', is_correct: false }
        ]
      },
      {
        title: 'What is the initial state value in the following code?',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '0', is_correct: false },
          { label: 'null', is_correct: false },
          { label: 'The argument passed to useState (0 in this case)', is_correct: true }
        ]
      },
      {
        title: 'What is the purpose of the state update function returned by useState?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To retrieve the current state value', is_correct: false },
          { label: 'To set the initial state value', is_correct: false },
          { label: 'To update the state with a new value', is_correct: true }
        ]
      },
      {
        title: 'What is the recommended way to update the state based on the previous state value?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'By using a class component', is_correct: false },
          { label: 'By using the setState method', is_correct: false },
          { label: 'By passing a function to the state update function', is_correct: true }
        ]
      },
      {
        title: 'How can you access the current state value inside a functional component?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'By using this.state', is_correct: false },
          { label: 'By passing props to the component', is_correct: false },
          { label: 'By using the state variable returned by useState', is_correct: true }
        ]
      }
    ]
  }
};

export default template;
