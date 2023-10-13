import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Vue.js v-bind Quiz',
  description: 'Test your knowledge of Vue.js v-bind with practical questions.',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of the "v-bind" directive in Vue.js?',
        name: 'q1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To conditionally apply a class to an element',
            is_correct: false,
          },
          {
            label: 'To dynamically bind an attribute to an element',
            is_correct: true,
          },
          {
            label: 'To define a computed property in Vue.js',
            is_correct: false,
          },
        ],
      },
      {
        title: 'How do you bind an attribute to an element using "v-bind"?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'Explain the usage of the "v-bind:class" directive in Vue.js.',
        name: 'q3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'What is the purpose of the "v-bind:style" directive in Vue.js?',
        name: 'q4',
        points: 3,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'How do you bind the "href" attribute of an anchor tag in Vue.js?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By using "v-href"',
            is_correct: false,
          },
          {
            label: 'By using "v-bind:href"',
            is_correct: true,
          },
          {
            label: 'By using "v-url"',
            is_correct: false,
          },
        ],
      },
      {
        title: 'Explain the usage of the "v-bind" directive with "v-for" in Vue.js.',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'How do you bind a method to a button click event using "v-on"?',
        name: 'q7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'What is the purpose of the "v-bind:key" directive in a "v-for" loop?',
        name: 'q8',
        points: 3,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'How can you bind an image source dynamically in Vue.js?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By using "v-src"',
            is_correct: false,
          },
          {
            label: 'By using "v-image"',
            is_correct: false,
          },
          {
            label: 'By using "v-bind:src"',
            is_correct: true,
          },
        ],
      },
      {
        title: 'Explain the usage of the "v-bind" directive with "v-model" in Vue.js.',
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
