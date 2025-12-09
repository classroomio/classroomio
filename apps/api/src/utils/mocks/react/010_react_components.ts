import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'React Components Quiz',
  description: 'Test your knowledge of React components.',
  questionnaire: {
    questions: [
      {
        title: 'What is a React component?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A JavaScript library for building user interfaces', is_correct: false },
          { label: 'A reusable and self-contained piece of UI', is_correct: true },
          { label: 'A CSS framework for styling React applications', is_correct: false }
        ]
      },
      {
        title: 'What are the two main types of React components?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Functional components and class components', is_correct: true },
          { label: 'Stateful components and stateless components', is_correct: false },
          { label: 'React components and React elements', is_correct: false }
        ]
      },
      {
        title: 'How do you define a functional component in React?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Using the `class` keyword', is_correct: false },
          { label: 'Using a JavaScript function', is_correct: true },
          { label: 'Using the `extends` keyword', is_correct: false }
        ]
      },
      {
        title: 'What is the purpose of the `render` method in a class component?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: "To define the component's state", is_correct: false },
          { label: "To return the JSX that represents the component's UI", is_correct: true },
          { label: "To define the component's lifecycle methods", is_correct: false }
        ]
      },
      {
        title: 'Select all valid ways to pass data from a parent component to a child component in React.',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'Using props', is_correct: true },
          { label: 'Using state', is_correct: false },
          { label: 'Using context', is_correct: true },
          { label: 'Using refs', is_correct: false }
        ]
      },
      {
        title: 'Write an example of defining a functional component in React.',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Explain the concept of "props" in React and how they are used in components.',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the significance of the "key" prop in React when rendering lists of elements?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'List some advantages of using functional components in React over class components.',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you conditionally render content in a React component?',
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
