import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Vue.js v-model Quiz',
  description: 'Test your knowledge of Vue.js v-model with practical questions.',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of "v-model" in Vue.js?',
        name: 'q1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How do you create two-way data binding in Vue.js using "v-model"?',
        name: 'q2',
        points: 3,
        order: 1,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'By binding a data property to an input element',
            is_correct: true
          },
          {
            label: 'By using the "v-bind" directive',
            is_correct: false
          },
          {
            label: 'By manually updating the DOM',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which HTML input elements can be used with "v-model" in Vue.js?',
        name: 'q3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: '<input type="text">',
            is_correct: true
          },
          {
            label: '<input type="checkbox">',
            is_correct: true
          },
          {
            label: '<select>',
            is_correct: false
          },
          {
            label: '<textarea>',
            is_correct: true
          }
        ]
      },
      {
        title: 'What is the shorthand for "v-bind" in Vue.js forms?',
        name: 'q4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: ':model',
            is_correct: false
          },
          {
            label: 'v-model',
            is_correct: true
          },
          {
            label: 'bind-model',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you implement form validation with "v-model" in Vue.js?',
        name: 'q5',
        points: 3,
        order: 4,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'By defining custom validation functions',
            is_correct: true
          },
          {
            label: 'By using built-in validation attributes',
            is_correct: true
          },
          {
            label: 'By manually handling input events',
            is_correct: false
          }
        ]
      },
      {
        title: 'What happens when you bind "v-model" to a data property in Vue.js?',
        name: 'q6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'The input element reflects the data property value',
            is_correct: true
          },
          {
            label: 'The data property is updated without affecting the input element',
            is_correct: false
          },
          {
            label: 'An error is thrown',
            is_correct: false
          }
        ]
      },
      {
        title: 'How can you use "v-model" with a select dropdown in Vue.js?',
        name: 'q7',
        points: 3,
        order: 6,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'By binding a data property to the "value" attribute',
            is_correct: true
          },
          {
            label: 'By using the "v-select" directive',
            is_correct: false
          },
          {
            label: 'By manually updating the selected value',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the main benefit of using "v-model" for form inputs in Vue.js?',
        name: 'q8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How do you handle user input events when using "v-model"?',
        name: 'q9',
        points: 3,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By using the "v-on" directive',
            is_correct: true
          },
          {
            label: 'By binding directly to input element events',
            is_correct: false
          },
          {
            label: 'By using the "v-input" directive',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the equivalent of "v-model" in React?',
        name: 'q10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'v-bind',
            is_correct: false
          },
          {
            label: 'setState',
            is_correct: true
          },
          {
            label: 'v-model',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
