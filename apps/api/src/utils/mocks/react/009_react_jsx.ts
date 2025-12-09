import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'React JSX Quiz',
  description: 'Test your knowledge of React JSX.',
  questionnaire: {
    questions: [
      {
        title: 'What is JSX in React?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A data type in React', is_correct: false },
          { label: 'A JavaScript extension for React', is_correct: true },
          { label: 'A React component', is_correct: false }
        ]
      },
      {
        title: 'What is the primary advantage of using JSX in React?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'It simplifies the syntax of JavaScript', is_correct: false },
          {
            label: 'It allows you to define component structure with a more declarative syntax',
            is_correct: true
          },
          { label: 'It improves performance in React applications', is_correct: false }
        ]
      },
      {
        title: 'Is JSX a requirement for building React applications?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Yes, JSX is mandatory in React', is_correct: false },
          { label: 'No, you can use plain JavaScript without JSX', is_correct: true },
          { label: 'JSX is only required for server-side rendering', is_correct: false }
        ]
      },
      {
        title: 'What is the role of Babel in JSX usage?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Babel transpiles JSX code to JavaScript code that browsers can understand',
            is_correct: true
          },
          { label: 'Babel optimizes React components', is_correct: false },
          { label: 'Babel is not related to JSX', is_correct: false }
        ]
      },
      {
        title: 'Select all valid JSX syntax rules in React.',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'JSX elements must always be closed', is_correct: false },
          { label: 'JSX attributes must be written in double quotes', is_correct: false },
          { label: 'JSX elements can be nested', is_correct: true },
          { label: 'JSX elements can be self-closing', is_correct: true }
        ]
      },
      {
        title: 'Write an example of a JSX element in React.',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Explain the concept of JSX transformations and how it relates to browser compatibility.',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the significance of the curly braces `{}` in JSX?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'List some benefits of using JSX in React development.',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Can you embed JavaScript expressions within JSX? If yes, provide an example.',
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
