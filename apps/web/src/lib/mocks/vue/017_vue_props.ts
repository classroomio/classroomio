import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Vue.js Props Quiz',
  description: 'Test your knowledge of Vue.js props with practical questions.',
  questionnaire: {
    questions: [
      {
        title: 'What is the primary purpose of using props in Vue.js components?',
        name: 'q1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To pass data from a parent component to a child component',
            is_correct: true,
          },
          {
            label: 'To create a new data property in a child component',
            is_correct: false,
          },
          {
            label: 'To define a computed property in a child component',
            is_correct: false,
          },
        ],
      },
      {
        title: 'How do you define a prop in a child component in Vue.js?',
        name: 'q2',
        points: 3,
        order: 1,
        question_type: QuestionTypes[3], // TEXTAREA
        options: [],
      },
      {
        title: 'In a Vue.js parent component, how do you pass a prop to a child component?',
        name: 'q3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By using the v-bind directive on the child component tag',
            is_correct: true,
          },
          {
            label: 'By using the v-model directive on the child component tag',
            is_correct: false,
          },
          {
            label: 'By using double curly braces ({{ }}) around the prop value',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What happens if a parent component updates the value of a prop?',
        name: 'q4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'The change is not reflected in the child component',
            is_correct: false,
          },
          {
            label: 'The child component receives the updated value automatically',
            is_correct: true,
          },
          {
            label: 'An error occurs',
            is_correct: false,
          },
        ],
      },
      {
        title: 'In Vue.js, how do you specify the type of a prop?',
        name: 'q5',
        points: 3,
        order: 4,
        question_type: QuestionTypes[3], // TEXTAREA
        options: [],
      },
      {
        title: 'What is the purpose of the "required" prop option in Vue.js?',
        name: 'q6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'It specifies that the prop must be passed from the parent',
            is_correct: true,
          },
          {
            label: 'It indicates that the prop is optional',
            is_correct: false,
          },
          {
            label: 'It defines the type of the prop',
            is_correct: false,
          },
        ],
      },
      {
        title: 'How do you provide a default value for a prop in Vue.js?',
        name: 'q7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By adding a default property to the prop definition',
            is_correct: true,
          },
          {
            label: 'By using the v-bind directive in the parent component',
            is_correct: false,
          },
          {
            label: 'By using the v-model directive in the child component',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is a prop validation function used for in Vue.js?',
        name: 'q8',
        points: 3,
        order: 7,
        question_type: QuestionTypes[3], // TEXTAREA
        options: [],
      },
      {
        title: 'How do you pass multiple props to a child component in Vue.js?',
        name: 'q9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By including multiple v-bind directives on the child component tag',
            is_correct: true,
          },
          {
            label: 'By using the v-model directive with an array of prop names',
            is_correct: false,
          },
          {
            label: 'By wrapping the child component in a div element',
            is_correct: false,
          },
        ],
      },
      {
        title: 'How do you receive and access props in a child component in Vue.js?',
        name: 'q10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'By declaring a props option in the child component',
            is_correct: true,
          },
          {
            label: 'By using the "this" keyword in the child component',
            is_correct: false,
          },
          {
            label: 'By defining a new data property for each prop',
            is_correct: false,
          },
        ],
      },
    ],
  },
};

export default template;
