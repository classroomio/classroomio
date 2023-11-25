import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Vue.js v-for Quiz',
  description: 'Test your knowledge of Vue.js v-for with practical questions.',
  questionnaire: {
    questions: [
      {
        title: 'What is the main purpose of the "v-for" directive in Vue.js?',
        name: 'q1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To conditionally render an element based on a condition',
            is_correct: false
          },
          {
            label: 'To iterate over an array and render elements for each item',
            is_correct: true
          },
          {
            label: 'To define a computed property in Vue.js',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you use "v-for" to iterate over an array and render elements in Vue.js?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Explain the key usage of "v-for" in a Vue.js template.',
        name: 'q3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the difference between "v-for" and "v-if" in Vue.js?',
        name: 'q4',
        points: 3,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you get the index of the current iteration in a "v-for" loop in Vue.js?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By using a computed property',
            is_correct: false
          },
          {
            label: 'By referencing the index variable',
            is_correct: true
          },
          {
            label: 'By using "v-index" directive',
            is_correct: false
          }
        ]
      },
      {
        title: 'Explain how "v-for" can be used to render a list of items with Vue.js.',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you conditionally render items in a "v-for" loop based on a condition?',
        name: 'q7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the purpose of the "key" attribute when using "v-for"?',
        name: 'q8',
        points: 3,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the main advantage of using "v-for" in Vue.js?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To create computed properties',
            is_correct: false
          },
          {
            label: 'To simplify rendering lists of data',
            is_correct: true
          },
          {
            label: 'To conditionally render elements',
            is_correct: false
          }
        ]
      },
      {
        title: 'Explain the usage of "v-for" with nested loops in Vue.js.',
        name: 'q10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      }
    ]
  }
};

export default template;
