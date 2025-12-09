import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'Vue.js CSS Binding Quiz',
  description: 'Test your knowledge of Vue.js CSS binding with practical questions.',
  questionnaire: {
    questions: [
      {
        title: 'How can you bind CSS classes in Vue.js?',
        name: 'q1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By using the "v-css" directive',
            is_correct: false
          },
          {
            label: 'By using the "v-bind" directive with the "class" attribute',
            is_correct: true
          },
          {
            label: 'By defining a custom CSS binding method',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of binding CSS classes in Vue.js?',
        name: 'q2',
        points: 3,
        order: 1,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How do you conditionally apply CSS classes in Vue.js?',
        name: 'q3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By using the "v-style" directive',
            is_correct: false
          },
          {
            label: 'By using conditional expressions with the "v-bind" directive',
            is_correct: true
          },
          {
            label: 'By using inline styles',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which syntax should you use to bind a single CSS class conditionally in Vue.js?',
        name: 'q4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: ':class="{ active: isActive }"',
            is_correct: true
          },
          {
            label: 'class="active: isActive"',
            is_correct: false
          },
          {
            label: 'v-bind:class="active: isActive"',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the Vue.js directive for binding inline styles?',
        name: 'q5',
        points: 3,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'v-inline',
            is_correct: false
          },
          {
            label: 'v-style',
            is_correct: true
          },
          {
            label: 'v-css',
            is_correct: false
          }
        ]
      },
      {
        title: 'How can you bind multiple CSS classes in Vue.js?',
        name: 'q6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'By defining a custom CSS binding method',
            is_correct: false
          },
          {
            label: 'By using a computed property that returns an object',
            is_correct: true
          },
          {
            label: 'By using the "v-class" directive',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the benefit of using CSS binding in Vue.js?',
        name: 'q7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'It simplifies CSS usage in Vue components',
            is_correct: true
          },
          {
            label: 'It improves JavaScript performance',
            is_correct: false
          },
          {
            label: 'It is not recommended in Vue.js',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you bind CSS inline styles in Vue.js using "v-style"?',
        name: 'q8',
        points: 3,
        order: 7,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'By directly specifying a string of CSS properties',
            is_correct: true
          },
          {
            label: 'By using a computed property that returns an object of style properties',
            is_correct: true
          },
          {
            label: 'By applying a predefined CSS class',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of using conditional CSS classes in Vue.js?',
        name: 'q9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To apply styles dynamically based on data or user interaction',
            is_correct: true
          },
          {
            label: 'To override all other CSS styles',
            is_correct: false
          },
          {
            label: 'To define fixed styles for all components',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which Vue.js directive is used to bind HTML attributes?',
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
