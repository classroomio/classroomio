import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'HTML Favicon Quiz',
  description: 'Test your knowledge of HTML favicons',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of a favicon in an HTML document?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To set the background color of the web page', is_correct: false },
          { label: "To specify the website's title", is_correct: false },
          { label: 'To provide a small icon for the browser tab', is_correct: true }
        ]
      },
      {
        title: 'Which HTML element is used to define a favicon?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '<icon>', is_correct: false },
          { label: '<favicon>', is_correct: false },
          { label: '<link>', is_correct: true }
        ]
      },
      {
        title: 'What is the recommended size for a favicon image?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '16x16 pixels', is_correct: true },
          { label: '32x32 pixels', is_correct: false },
          { label: '64x64 pixels', is_correct: false }
        ]
      },
      {
        title: 'Where should you place the <link> element for the favicon in an HTML document?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'In the <body> section', is_correct: false },
          { label: 'In the <footer> section', is_correct: false },
          { label: 'In the <head> section', is_correct: true }
        ]
      },
      {
        title: 'Which file format is commonly used for favicons?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '.ico', is_correct: true },
          { label: '.jpg', is_correct: false },
          { label: '.png', is_correct: false }
        ]
      },
      {
        title: 'How can you specify a favicon for different devices with different sizes?',
        name: 'q6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'Use multiple <link> elements with different sizes', is_correct: true },
          { label: 'Specify the size in the <img> element', is_correct: false },
          { label: 'Use JavaScript to detect the device size', is_correct: false }
        ]
      },
      {
        title: "What is the purpose of the 'sizes' attribute in a favicon <link> element?",
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To set the background color of the favicon', is_correct: false },
          { label: 'To specify the dimensions of the favicon image', is_correct: true },
          { label: 'To define the shape of the favicon', is_correct: false }
        ]
      },
      {
        title: 'What should you do if a browser does not support favicons?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Use a larger image in the <body> section', is_correct: false },
          { label: 'Include a text-based alternative in the <head> section', is_correct: false },
          { label: 'Do nothing; modern browsers all support favicons', is_correct: true }
        ]
      },
      {
        title: 'What is the default name for a favicon file?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'favicon.ico', is_correct: true },
          { label: 'icon.png', is_correct: false },
          { label: 'favicon.png', is_correct: false }
        ]
      },
      {
        title: "What is the purpose of the 'rel' attribute in a favicon <link> element?",
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To specify the relationship between the favicon and the website',
            is_correct: true
          },
          { label: 'To set the background color of the favicon', is_correct: false },
          { label: 'To define the dimensions of the favicon image', is_correct: false }
        ]
      }
    ]
  }
};

export default template;
