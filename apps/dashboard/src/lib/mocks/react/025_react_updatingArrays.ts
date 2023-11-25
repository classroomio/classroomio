import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'React Updating Arrays in State Practical Quiz',
  description: 'Test your practical knowledge of updating arrays in state in React.',
  questionnaire: {
    questions: [
      {
        title:
          'How do you add an item to an array in state without mutating the original array in React?',
        name: 'addItemToArray',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0],
        options: [
          {
            label: 'Use the spread operator to create a copy of the array and add the item.',
            is_correct: true
          },
          {
            label: 'Use the push method to add the item directly to the array.',
            is_correct: false
          },
          {
            label: 'Replace the entire array with the new item.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "concat" method when updating arrays in React?',
        name: 'concatMethodPurpose',
        points: 1,
        order: 1,
        question_type: QuestionTypes[2],
        options: []
      },
      {
        title:
          'How can you remove an item from an array in state without mutating the original array in React?',
        name: 'removeItemFromArray',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0],
        options: [
          {
            label: 'Use the filter method to create a new array without the item.',
            is_correct: true
          },
          {
            label: 'Use the splice method to remove the item directly from the array.',
            is_correct: false
          },
          {
            label: 'Set the item to null or undefined to mark it as removed.',
            is_correct: false
          }
        ]
      },
      {
        title:
          'What is the recommended approach for updating an array in state when the new state depends on the previous state?',
        name: 'updatingArrayStateDependsOnPreviousState',
        points: 1,
        order: 3,
        question_type: QuestionTypes[1],
        options: [
          {
            label: 'Use a function with the setState method to ensure the latest state is used.',
            is_correct: true
          },
          {
            label: 'Update the array state directly without considering the previous state.',
            is_correct: false
          },
          {
            label: 'Use Redux for all array state updates.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "map" method when updating arrays of objects in React?',
        name: 'mapMethodPurpose',
        points: 1,
        order: 4,
        question_type: QuestionTypes[2],
        options: []
      },
      {
        title:
          'How do you update an array of objects in state when you want to modify specific properties of an object?',
        name: 'updateArrayObjectProperties',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0],
        options: [
          {
            label: 'Use map to create a new array with the updated object properties.',
            is_correct: true
          },
          {
            label: 'Modify the object properties directly in the array.',
            is_correct: false
          },
          {
            label: 'Replace the entire array with the updated object.',
            is_correct: false
          }
        ]
      },
      {
        title:
          'What is the recommended approach for updating an array in state when reordering items?',
        name: 'reorderingArrayItems',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0],
        options: [
          {
            label: 'Use the "sort" method to reorder items in the array.',
            is_correct: false
          },
          {
            label: 'Use a function to reorder items and then update the array.',
            is_correct: true
          },
          {
            label: 'Always replace the entire array with the reordered items.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "slice" method when working with arrays in React?',
        name: 'sliceMethodPurpose',
        points: 1,
        order: 7,
        question_type: QuestionTypes[2],
        options: []
      },
      {
        title: 'How can you optimize the performance of updating large arrays in React?',
        name: 'optimizeArrayUpdates',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0],
        options: [
          {
            label: 'Use the "slice" method to create a copy of a portion of the array.',
            is_correct: true
          },
          {
            label: 'Always use "push" for array updates to improve performance.',
            is_correct: false
          },
          {
            label: 'Use Redux for all array updates to improve performance.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "splice" method when updating arrays in React?',
        name: 'spliceMethodPurpose',
        points: 1,
        order: 9,
        question_type: QuestionTypes[2],
        options: []
      }
    ]
  }
};

export default template;
