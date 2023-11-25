import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'CSS Margin Quiz',
  description: 'Test your knowledge of CSS margin properties',
  questionnaire: {
    questions: [
      {
        title: 'Which CSS property is used to set the margin on all four sides of an element?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'margin', is_correct: true },
          { label: 'margin-all', is_correct: false },
          { label: 'margin-sides', is_correct: false }
        ]
      },
      {
        title: 'How do you set the top margin of an element to 20px in CSS?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'margin-top: 20px;', is_correct: true },
          { label: 'margin: 20px top;', is_correct: false },
          { label: 'margin: top 20px;', is_correct: false }
        ]
      },
      {
        title: 'What is the default value of the "margin" property in CSS?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '0', is_correct: true },
          { label: 'auto', is_correct: false },
          { label: '10px', is_correct: false }
        ]
      },
      {
        title: 'How can you center an element horizontally in CSS using margin?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'margin-left: auto; margin-right: auto;', is_correct: true },
          { label: 'margin-center: auto;', is_correct: false },
          { label: 'margin-horizontal: center;', is_correct: false }
        ]
      },
      {
        title: 'Explain the difference between "margin" and "padding" in CSS.',
        name: 'q5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you remove the margin from all sides of an element in CSS?',
        name: 'q6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the CSS property used to set the margin between adjacent table cells?',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'cell-spacing', is_correct: false },
          { label: 'table-spacing', is_correct: false },
          { label: 'border-spacing', is_correct: true }
        ]
      },
      {
        title: 'How do you set different margins for each side of an element in CSS?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'margin-top, margin-right, margin-bottom, margin-left', is_correct: true },
          { label: 'margin-all', is_correct: false },
          { label: 'margin-sides', is_correct: false }
        ]
      },
      {
        title: 'What is the purpose of the "margin-collapse" property in CSS?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To collapse the margin of adjacent elements', is_correct: true },
          { label: 'To increase the margin size', is_correct: false },
          { label: 'To hide the margin', is_correct: false }
        ]
      },
      {
        title: 'How do you create a space between two block-level elements in CSS?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Using margin', is_correct: true },
          { label: 'Using padding', is_correct: false },
          { label: 'Using border', is_correct: false }
        ]
      }
    ]
  }
};

export default template;
