import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'CSS Icons Quiz',
  description: 'Test your knowledge of CSS icons',
  questionnaire: {
    questions: [
      {
        title: 'Which CSS property is commonly used to display icons in web development?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'icon-style', is_correct: false },
          { label: 'image-display', is_correct: false },
          { label: 'icon-display', is_correct: false },
          { label: 'content', is_correct: true },
        ],
      },
      {
        title: 'How can you change the color of an icon in CSS?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'color', is_correct: true },
          { label: 'icon-color', is_correct: false },
          { label: 'image-color', is_correct: false },
          { label: 'display-color', is_correct: false },
        ],
      },
      {
        title: 'What CSS property allows you to add custom icons to elements?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'content', is_correct: false },
          { label: 'icon-image', is_correct: false },
          { label: 'custom-icon', is_correct: false },
          { label: 'background-image', is_correct: true },
        ],
      },
      {
        title: 'Which value of the CSS "content" property is commonly used for adding icons?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'text', is_correct: false },
          { label: 'icon', is_correct: false },
          { label: 'url()', is_correct: false },
          { label: 'none', is_correct: true },
        ],
      },
      {
        title: 'What does the CSS "font-size" property control when dealing with icons?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Icon width', is_correct: true },
          { label: 'Icon color', is_correct: false },
          { label: 'Icon style', is_correct: false },
          { label: 'Icon placement', is_correct: false },
        ],
      },
      {
        title: 'Explain how to use the "before" pseudo-element to add an icon before a text element.',
        name: 'q6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'What is the purpose of the CSS property "content" when working with icons?',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Defines icon size', is_correct: false },
          { label: 'Defines icon color', is_correct: false },
          { label: 'Defines icon content', is_correct: true },
          { label: 'Defines icon placement', is_correct: false },
        ],
      },
      {
        title: 'How can you align an icon vertically within a container?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'align-vertical', is_correct: false },
          { label: 'vertical-align', is_correct: true },
          { label: 'icon-align', is_correct: false },
          { label: 'content-align', is_correct: false },
        ],
      },
      {
        title: 'In CSS, what is the common way to center-align an icon horizontally?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'text-align', is_correct: false },
          { label: 'horizontal-align', is_correct: false },
          { label: 'icon-align', is_correct: false },
          { label: 'margin: 0 auto;', is_correct: true },
        ],
      },
      {
        title: 'How can you add an external icon library to your web project?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Use the "icon-library" property', is_correct: false },
          { label: 'Include a stylesheet link to the library', is_correct: true },
          { label: 'Import it in JavaScript', is_correct: false },
          { label: 'Download the icons as image files', is_correct: false },
        ],
      },
    ],
  },
};

export default template;
