import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Vue.js Computed Properties Quiz',
  description: 'Test your knowledge of Vue.js computed properties with practical questions.',
  questionnaire: {
    questions: [
      {
        title: 'What are computed properties in Vue.js used for?',
        name: 'q1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To perform asynchronous operations',
            is_correct: false,
          },
          {
            label: 'To calculate and cache derived data based on reactive dependencies',
            is_correct: true,
          },
          {
            label: 'To render dynamic templates',
            is_correct: false,
          },
        ],
      },
      {
        title: 'How do you define a computed property in a Vue component?',
        name: 'q2',
        points: 3,
        order: 1,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'In Vue.js, can you use a computed property to change data in a component?',
        name: 'q3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Yes, computed properties can change data directly',
            is_correct: false,
          },
          {
            label: 'No, computed properties are read-only and cannot modify data',
            is_correct: true,
          },
          {
            label: 'Only in specific situations',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the key advantage of using computed properties over methods in Vue.js?',
        name: 'q4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Computed properties are faster',
            is_correct: true,
          },
          {
            label: 'Methods are easier to write',
            is_correct: false,
          },
          {
            label: 'There is no difference between them',
            is_correct: false,
          },
        ],
      },
      {
        title: 'When should you use a computed property instead of a data property in Vue.js?',
        name: 'q5',
        points: 3,
        order: 4,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'How do you define a computed property that depends on multiple data properties?',
        name: 'q6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'By using the "computed" option and returning the computed value',
            is_correct: true,
          },
          {
            label: 'By defining a separate method to compute the value',
            is_correct: false,
          },
          {
            label: 'By using the "v-computed" directive',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What happens when the dependent data properties change in a computed property?',
        name: 'q7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'The computed property updates automatically',
            is_correct: true,
          },
          {
            label: 'The computed property becomes a method',
            is_correct: false,
          },
          {
            label: 'The computed property is cached and does not update',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is a common use case for computed properties in Vue.js?',
        name: 'q8',
        points: 3,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'In Vue.js, can you define a computed property with parameters?',
        name: 'q9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Yes, by using the "params" option',
            is_correct: false,
          },
          {
            label: 'No, computed properties do not support parameters',
            is_correct: true,
          },
          {
            label: 'Yes, by defining a method with parameters and using it as a computed property',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the scope of computed properties in Vue.js?',
        name: 'q10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
    ],
  },
};

export default template;
