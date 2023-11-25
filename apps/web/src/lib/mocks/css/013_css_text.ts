import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'CSS Text Properties Quiz',
  description: 'Test your knowledge of CSS text properties',
  questionnaire: {
    questions: [
      {
        title: 'Which CSS property is used to set the font family of an element?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'font-family', is_correct: true },
          { label: 'font-style', is_correct: false },
          { label: 'text-align', is_correct: false },
          { label: 'line-height', is_correct: false }
        ]
      },
      {
        title: 'What is the default value of the CSS "text-decoration" property?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Underline', is_correct: false },
          { label: 'None', is_correct: true },
          { label: 'Overline', is_correct: false },
          { label: 'Line-through', is_correct: false }
        ]
      },
      {
        title: 'Which CSS property is used to control the spacing between letters in text?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'letter-spacing', is_correct: true },
          { label: 'word-spacing', is_correct: false },
          { label: 'line-height', is_correct: false },
          { label: 'text-transform', is_correct: false }
        ]
      },
      {
        title: 'How do you make text bold in CSS?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'font-weight: bold;', is_correct: true },
          { label: 'text-decoration: bold;', is_correct: false },
          { label: 'text-weight: bold;', is_correct: false },
          { label: 'font-style: bold;', is_correct: false }
        ]
      },
      {
        title: 'What does the CSS property "text-transform: uppercase;" do?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Converts text to uppercase', is_correct: true },
          { label: 'Converts text to lowercase', is_correct: false },
          { label: 'Underlines the text', is_correct: false },
          { label: 'Strikes through the text', is_correct: false }
        ]
      },
      {
        title: 'Explain the usage of the CSS "text-align" property.',
        name: 'q6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the purpose of the "text-shadow" property in CSS?',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Adds a shadow to text', is_correct: true },
          { label: 'Changes the font size', is_correct: false },
          { label: 'Underlines the text', is_correct: false },
          { label: 'Converts text to uppercase', is_correct: false }
        ]
      },
      {
        title: 'In CSS, can you use "font-style: italic;" to make text italic?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Yes', is_correct: true },
          { label: 'No', is_correct: false }
        ]
      },
      {
        title: 'Which CSS property is used to set the color of the text?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'color', is_correct: true },
          { label: 'background-color', is_correct: false },
          { label: 'text-color', is_correct: false },
          { label: 'font-color', is_correct: false }
        ]
      },
      {
        title: 'What is the default value of the CSS "line-height" property?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '1', is_correct: false },
          { label: 'normal', is_correct: true },
          { label: '100%', is_correct: false },
          { label: '0', is_correct: false }
        ]
      }
    ]
  }
};

export default template;
