import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'Vue.js Event Modifiers Quiz',
  description: 'Test your knowledge of Vue.js event modifiers with practical questions.',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of the ".stop" event modifier in Vue.js?',
        name: 'q1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To stop event propagation',
            is_correct: true
          },
          {
            label: 'To prevent the default behavior of an event',
            is_correct: false
          },
          {
            label: 'To stop the method execution',
            is_correct: false
          }
        ]
      },
      {
        title: 'How can you use the ".prevent" event modifier in Vue.js?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Explain the purpose of the ".capture" event modifier in Vue.js.',
        name: 'q3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What does the ".self" event modifier do in Vue.js?',
        name: 'q4',
        points: 3,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How do you use the ".once" event modifier in Vue.js?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Explain the ".passive" event modifier in Vue.js and its use cases.',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the purpose of the ".ctrl" event modifier in Vue.js?',
        name: 'q7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Explain how to use the ".exact" event modifier in Vue.js and its significance.',
        name: 'q8',
        points: 3,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the use of the ".middle" event modifier in Vue.js?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To handle middle mouse button clicks',
            is_correct: true
          },
          {
            label: 'To handle right mouse button clicks',
            is_correct: false
          },
          {
            label: 'To handle left mouse button clicks',
            is_correct: false
          }
        ]
      },
      {
        title: 'How can you combine multiple event modifiers in Vue.js?',
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
