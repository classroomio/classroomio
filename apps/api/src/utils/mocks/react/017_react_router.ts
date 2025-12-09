import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'React Router Quiz',
  description: 'Test your knowledge of React Router.',
  questionnaire: {
    questions: [
      {
        title: 'What is React Router used for?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To manage navigation and routing in React applications', is_correct: true },
          { label: 'To style React components', is_correct: false },
          { label: 'To create forms in React', is_correct: false }
        ]
      },
      {
        title: 'Which React Router component is used to define routes?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '<Route>', is_correct: true },
          { label: '<Link>', is_correct: false },
          { label: '<Router>', is_correct: false }
        ]
      },
      {
        title: 'What is the purpose of the `exact` prop in a React Router route definition?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To match the route exactly and not include sub-routes', is_correct: true },
          { label: 'To specify the HTTP request method for the route', is_correct: false },
          { label: 'To define the route as the default route', is_correct: false }
        ]
      },
      {
        title: 'Select all valid route parameters in React Router.',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: ':id', is_correct: true },
          { label: ':slug', is_correct: true },
          { label: ':category', is_correct: true },
          { label: ':page', is_correct: true }
        ]
      },
      {
        title: 'Write an example of using a route parameter in a React Router component.',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the purpose of the `withRouter` higher-order component in React Router?',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Explain the concept of nested routes in React Router.',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you programmatically navigate to a different route in React Router?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the purpose of the `Switch` component in React Router?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Can you have multiple `<Router>` components in a single React application?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Yes, as long as they have unique names', is_correct: false },
          {
            label: 'No, there should be only one `<Router>` component at the top level',
            is_correct: true
          },
          { label: "Yes, it doesn't matter", is_correct: false }
        ]
      }
    ]
  }
};

export default template;
