import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'React ES6 Array Methods Quiz',
  description: 'Test your knowledge of React ES6 array methods.',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of the "map" method in JavaScript?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To filter elements in an array', is_correct: false },
          { label: 'To create a new array with the results of calling a provided function on every element', is_correct: true },
          { label: 'To remove elements from an array', is_correct: false },
        ],
      },
      {
        title: 'Which of the following array methods is used to filter elements based on a condition?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'forEach', is_correct: false },
          { label: 'map', is_correct: false },
          { label: 'filter', is_correct: true },
        ],
      },
      {
        title: 'What does the "reduce" method do in JavaScript?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Sorts an array in ascending order', is_correct: false },
          { label: 'Combines all elements in an array into a single value', is_correct: true },
          { label: 'Removes the last element from an array', is_correct: false },
        ],
      },
      {
        title: 'Which array method is used to add elements to the end of an array?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'push', is_correct: true },
          { label: 'pop', is_correct: false },
          { label: 'shift', is_correct: false },
        ],
      },
      {
        title: 'What is the purpose of the "find" method in JavaScript arrays?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To find the index of an element in an array', is_correct: false },
          { label: 'To find the first element that satisfies a given condition', is_correct: true },
          { label: 'To remove elements from an array', is_correct: false },
        ],
      },
      {
        title: 'Select all array methods that modify the original array in place.',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'map', is_correct: false },
          { label: 'filter', is_correct: false },
          { label: 'splice', is_correct: true },
          { label: 'push', is_correct: true },
        ],
      },
      {
        title: 'Write an example of using the "reduce" method to find the sum of an array of numbers.',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'Explain the difference between "map" and "forEach" in JavaScript arrays.',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'What is the purpose of the "some" method in JavaScript?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'List some common use cases for the "filter" method in JavaScript arrays.',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
    ],
  },
};

export default template;
