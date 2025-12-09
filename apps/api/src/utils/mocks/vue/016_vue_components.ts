import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'Vue.js Components Quiz',
  description: 'Test your knowledge of Vue.js components with practical questions.',
  questionnaire: {
    questions: [
      {
        title: 'What is a Vue.js component?',
        name: 'q1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'A reusable and self-contained Vue instance',
            is_correct: true
          },
          {
            label: 'A JavaScript function',
            is_correct: false
          },
          {
            label: 'A built-in HTML element',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you define a Vue.js component?',
        name: 'q2',
        points: 3,
        order: 1,
        question_type: QuestionTypes[3], // TEXTAREA
        options: []
      },
      {
        title: 'What is the primary advantage of using Vue components?',
        name: 'q3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Reusability and maintainability',
            is_correct: true
          },
          {
            label: 'Faster page load times',
            is_correct: false
          },
          {
            label: 'Improved SEO',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you pass data from a parent component to a child component?',
        name: 'q4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By using props',
            is_correct: true
          },
          {
            label: 'By defining a data property in the child component',
            is_correct: false
          },
          {
            label: 'By using v-model directive',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is a Vue.js component lifecycle hook?',
        name: 'q5',
        points: 3,
        order: 4,
        question_type: QuestionTypes[3], // TEXTAREA
        options: []
      },
      {
        title: 'How can you create a global Vue component?',
        name: 'q6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By using Vue.component method',
            is_correct: true
          },
          {
            label: 'By including a component in a parent component template',
            is_correct: false
          },
          {
            label: 'By defining a new Vue instance',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the Vue component template?',
        name: 'q7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To define the structure and layout of the component',
            is_correct: true
          },
          {
            label: 'To store data and business logic',
            is_correct: false
          },
          {
            label: 'To define component props',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you define component props?',
        name: 'q8',
        points: 3,
        order: 7,
        question_type: QuestionTypes[3], // TEXTAREA
        options: []
      },
      {
        title: 'What is the purpose of the Vue component root element?',
        name: 'q9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'It encapsulates the component template',
            is_correct: true
          },
          {
            label: 'It defines component data properties',
            is_correct: false
          },
          {
            label: 'It represents the component props',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you create a named slot in a Vue component?',
        name: 'q10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'By using the "slot" attribute in the component template',
            is_correct: true
          },
          {
            label: 'By defining a prop with the name of the slot',
            is_correct: false
          },
          {
            label: 'By declaring a new Vue instance',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
