import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'React useReducer Hook Quiz',
  description: 'Test your knowledge about the React useReducer hook.',
  questionnaire: {
    questions: [
      {
        title: 'What is the primary purpose of the useReducer hook in React?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Managing component state', is_correct: true },
          { label: 'Creating functional components', is_correct: false },
          { label: 'Accessing DOM elements', is_correct: false },
        ],
      },
      {
        title: 'How do you import the useReducer hook in a React component?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'import { useReducer } from "react";', is_correct: true },
          { label: 'import React, { useReducer } from "react";', is_correct: false },
          { label: 'import useReducer from "react";', is_correct: false },
        ],
      },
      {
        title: 'What is the main benefit of using useReducer over useState for managing complex state logic?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'It provides better performance', is_correct: false },
          { label: 'It simplifies state management', is_correct: false },
          { label: 'It allows for more predictable state updates', is_correct: true },
        ],
      },
      {
        title: 'What does the useReducer hook return?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'The current state value', is_correct: false },
          { label: 'A state updater function', is_correct: false },
          { label: 'A state and dispatch function pair', is_correct: true },
        ],
      },
      {
        title: 'In the context of useReducer, what is an "action"?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A function that modifies state directly', is_correct: false },
          { label: 'An object that describes what should happen', is_correct: true },
          { label: 'A built-in method for updating state', is_correct: false },
        ],
      },
      {
        title: 'How is an action typically defined when using useReducer?',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'As a string describing the action type', is_correct: false },
          { label: 'As a JavaScript object with a type property', is_correct: true },
          { label: 'As a function that returns the new state', is_correct: false },
        ],
      },
      {
        title: 'What is the purpose of the "dispatch" function returned by useReducer?',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To directly update the component state', is_correct: false },
          { label: 'To execute actions asynchronously', is_correct: false },
          { label: 'To send actions to the reducer to update state', is_correct: true },
        ],
      },
      {
        title: 'What is a common use case for the useReducer hook in React?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Managing simple component state', is_correct: false },
          { label: 'Handling side effects like API calls', is_correct: true },
          { label: 'Creating functional components', is_correct: false },
        ],
      },
      {
        title: 'Can you use useReducer and useState together in the same component?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Yes, they can be used interchangeably', is_correct: true },
          { label: 'No, they are mutually exclusive', is_correct: false },
          { label: 'Yes, but only in class components', is_correct: false },
        ],
      },
      {
        title: 'What is the second argument passed to the useReducer function, and what is its purpose?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'An initial state value; it defines the initial state of the reducer', is_correct: true },
          { label: 'An action creator function; it generates actions for the reducer', is_correct: false },
          { label: 'A callback function for state updates; it runs after each dispatch', is_correct: false },
        ],
      },
    ],
  },
};

export default template;
