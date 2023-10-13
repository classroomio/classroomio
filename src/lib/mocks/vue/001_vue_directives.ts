import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Vue.js Directives Quiz',
  description: 'Test your knowledge of Vue.js directives with practical questions.',
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
        title: 'Which directive is used to loop through an array of items in Vue.js?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'v-model',
            is_correct: false,
          },
          {
            label: 'v-for',
            is_correct: true,
          },
          {
            label: 'v-show',
            is_correct: false,
          },
        ],
      },
      {
        title: 'Explain the usage of the "v-if" and "v-else" directives in Vue.js.',
        name: 'q3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'What is the purpose of the "v-on" directive in Vue.js?',
        name: 'q4',
        points: 3,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'Which directive is used to two-way bind data in an input element in Vue.js?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'v-bind',
            is_correct: false,
          },
          {
            label: 'v-model',
            is_correct: true,
          },
          {
            label: 'v-on',
            is_correct: false,
          },
        ],
      },
      {
        title: 'How do you conditionally apply a class to an element using "v-bind"?',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By using a computed property',
            is_correct: false,
          },
          {
            label: 'By binding the class name to a variable',
            is_correct: true,
          },
          {
            label: 'By using a filter',
            is_correct: false,
          },
        ],
      },
      {
        title: 'Explain the usage of the "v-show" and "v-if" directives in Vue.js.',
        name: 'q7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'How do you bind a method to a button click event in Vue.js using "v-on"?',
        name: 'q8',
        points: 3,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'What is the purpose of the "v-pre" directive in Vue.js?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To print text directly without any processing',
            is_correct: false,
          },
          {
            label: 'To skip compilation for this element and all its children',
            is_correct: true,
          },
          {
            label: 'To prevent a component from rendering',
            is_correct: false,
          },
        ],
      },
      {
        title: 'How can you conditionally render content using the "v-if" directive?',
        name: 'q10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By using "v-if" and "v-else" together',
            is_correct: true,
          },
          {
            label: 'By using "v-for" with a condition',
            is_correct: false,
          },
          {
            label: 'It is not possible to conditionally render content in Vue.js',
            is_correct: false,
          },
        ],
      },
    ],
  },
};

export default template;
