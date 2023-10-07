import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'CSS List Quiz',
  description: 'Test your knowledge of CSS list styling',
  questionnaire: {
    questions: [
      {
        title: 'Which CSS property is used to change the bullet style of a list item?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'list-bullet-style', is_correct: false },
          { label: 'bullet-style', is_correct: false },
          { label: 'list-style-type', is_correct: true },
          { label: 'style-type', is_correct: false },
        ],
      },
      {
        title: 'How can you remove the default list-style (bullets) from an unordered list?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'list-decoration: none;', is_correct: false },
          { label: 'list-style: none;', is_correct: true },
          { label: 'list-remove: bullets;', is_correct: false },
          { label: 'remove-list-style: bullets;', is_correct: false },
        ],
      },
      {
        title: 'Which CSS property is used to set the marker (list-item bullet) to an image?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'marker-image', is_correct: false },
          { label: 'list-image', is_correct: false },
          { label: 'list-marker-image', is_correct: false },
          { label: 'list-style-image', is_correct: true },
        ],
      },
      {
        title: 'What is the default value of the "list-style-type" property for an unordered list?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'circle', is_correct: false },
          { label: 'disc', is_correct: true },
          { label: 'square', is_correct: false },
          { label: 'none', is_correct: false },
        ],
      },
      {
        title: 'Explain the purpose of the "list-style" property in CSS list styling.',
        name: 'q5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'How can you change the marker (bullet) color of a list item?',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'marker-color', is_correct: false },
          { label: 'bullet-color', is_correct: false },
          { label: 'list-item-color', is_correct: false },
          { label: 'color', is_correct: true },
        ],
      },
      {
        title: 'What CSS property is used to change the marker (bullet) position in a list item?',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'list-marker-position', is_correct: false },
          { label: 'marker-position', is_correct: false },
          { label: 'list-item-marker', is_correct: false },
          { label: 'list-style-position', is_correct: true },
        ],
      },
      {
        title: 'How can you add an image as a custom marker for a list item?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Use JavaScript', is_correct: false },
          { label: 'Apply the "list-image" property', is_correct: false },
          { label: 'Apply the "list-style-image" property', is_correct: true },
          { label: 'Change the HTML tag', is_correct: false },
        ],
      },
      {
        title: 'What CSS property is used to control the space between the marker and the content of a list item?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'marker-spacing', is_correct: false },
          { label: 'list-marker-space', is_correct: false },
          { label: 'list-item-spacing', is_correct: false },
          { label: 'list-style-position', is_correct: true },
        ],
      },
      {
        title: 'How can you change the style of list items on hover?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Use JavaScript', is_correct: false },
          { label: 'Apply the "hover" pseudo-class', is_correct: true },
          { label: 'Use inline CSS', is_correct: false },
          { label: 'Apply the "active" pseudo-class', is_correct: false },
        ],
      },
    ],
  },
};


export default template;
