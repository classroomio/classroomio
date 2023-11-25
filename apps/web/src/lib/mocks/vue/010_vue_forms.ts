import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Vue.js Forms Quiz',
  description: 'Test your knowledge of Vue.js forms with practical questions.',
  questionnaire: {
    questions: [
      {
        title: 'How do you create a text input field in Vue.js?',
        name: 'q1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Using the <input> element',
            is_correct: true
          },
          {
            label: 'Using the <form> element',
            is_correct: false
          },
          {
            label: 'Using the <textarea> element',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "v-model" directive in Vue.js forms?',
        name: 'q2',
        points: 3,
        order: 1,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you validate a form input in Vue.js?',
        name: 'q3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'Using computed properties',
            is_correct: true
          },
          {
            label: 'Using Vue.js built-in validation functions',
            is_correct: false
          },
          {
            label: 'Using inline JavaScript functions',
            is_correct: true
          }
        ]
      },
      {
        title: 'Explain the purpose of the "v-form" directive in Vue.js.',
        name: 'q4',
        points: 3,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you bind a select input to a data property in Vue.js?',
        name: 'q5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Using the "v-bind" directive',
            is_correct: false
          },
          {
            label: 'Using the "v-model" directive',
            is_correct: true
          },
          {
            label: 'Using the "v-data" directive',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "v-validate" directive in Vue.js forms?',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How do you handle form submissions in Vue.js?',
        name: 'q7',
        points: 3,
        order: 6,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'Using the "v-submit" directive',
            is_correct: false
          },
          {
            label: 'Using the "v-on:submit" directive',
            is_correct: true
          },
          {
            label: 'Using JavaScript event listeners',
            is_correct: true
          }
        ]
      },
      {
        title: 'What is the difference between "v-model" and "v-bind" in Vue.js forms?',
        name: 'q8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How do you implement form validation messages in Vue.js?',
        name: 'q9',
        points: 3,
        order: 8,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'Using CSS classes',
            is_correct: true
          },
          {
            label: 'Using the "v-message" directive',
            is_correct: false
          },
          {
            label: 'Using the "v-show" directive',
            is_correct: true
          }
        ]
      },
      {
        title: 'What is the purpose of the "v-reset" directive in Vue.js forms?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To reset a form input field',
            is_correct: false
          },
          {
            label: 'To reset a form to its initial state',
            is_correct: true
          },
          {
            label: 'To validate a form',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
