import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'React useEffect Hook Quiz',
  description: 'Test your knowledge about the React useEffect hook.',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of the useEffect hook in React?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To manage state in functional components', is_correct: false },
          { label: 'To perform side effects in functional components', is_correct: true },
          { label: 'To create class components', is_correct: false }
        ]
      },
      {
        title: 'How do you import the useEffect hook in a React component?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'import useEffect from "react";', is_correct: false },
          { label: 'import { useEffect } from "react";', is_correct: true },
          { label: 'import React, { useEffect } from "react";', is_correct: false }
        ]
      },
      {
        title: 'What is the main use case of the useEffect hook?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To manage component state', is_correct: false },
          { label: 'To create custom hooks', is_correct: false },
          { label: 'To perform side effects in functional components', is_correct: true }
        ]
      },
      {
        title: 'Which function is used for cleanup in useEffect?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'cleanupEffect', is_correct: false },
          { label: 'cleanUp', is_correct: false },
          { label: 'The function returned by useEffect', is_correct: true }
        ]
      },
      {
        title: 'When does the cleanup function in useEffect run?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Immediately after rendering', is_correct: false },
          { label: 'Before rendering', is_correct: false },
          { label: 'Before the component unmounts', is_correct: true }
        ]
      },
      {
        title:
          'In which parameter of useEffect can you specify the dependencies for running the effect?',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'In the second parameter array', is_correct: true },
          { label: 'In the first parameter function', is_correct: false },
          { label: 'In the component props', is_correct: false }
        ]
      },
      {
        title:
          'What is the effect of passing an empty array [] as the second parameter in useEffect?',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'It disables the effect', is_correct: false },
          { label: 'It runs the effect on every render', is_correct: false },
          { label: 'It runs the effect only once after the initial render', is_correct: true }
        ]
      },
      {
        title: 'How can you conditionally run an effect in useEffect?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'By using if statements inside the effect function', is_correct: false },
          { label: 'By using a conditional inside the second parameter array', is_correct: false },
          {
            label:
              'By specifying the condition inside the effect function and using it as a dependency',
            is_correct: true
          }
        ]
      },
      {
        title: 'What is the return type of the useEffect hook?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'void', is_correct: false },
          { label: 'number', is_correct: false },
          { label: 'function', is_correct: true }
        ]
      },
      {
        title: 'Which hook is used to fetch data in a functional component?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'useState', is_correct: false },
          { label: 'useEffect', is_correct: false },
          { label: 'useFetch', is_correct: true }
        ]
      }
    ]
  }
};

export default template;
