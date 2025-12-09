import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'React ES6 Classes Quiz',
  description: 'Test your knowledge of React ES6 classes.',
  questionnaire: {
    questions: [
      {
        title: 'What is a class in ES6?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A function', is_correct: false },
          { label: 'A constructor method', is_correct: false },
          { label: 'A blueprint for creating objects', is_correct: true }
        ]
      },
      {
        title: 'What keyword is used to create a class in ES6?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'function', is_correct: false },
          { label: 'prototype', is_correct: false },
          { label: 'class', is_correct: true }
        ]
      },
      {
        title: 'Which method is automatically called when an object is created from a class?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'constructor', is_correct: true },
          { label: 'initialize', is_correct: false },
          { label: 'create', is_correct: false }
        ]
      },
      {
        title: 'What is the purpose of the "render" method in a React component?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To update state', is_correct: false },
          { label: 'To render HTML elements', is_correct: true },
          { label: 'To define props', is_correct: false }
        ]
      },
      {
        title: 'Which React lifecycle method is used for cleanup activities?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'componentDidMount', is_correct: false },
          { label: 'componentDidUpdate', is_correct: false },
          { label: 'componentWillUnmount', is_correct: true }
        ]
      },
      {
        title: 'Select all valid ways to define props in React.',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'Using the render method', is_correct: false },
          { label: 'Using the constructor', is_correct: false },
          { label: 'Using defaultProps', is_correct: true },
          { label: 'Using propTypes', is_correct: true }
        ]
      },
      {
        title: 'Write a JSX element representing a React component named "MyComponent".',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Explain the purpose of "setState" in React.',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the purpose of "super()" in a React class constructor?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'List some advantages of using ES6 classes in React development.',
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
