import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Quiz on Extracting State Logic into a Reducer',
  description: 'Test your knowledge about extracting state logic into a reducer in React.',
  questionnaire: {
    questions: [
      {
        title: 'What is a reducer in React used for?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Managing component state',
            is_correct: false,
          },
          {
            label: 'Handling API requests',
            is_correct: false,
          },
          {
            label: 'Managing application state',
            is_correct: true,
          },
        ],
      },
      {
        title: 'When should you use the useReducer hook in React?',
        name: 'question2',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Only for managing form state',
            is_correct: false,
          },
          {
            label: 'For complex state management scenarios',
            is_correct: true,
          },
          {
            label: 'Only for handling API requests',
            is_correct: false,
          },
        ],
      },
      {
        title: 'Explain the purpose of the useContext hook in React.',
        name: 'question3',
        points: 3,
        order: 2,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'In React, what is the primary purpose of the useReducer hook?',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Handling CSS styles',
            is_correct: false,
          },
          {
            label: 'Managing component state',
            is_correct: true,
          },
          {
            label: 'Rendering JSX elements',
            is_correct: false,
          },
        ],
      },
      // Question 5 - RADIO
      {
        title: 'What does the dispatch function do in a reducer?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'It updates the component props.',
            is_correct: false,
          },
          {
            label: 'It triggers a re-render of the component.',
            is_correct: false,
          },
          {
            label: 'It sends an action to update the state.',
            is_correct: true,
          },
        ],
      },
      // Question 6 - CHECKBOX
      {
        title: 'Which of the following are valid use cases for using a reducer in React? (Select all that apply)',
        name: 'question6',
        points: 3,
        order: 5,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'Managing form input state',
            is_correct: true,
          },
          {
            label: 'Handling API requests',
            is_correct: true,
          },
          {
            label: "Updating the component's local state",
            is_correct: false,
          },
          {
            label: 'Managing global application state',
            is_correct: true,
          },
        ],
      },
      // Question 7 - RADIO
      {
        title: 'What is the initial value of state when using useReducer?',
        name: 'question7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'null',
            is_correct: false,
          },
          {
            label: 'undefined',
            is_correct: false,
          },
          {
            label: 'It depends on the initial state parameter.',
            is_correct: true,
          },
        ],
      },
      // Question 8 - TEXTAREA
      {
        title: 'Explain the role of the action object in a reducer function.',
        name: 'question8',
        points: 3,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      // Question 9 - RADIO
      {
        title: 'What is the key difference between useState and useReducer in React?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'useState is used for managing complex state logic, while useReducer is for simple state.',
            is_correct: false,
          },
          {
            label: 'useState is for managing local component state, while useReducer is for managing global state.',
            is_correct: true,
          },
          {
            label: 'useState is used for asynchronous state updates, while useReducer is for synchronous updates.',
            is_correct: false,
          },
        ],
      },
      // Question 10 - CHECKBOX
      {
        title: 'Which of the following are common actions you can perform in a reducer? (Select all that apply)',
        name: 'question10',
        points: 3,
        order: 9,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'Incrementing a counter',
            is_correct: true,
          },
          {
            label: 'Fetching data from an API',
            is_correct: true,
          },
          {
            label: 'Manipulating the DOM directly',
            is_correct: false,
          },
          {
            label: 'Toggling a boolean flag',
            is_correct: true,
          },
        ],
      },
    ],
  },
};

export default template;
