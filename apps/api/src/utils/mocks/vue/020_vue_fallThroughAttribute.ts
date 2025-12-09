import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'Practical Vue.js Emitting Events Quiz',
  description: 'Test your knowledge of Vue.js event handling and emitting events.',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of emitting events in Vue.js?',
        name: 'q1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To pass data from child to parent components',
            is_correct: true
          },
          {
            label: 'To create Vue.js components',
            is_correct: false
          },
          {
            label: 'To style the user interface',
            is_correct: false
          }
        ]
      },
      {
        title: 'How is an event emitted from a child component?',
        name: 'q2',
        points: 3,
        order: 1,
        question_type: QuestionTypes[3], // TEXTAREA
        options: []
      },
      {
        title: 'What is the purpose of the $emit method in Vue.js?',
        name: 'q3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To emit an event from a parent component',
            is_correct: false
          },
          {
            label: 'To emit an event from a child component',
            is_correct: true
          },
          {
            label: 'To define CSS styles',
            is_correct: false
          }
        ]
      },
      {
        title: 'How can you pass data when emitting an event?',
        name: 'q4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By using the $on method',
            is_correct: false
          },
          {
            label: 'By including data as a parameter in $emit',
            is_correct: true
          },
          {
            label: 'By defining a new event handler',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the key modifier for emitting events with the Enter key?',
        name: 'q5',
        points: 3,
        order: 4,
        question_type: QuestionTypes[3], // TEXTAREA
        options: []
      },
      {
        title: 'What is the v-on directive used for in Vue.js?',
        name: 'q6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To define CSS styles',
            is_correct: false
          },
          {
            label: 'To handle DOM events and call methods',
            is_correct: true
          },
          {
            label: 'To create Vue.js components',
            is_correct: false
          }
        ]
      },
      {
        title: 'How can you stop an event from propagating to parent components?',
        name: 'q7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By using $emit with the .stop modifier',
            is_correct: false
          },
          {
            label: 'By using $emit with the .prevent modifier',
            is_correct: false
          },
          {
            label: 'By using $emit with the .stop modifier',
            is_correct: true
          }
        ]
      },
      {
        title: 'How can you capture a specific event emitted from a child component?',
        name: 'q8',
        points: 3,
        order: 7,
        question_type: QuestionTypes[3], // TEXTAREA
        options: []
      },
      {
        title: 'What is the v-bind directive used for in Vue.js?',
        name: 'q9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To emit custom events',
            is_correct: false
          },
          {
            label: 'To handle DOM events',
            is_correct: false
          },
          {
            label: 'To bind an element’s attribute to a Vue.js data value',
            is_correct: true
          }
        ]
      },
      {
        title: 'What is the argument of the v-on directive when listening to a custom event?',
        name: 'q10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'The event name',
            is_correct: true
          },
          {
            label: 'The method to call',
            is_correct: false
          },
          {
            label: 'The event data',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
