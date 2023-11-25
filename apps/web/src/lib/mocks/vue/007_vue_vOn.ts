import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Vue.js v-on Directives Quiz',
  description: 'Test your knowledge of Vue.js v-on directives with practical questions.',
  questionnaire: {
    questions: [
      {
        title: 'What is the primary purpose of the v-on directive in Vue.js?',
        name: 'q1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To create data properties',
            is_correct: false
          },
          {
            label: 'To manage user interactions and respond to events',
            is_correct: true
          },
          {
            label: 'To define computed properties',
            is_correct: false
          }
        ]
      },
      {
        title: 'How can you attach a click event handler to an element using v-on?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the syntax for binding a method to an event using v-on?',
        name: 'q3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you pass data to an event handler using v-on?',
        name: 'q4',
        points: 3,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Explain the purpose of the "@click" syntax in v-on event binding.',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the difference between "v-on" and "v-bind" in Vue.js?',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you prevent the default behavior of an event using v-on?',
        name: 'q7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Explain the concept of event modifiers in Vue.js v-on directives.',
        name: 'q8',
        points: 3,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the purpose of the ".stop" event modifier in Vue.js v-on directives?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To stop event propagation',
            is_correct: true
          },
          {
            label: 'To stop the event handler',
            is_correct: false
          },
          {
            label: 'To stop event bubbling',
            is_correct: false
          }
        ]
      },
      {
        title: 'Explain the usage of the ".once" event modifier in Vue.js v-on directives.',
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
