import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'CSS Padding Quiz',
  description: 'Test your knowledge of CSS padding properties',
  questionnaire: {
    questions: [
      {
        title: 'Which CSS property is used to set the padding on all four sides of an element?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'padding', is_correct: true },
          { label: 'padding-all', is_correct: false },
          { label: 'padding-sides', is_correct: false }
        ]
      },
      {
        title: 'How do you set the left padding of an element to 30px in CSS?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'padding-left: 30px;', is_correct: true },
          { label: 'padding: 30px left;', is_correct: false },
          { label: 'padding: left 30px;', is_correct: false }
        ]
      },
      {
        title: 'What is the default value of the "padding" property in CSS?',
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
        title: 'How can you center an element horizontally in CSS using padding?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'padding-left: auto; padding-right: auto;', is_correct: true },
          { label: 'padding-center: auto;', is_correct: false },
          { label: 'padding-horizontal: center;', is_correct: false }
        ]
      },
      {
        title: 'Explain the difference between "padding" and "margin" in CSS.',
        name: 'q5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you remove the padding from all sides of an element in CSS?',
        name: 'q6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title:
          'What is the CSS property used to set the padding between the content and border of an element?',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'padding-distance', is_correct: false },
          { label: 'content-padding', is_correct: false },
          { label: 'padding-inline', is_correct: false },
          { label: 'padding-inline-start', is_correct: false },
          { label: 'padding-block', is_correct: false },
          { label: 'padding-block-start', is_correct: false },
          { label: 'padding-inline-end', is_correct: false },
          { label: 'padding-block-end', is_correct: false },
          { label: 'padding-inline-start', is_correct: true },
          { label: 'padding-inline-end', is_correct: true },
          { label: 'padding-block-start', is_correct: true },
          { label: 'padding-block-end', is_correct: true }
        ]
      },
      {
        title: 'How do you set different paddings for each side of an element in CSS?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'padding-top, padding-right, padding-bottom, padding-left', is_correct: true },
          { label: 'padding-all', is_correct: false },
          { label: 'padding-sides', is_correct: false }
        ]
      },
      {
        title: 'What is the purpose of the "box-sizing" property in CSS related to padding?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label:
              "To control how the padding is calculated in relation to the element's total width and height",
            is_correct: true
          },
          { label: 'To hide the padding', is_correct: false },
          { label: 'To change the color of the padding', is_correct: false }
        ]
      },
      {
        title: 'How do you create space around the content inside an element in CSS?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Using padding', is_correct: true },
          { label: 'Using margin', is_correct: false },
          { label: 'Using border', is_correct: false }
        ]
      }
    ]
  }
};

export default template;
