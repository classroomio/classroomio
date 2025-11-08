import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'React State Sharing Practical Quiz',
  description: 'Test your practical knowledge of sharing state between components in React.',
  questionnaire: {
    questions: [
      {
        title: 'What is the primary purpose of using props to share data between React components?',
        name: 'propsPurpose',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0],
        options: [
          {
            label: 'To pass data from a parent component to its child components.',
            is_correct: true
          },
          {
            label: 'To pass data from a child component to its parent components.',
            is_correct: false
          },
          {
            label: 'To create local component data.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the recommended way to pass a function as a prop in React?',
        name: 'passingFunctionAsProp',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0],
        options: [
          {
            label: 'Create a function in the child component and call it in the parent component.',
            is_correct: false
          },
          {
            label: 'Pass the function as a prop from the parent component to the child component.',
            is_correct: true
          },
          {
            label: 'Use a global variable to share the function.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is a common use case for using context to share state in React?',
        name: 'contextUseCase',
        points: 1,
        order: 2,
        question_type: QuestionTypes[2],
        options: []
      },
      {
        title: 'How can you share state between components using React Context?',
        name: 'sharingStateWithContext',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0],
        options: [
          {
            label: 'Wrap the components with a Context Provider and use the useContext hook.',
            is_correct: true
          },
          {
            label: 'Pass the state as a prop to each component.',
            is_correct: false
          },
          {
            label: 'Use Redux for state management.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "useReducer" hook in React?',
        name: 'useReducerPurpose',
        points: 1,
        order: 4,
        question_type: QuestionTypes[2],
        options: []
      },
      {
        title: 'How does the "useReducer" hook differ from the "useState" hook in React?',
        name: 'useReducerVsUseState',
        points: 1,
        order: 5,
        question_type: QuestionTypes[1],
        options: [
          {
            label: 'useReducer is used for managing complex state logic, while useState is for simple state.',
            is_correct: true
          },
          {
            label: 'useState is used for managing complex state logic, while useReducer is for simple state.',
            is_correct: false
          },
          {
            label: 'There is no difference between them.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "prop drilling" problem in React?',
        name: 'propDrillingPurpose',
        points: 1,
        order: 6,
        question_type: QuestionTypes[2],
        options: []
      },
      {
        title: 'How can you avoid prop drilling in React?',
        name: 'avoidingPropDrilling',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0],
        options: [
          {
            label: 'Use context to share state.',
            is_correct: true
          },
          {
            label: 'Always pass props directly to the child components.',
            is_correct: false
          },
          {
            label: 'Use global variables to store state.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of using Redux for state management in React applications?',
        name: 'reduxPurpose',
        points: 1,
        order: 8,
        question_type: QuestionTypes[2],
        options: []
      },
      {
        title: 'What is the role of a Redux reducer function?',
        name: 'reduxReducerRole',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0],
        options: [
          {
            label: 'To specify how the state should change in response to actions.',
            is_correct: true
          },
          {
            label: 'To define the initial state of the application.',
            is_correct: false
          },
          {
            label: 'To connect React components to the Redux store.',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
