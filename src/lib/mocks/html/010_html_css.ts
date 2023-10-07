import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'HTML CSS Quiz',
  description: 'Test your knowledge of HTML and CSS',
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
        title: 'Which HTML tag is used to include an external CSS file?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '<link>', is_correct: true },
          { label: '<style>', is_correct: false },
          { label: '<css>', is_correct: false }
        ]
      },
      {
        title: "What is the default value of the 'display' property in CSS for most elements?",
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'block', is_correct: false },
          { label: 'inline', is_correct: false },
          { label: 'inline-block', is_correct: false },
          { label: 'block or inline depending on the element', is_correct: true }
        ]
      },
      {
        title: "How do you select all elements with the class name 'example' in CSS?",
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '.example', is_correct: true },
          { label: '#example', is_correct: false },
          { label: 'element.example', is_correct: false },
          { label: 'example', is_correct: false }
        ]
      },
      {
        title: "What is the purpose of the 'box-sizing' property in CSS?",
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Control the background box', is_correct: false },
          { label: 'Adjust the size of the box', is_correct: false },
          { label: 'Define the display type', is_correct: false },
          { label: 'Specify how the total width and height are calculated', is_correct: true }
        ]
      },
      {
        title: 'Which CSS property is used to control the text color of an element?',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'text-color', is_correct: false },
          { label: 'color', is_correct: true },
          { label: 'font-color', is_correct: false }
        ]
      },
      {
        title: "What is the purpose of the 'margin' property in CSS?",
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'Set the width of an element', is_correct: false },
          { label: 'Define the spacing outside the element', is_correct: true },
          { label: 'Change the background color', is_correct: false }
        ]
      },
      {
        title: 'How do you comment out multiple lines of CSS code?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: '/* ... */', is_correct: true },
          { label: '// ...', is_correct: false },
          { label: '<!-- ... -->', is_correct: false }
        ]
      },
      {
        title: "What is the purpose of the 'position' property in CSS?",
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Explain the concept of CSS specificity.',
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
