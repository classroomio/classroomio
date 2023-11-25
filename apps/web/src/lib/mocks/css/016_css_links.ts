import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'CSS Link Quiz',
  description: 'Test your knowledge of CSS link styling',
  questionnaire: {
    questions: [
      {
        title: 'Which CSS property is used to style the color of visited links?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'visited-link-color', is_correct: false },
          { label: 'link-color', is_correct: false },
          { label: 'active-link-color', is_correct: false },
          { label: 'color', is_correct: true }
        ]
      },
      {
        title: 'How can you style the text decoration of a link to remove underlines?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'text-underline: none;', is_correct: false },
          { label: 'text-decoration: none;', is_correct: true },
          { label: 'link-decoration: none;', is_correct: false },
          { label: 'underline: none;', is_correct: false }
        ]
      },
      {
        title: 'What CSS property is commonly used to change the link color when hovering over it?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'hover-color', is_correct: false },
          { label: 'link-color', is_correct: false },
          { label: 'active-color', is_correct: false },
          { label: 'hover', is_correct: true }
        ]
      },
      {
        title: 'How can you style the color of an active link?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'active-link-color', is_correct: true },
          { label: 'link-active-color', is_correct: false },
          { label: 'color-active-link', is_correct: false },
          { label: 'color-link-active', is_correct: false }
        ]
      },
      {
        title: 'What CSS pseudo-class is used to select links that the user has not visited yet?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: ':visited', is_correct: false },
          { label: ':unvisited', is_correct: false },
          { label: ':not-visited', is_correct: false },
          { label: ':link', is_correct: true }
        ]
      },
      {
        title: 'Explain the purpose of the "text-decoration" property in CSS link styling.',
        name: 'q6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you set a specific style for a link when it is being clicked?',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: ':hover', is_correct: false },
          { label: ':active', is_correct: true },
          { label: ':click', is_correct: false },
          { label: ':link', is_correct: false }
        ]
      },
      {
        title: 'What is the default color for unvisited links in most web browsers?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Red', is_correct: false },
          { label: 'Blue', is_correct: true },
          { label: 'Green', is_correct: false },
          { label: 'Purple', is_correct: false }
        ]
      },
      {
        title: 'How can you style links in a navigation bar to change color when hovered over?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Use JavaScript', is_correct: false },
          { label: 'Apply the "hover" pseudo-class', is_correct: true },
          { label: 'Use inline CSS', is_correct: false },
          { label: 'Change the HTML tag', is_correct: false }
        ]
      },
      {
        title: 'What CSS property is used to remove the underline from a link?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'text-decoration', is_correct: true },
          { label: 'remove-underline', is_correct: false },
          { label: 'link-decoration', is_correct: false },
          { label: 'underline: none;', is_correct: false }
        ]
      }
    ]
  }
};

export default template;
