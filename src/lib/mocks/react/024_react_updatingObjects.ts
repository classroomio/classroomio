import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'React Updating Objects in State Practical Quiz',
  description: 'Test your practical knowledge of updating objects in state in React.',
  questionnaire: {
    questions: [
      {
        title: 'How do you update the value of a specific key in a state object in React?',
        name: 'updateObjectKey',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0],
        options: [
          {
            label: 'Use the spread operator to create a copy and then update the specific key.',
            is_correct: true,
          },
          {
            label: 'Use the setState method directly to update the key.',
            is_correct: false,
          },
          {
            label: 'Create a new object and replace the entire state with the updated object.',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the purpose of the "immutability" concept when updating objects in state?',
        name: 'immutabilityPurpose',
        points: 1,
        order: 1,
        question_type: QuestionTypes[2],
        options: [],
      },
      {
        title: 'How can you update an object within an array in state without mutating the original state?',
        name: 'updateObjectInArray',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0],
        options: [
          {
            label: 'Use map to create a new array with the updated object.',
            is_correct: true,
          },
          {
            label: 'Modify the object directly in the array.',
            is_correct: false,
          },
          {
            label: 'Replace the entire array with the updated object.',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the purpose of the "spread operator" (...) when updating objects in React state?',
        name: 'spreadOperatorPurpose',
        points: 1,
        order: 3,
        question_type: QuestionTypes[2],
        options: [],
      },
      {
        title: 'How can you update a deeply nested object within the state?',
        name: 'updateDeeplyNestedObject',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0],
        options: [
          {
            label: 'Use a combination of spread operators to update each level of nesting.',
            is_correct: true,
          },
          {
            label: 'Use a single spread operator for the entire object.',
            is_correct: false,
          },
          {
            label: 'Manually update each level of nesting.',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the recommended approach for updating state when the new state depends on the previous state?',
        name: 'updatingStateDependsOnPreviousState',
        points: 1,
        order: 5,
        question_type: QuestionTypes[1],
        options: [
          {
            label: 'Use a function with the setState method to ensure the latest state is used.',
            is_correct: true,
          },
          {
            label: 'Update the state directly without considering the previous state.',
            is_correct: false,
          },
          {
            label: 'Use Redux for all state updates.',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the purpose of the "prevState" argument in the setState function?',
        name: 'prevStateArgumentPurpose',
        points: 1,
        order: 6,
        question_type: QuestionTypes[2],
        options: [],
      },
      {
        title: 'How do you handle asynchronous state updates in React?',
        name: 'asyncStateUpdates',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0],
        options: [
          {
            label: 'Use the callback function provided by the setState method.',
            is_correct: true,
          },
          {
            label: 'Always use setTimeout for all state updates.',
            is_correct: false,
          },
          {
            label: 'Asynchronous state updates are not supported in React.',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the purpose of the "shouldComponentUpdate" lifecycle method in React?',
        name: 'shouldComponentUpdatePurpose',
        points: 1,
        order: 8,
        question_type: QuestionTypes[2],
        options: [],
      },
      {
        title: 'How can you optimize the performance of a React component when updating objects in state?',
        name: 'optimizePerformance',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0],
        options: [
          {
            label: 'Implement the "shouldComponentUpdate" method to control updates.',
            is_correct: true,
          },
          {
            label: 'Always use "setState" without any optimization.',
            is_correct: false,
          },
          {
            label: 'Use Redux for all state updates to improve performance.',
            is_correct: false,
          },
        ],
      },
    ],
  },
};

export default template;
