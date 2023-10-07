import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'CSS How-To Quiz',
  description: 'Test your knowledge of CSS with these how-to questions',
  questionnaire: {
    questions: [
      {
        title: 'How do you include an external CSS file in an HTML document?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '<link rel="stylesheet" type="text/css" href="styles.css">', is_correct: true },
          { label: '<style src="styles.css">', is_correct: false },
          { label: '<css src="styles.css">', is_correct: false },
        ],
      },
      {
        title: 'What does CSS stand for?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Cascading Style Sheets', is_correct: true },
          { label: 'Computer Style Sheets', is_correct: false },
          { label: 'Creative Style Sheets', is_correct: false },
        ],
      },
      {
        title: 'Which CSS property is used to change the text color of an element?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'color', is_correct: true },
          { label: 'text-color', is_correct: false },
          { label: 'font-color', is_correct: false },
        ],
      },
      {
        title: 'What is the correct way to comment out CSS code?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '/* This is a comment */', is_correct: true },
          { label: '<!-- This is a comment -->', is_correct: false },
          { label: '// This is a comment', is_correct: false },
        ],
      },
      {
        title: 'How do you apply an inline style to an HTML element?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '<div style="color: blue;">', is_correct: true },
          { label: '<div class="blue">', is_correct: false },
          { label: '<div id="blue">', is_correct: false },
        ],
      },
      {
        title: 'Which CSS selector selects all elements with the class "highlight"?',
        name: 'q6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: '.highlight', is_correct: true },
          { label: '#highlight', is_correct: false },
          { label: 'element="highlight"', is_correct: false },
        ],
      },
      {
        title: 'Explain the usage of the CSS "box-sizing" property.',
        name: 'q7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'How do you select all <p> elements that are inside a <div> element?',
        name: 'q8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'What is the purpose of CSS pseudo-classes?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'What is the difference between margin and padding in CSS?',
        name: 'q10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
    ],
  },
};

export default template;
