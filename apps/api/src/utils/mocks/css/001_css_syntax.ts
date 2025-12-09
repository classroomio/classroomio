import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'CSS Syntax Quiz',
  description: 'Test your knowledge of CSS syntax',
  questionnaire: {
    questions: [
      {
        title: 'What does CSS stand for?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Cascading Style Sheets', is_correct: true },
          { label: 'Computer Style Sheets', is_correct: false },
          { label: 'Creative Style Sheets', is_correct: false }
        ]
      },
      {
        title: 'How do you select an HTML element with id="demo" in CSS?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '#demo', is_correct: true },
          { label: '.demo', is_correct: false },
          { label: 'element="demo"', is_correct: false }
        ]
      },
      {
        title: 'How do you select HTML elements with class="example" in CSS?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '.example', is_correct: true },
          { label: '#example', is_correct: false },
          { label: 'element="example"', is_correct: false }
        ]
      },
      {
        title: 'Which CSS property is used to change the text color of an element?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'text-color', is_correct: false },
          { label: 'color', is_correct: true },
          { label: 'font-color', is_correct: false }
        ]
      },
      {
        title: 'How do you add a background color for all <h1> elements?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'h1 {background-color: yellow;}', is_correct: true },
          { label: 'h1.background-color: yellow;', is_correct: false },
          { label: 'all.h1 {bg-color: yellow;}', is_correct: false }
        ]
      },
      {
        title: 'What is the correct CSS syntax for making all the <p> elements bold?',
        name: 'q6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'p {text-style: bold;}', is_correct: false },
          { label: 'p {font-weight: bold;}', is_correct: true },
          { label: 'p.bold {text-weight: bold;}', is_correct: false }
        ]
      },
      {
        title: 'How do you add a comment in CSS?',
        name: 'q7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the purpose of the "float" property in CSS?',
        name: 'q8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Explain the box model in CSS.',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What does CSS specificity refer to?',
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
