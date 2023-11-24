import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Vue.js Methods Quiz',
  description: 'Test your knowledge of Vue.js methods with practical questions.',
  questionnaire: {
    questions: [
      {
        title: 'What is the primary purpose of methods in Vue.js?',
        name: 'q1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To define computed properties',
            is_correct: false,
          },
          {
            label: 'To manage user interactions and create custom functions',
            is_correct: true,
          },
          {
            label: 'To style the components',
            is_correct: false,
          },
        ],
      },
      {
        title: 'How do you define a method in a Vue component?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'Explain the purpose of the "methods" property in a Vue component.',
        name: 'q3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'How can you call a method defined in a Vue component from the template?',
        name: 'q4',
        points: 3,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'What is the key difference between "computed properties" and "methods" in Vue.js?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'Explain the concept of "method binding" in Vue.js.',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'How can you pass arguments to a method when calling it from the template?',
        name: 'q7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'What is the purpose of the "this" keyword in Vue.js methods?',
        name: 'q8',
        points: 3,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'Explain the usage of the ".prevent" modifier in Vue.js event handling methods.',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To prevent event propagation',
            is_correct: false,
          },
          {
            label: 'To prevent the default behavior of an event',
            is_correct: true,
          },
          {
            label: 'To prevent the method execution',
            is_correct: false,
          },
        ],
      },
      {
        title: 'How can you reuse a method defined in a Vue component in another component?',
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
