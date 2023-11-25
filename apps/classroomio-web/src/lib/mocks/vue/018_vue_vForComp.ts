import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Practical Vue.js v-for Quiz',
  description: 'Test your knowledge of Vue.js v-for directive and component iteration.',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of the Vue.js v-for directive?',
        name: 'q1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To render a list of items based on an array or object',
            is_correct: true
          },
          {
            label: 'To create a Vue component',
            is_correct: false
          },
          {
            label: 'To define CSS styles',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you iterate over an array using v-for?',
        name: 'q2',
        points: 3,
        order: 1,
        question_type: QuestionTypes[3], // TEXTAREA
        options: []
      },
      {
        title: 'What is the index in a v-for loop?',
        name: 'q3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'The current item in the loop',
            is_correct: false
          },
          {
            label: 'The position of the current item in the array',
            is_correct: true
          },
          {
            label: 'A reserved keyword in Vue.js',
            is_correct: false
          }
        ]
      },
      {
        title: 'How can you filter items in a v-for loop?',
        name: 'q4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By using the v-if directive',
            is_correct: true
          },
          {
            label: 'By using the v-else directive',
            is_correct: false
          },
          {
            label: 'By using the v-while directive',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the key attribute used for in v-for?',
        name: 'q5',
        points: 3,
        order: 4,
        question_type: QuestionTypes[3], // TEXTAREA
        options: []
      },
      {
        title: 'How can you iterate over the properties of an object using v-for?',
        name: 'q6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By specifying the "in" keyword in v-for',
            is_correct: false
          },
          {
            label: 'By using "v-for" on the object directly',
            is_correct: false
          },
          {
            label: 'By using "(value, key) in object" syntax',
            is_correct: true
          }
        ]
      },
      {
        title: 'What is the shorthand syntax for v-for with an array?',
        name: 'q7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: '*item in items',
            is_correct: false
          },
          {
            label: '*(item, index) in items',
            is_correct: false
          },
          {
            label: '*item of items',
            is_correct: true
          }
        ]
      },
      {
        title: 'What is the default iteration order when using v-for on an object?',
        name: 'q8',
        points: 3,
        order: 7,
        question_type: QuestionTypes[3], // TEXTAREA
        options: []
      },
      {
        title: 'How can you loop through a range of numbers using v-for?',
        name: 'q9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By using an array containing the numbers',
            is_correct: true
          },
          {
            label: 'By specifying a start and end value in v-for',
            is_correct: false
          },
          {
            label: 'By using a dedicated v-range directive',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is a key conflict in v-for, and how can it be resolved?',
        name: 'q10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'A situation where two v-for loops use the same variable name',
            is_correct: false
          },
          {
            label: 'A situation where v-for and v-if are used together',
            is_correct: true
          },
          {
            label: 'A situation where two items in a list have the same key',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
