import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Vue.js Watchers Quiz',
  description: 'Test your knowledge of Vue.js watchers with practical questions.',
  questionnaire: {
    questions: [
      {
        title: 'What is a watcher in Vue.js used for?',
        name: 'q1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To observe and react to changes in data properties',
            is_correct: true
          },
          {
            label: 'To create new data properties',
            is_correct: false
          },
          {
            label: 'To define computed properties',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you define a watcher in a Vue component?',
        name: 'q2',
        points: 3,
        order: 1,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'In Vue.js, can you have multiple watchers for the same data property?',
        name: 'q3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Yes, you can have multiple watchers for the same property',
            is_correct: true
          },
          {
            label: 'No, you can only have one watcher for each property',
            is_correct: false
          },
          {
            label: 'Only if the data property is an array',
            is_correct: false
          }
        ]
      },
      {
        title: 'When is a watcher function executed in Vue.js?',
        name: 'q4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Before the data property changes',
            is_correct: false
          },
          {
            label: 'Immediately after the data property changes',
            is_correct: true
          },
          {
            label: 'At a specific interval set by the developer',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the main difference between a computed property and a watcher in Vue.js?',
        name: 'q5',
        points: 3,
        order: 4,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How do you unregister a watcher in Vue.js?',
        name: 'q6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'By using the "$off" method',
            is_correct: false
          },
          {
            label: 'By setting the watcher function to null',
            is_correct: false
          },
          {
            label: 'By calling the "$unwatch" method on the component',
            is_correct: true
          }
        ]
      },
      {
        title: 'What is the purpose of using a deep watcher in Vue.js?',
        name: 'q7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To watch changes in nested data properties of objects or arrays',
            is_correct: true
          },
          {
            label: 'To watch data properties only at the top level',
            is_correct: false
          },
          {
            label: 'To watch computed properties',
            is_correct: false
          }
        ]
      },
      {
        title: 'What happens if you attempt to watch a non-existent data property in Vue.js?',
        name: 'q8',
        points: 3,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Can you use watchers with computed properties in Vue.js?',
        name: 'q9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Yes, watchers can be used with computed properties',
            is_correct: true
          },
          {
            label: 'No, computed properties and watchers are mutually exclusive',
            is_correct: false
          },
          {
            label: 'Only in specific situations',
            is_correct: false
          }
        ]
      },
      {
        title: 'In Vue.js, what is the purpose of the "immediate" option in a watcher definition?',
        name: 'q10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To trigger the watcher immediately after component creation',
            is_correct: true
          },
          {
            label: 'To prevent the watcher from ever executing',
            is_correct: false
          },
          {
            label: 'To delay the execution of the watcher',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
