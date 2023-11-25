import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Vue.js Templates Quiz',
  description: 'Test your knowledge of Vue.js templates with practical questions.',
  questionnaire: {
    questions: [
      {
        title: 'What is a Vue.js template used for?',
        name: 'q1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: "To define the structure of a Vue component's HTML",
            is_correct: true
          },
          {
            label: 'To create computed properties',
            is_correct: false
          },
          {
            label: 'To write JavaScript code',
            is_correct: false
          }
        ]
      },
      {
        title: "How do you bind an element's text content to a Vue.js component's data property?",
        name: 'q2',
        points: 3,
        order: 1,
        question_type: QuestionTypes[3], // TEXTAREA
        options: []
      },
      {
        title: 'In Vue.js templates, what does double curly braces ({{ }}) represent?',
        name: 'q3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'A variable placeholder to display data',
            is_correct: true
          },
          {
            label: 'A JavaScript comment',
            is_correct: false
          },
          {
            label: 'An HTML tag',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the "v-bind" directive used for in Vue.js templates?',
        name: 'q4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To bind an attribute to an expression',
            is_correct: true
          },
          {
            label: 'To define a new data property',
            is_correct: false
          },
          {
            label: 'To create a computed property',
            is_correct: false
          }
        ]
      },
      {
        title:
          'In Vue.js templates, how do you conditionally render an element based on a data property?',
        name: 'q5',
        points: 3,
        order: 4,
        question_type: QuestionTypes[3], // TEXTAREA
        options: []
      },
      {
        title: 'What is the "v-for" directive used for in Vue.js templates?',
        name: 'q6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To render a list of items based on an array',
            is_correct: true
          },
          {
            label: 'To define a computed property',
            is_correct: false
          },
          {
            label: 'To create a data property',
            is_correct: false
          }
        ]
      },
      {
        title: 'In Vue.js templates, what does the "@" symbol represent?',
        name: 'q7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'A shorthand for the "v-on" directive',
            is_correct: true
          },
          {
            label: 'A JavaScript comment',
            is_correct: false
          },
          {
            label: 'A data property',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you conditionally apply a CSS class to an element in a Vue.js template?',
        name: 'q8',
        points: 3,
        order: 7,
        question_type: QuestionTypes[3], // TEXTAREA
        options: []
      },
      {
        title: 'What is the purpose of the "v-html" directive in Vue.js templates?',
        name: 'q9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To render raw HTML content from a data property',
            is_correct: true
          },
          {
            label: 'To create a computed property',
            is_correct: false
          },
          {
            label: 'To insert a JavaScript script into the template',
            is_correct: false
          }
        ]
      },
      {
        title: "In Vue.js templates, how do you bind an element's attribute?",
        name: 'q10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'By using the "v-bind" directive',
            is_correct: true
          },
          {
            label: 'By enclosing the attribute value in double curly braces ({{ }})',
            is_correct: false
          },
          {
            label: 'By defining a new data property for each attribute',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
