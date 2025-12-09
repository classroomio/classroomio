import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'React Class Components Quiz',
  description: 'Test your knowledge of React class components.',
  questionnaire: {
    questions: [
      {
        title: 'What is a class component in React?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A JavaScript class used to define a React element', is_correct: true },
          { label: 'A React component that uses only functional components', is_correct: false },
          { label: 'A class used to style React components', is_correct: false }
        ]
      },
      {
        title: 'What is the main difference between a functional component and a class component in React?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Functional components use the `render` method, while class components use functions',
            is_correct: false
          },
          {
            label: 'Functional components use functions, while class components use the `render` method',
            is_correct: true
          },
          {
            label: 'Functional components cannot have state, while class components can',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the constructor method in a React class component?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: "To initialize the component's state and bind event handlers",
            is_correct: true
          },
          { label: "To define the component's rendering logic", is_correct: false },
          { label: 'To declare props for the component', is_correct: false }
        ]
      },
      {
        title: 'How do you update the state of a class component in React?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'By directly modifying the `state` property', is_correct: false },
          { label: 'By calling the `setState` method', is_correct: true },
          { label: 'By assigning a new value to `this.state`', is_correct: false }
        ]
      },
      {
        title: 'Select all valid lifecycle methods in a React class component.',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'render', is_correct: true },
          { label: 'componentDidMount', is_correct: true },
          { label: 'componentWillUnmount', is_correct: true },
          { label: 'componentUpdate', is_correct: false }
        ]
      },
      {
        title: 'Write an example of defining a class component in React.',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Explain the concept of the component lifecycle in React class components.',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the significance of the `super()` method in a React class component constructor?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'List some advantages of using class components in React development.',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you handle events in a React class component?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      }
    ]
  }
};

export default template;
