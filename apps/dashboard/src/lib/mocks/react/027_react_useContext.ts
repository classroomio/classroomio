import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'React useContext Hook Quiz',
  description: 'Test your knowledge about the React useContext hook.',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of the useContext hook in React?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To create functional components', is_correct: false },
          { label: 'To consume context values in functional components', is_correct: true },
          { label: 'To manage state in class components', is_correct: false }
        ]
      },
      {
        title: 'How do you import the useContext hook in a React component?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'import useContext from "react";', is_correct: false },
          { label: 'import { useContext } from "react";', is_correct: true },
          { label: 'import React, { useContext } from "react";', is_correct: false }
        ]
      },
      {
        title: 'Which function is used to access context values in useContext?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'useContextValue', is_correct: false },
          { label: 'getContext', is_correct: false },
          { label: 'The function returned by useContext', is_correct: true }
        ]
      },
      {
        title: 'What is the return value of useContext?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'The context itself', is_correct: false },
          { label: 'The context provider', is_correct: false },
          { label: 'The current context value', is_correct: true }
        ]
      },
      {
        title: 'How do you wrap your components with a context provider?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '<Context.Provider value={...}>', is_correct: true },
          { label: '<Context.Provider>', is_correct: false },
          { label: '<Context.Consumer>', is_correct: false }
        ]
      },
      {
        title: 'What happens if a component attempts to consume context outside a context provider?',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'It throws an error', is_correct: true },
          { label: 'It works normally', is_correct: false },
          { label: 'It logs a warning', is_correct: false }
        ]
      },
      {
        title: 'How can you provide a default value for context?',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'By specifying a default prop', is_correct: false },
          { label: 'By using the "defaultValue" property in createContext', is_correct: true },
          { label: 'By using the "default" keyword', is_correct: false }
        ]
      },
      {
        title: 'How do you consume multiple contexts in a component?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'By nesting context providers', is_correct: true },
          { label: 'By using a single useContext call', is_correct: false },
          { label: 'By using the "multiple" option in useContext', is_correct: false }
        ]
      },
      {
        title: 'What happens if two context providers with the same context are nested?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'The inner provider overrides the outer provider', is_correct: true },
          { label: 'An error is thrown', is_correct: false },
          { label: 'Both providers are used independently', is_correct: false }
        ]
      },
      {
        title: 'What is the primary use case for useContext?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To create class components', is_correct: false },
          { label: 'To consume context values in functional components', is_correct: true },
          { label: 'To manage state in functional components', is_correct: false }
        ]
      }
    ]
  }
};

export default template;
