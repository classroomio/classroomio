import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'HTML Page Title Quiz',
  description: 'Test your knowledge of HTML page titles',
  questionnaire: {
    questions: [
      {
        title: 'What HTML element is used to specify the title of a web page?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '<head>', is_correct: false },
          { label: '<title>', is_correct: true },
          { label: '<body>', is_correct: false }
        ]
      },
      {
        title: 'Where should you place the <title> element in an HTML document?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'In the <body> section', is_correct: false },
          { label: 'In the <footer> section', is_correct: false },
          { label: 'In the <head> section', is_correct: true }
        ]
      },
      {
        title: 'What is the purpose of the <title> element?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: "To specify the website's background color", is_correct: false },
          { label: "To set the website's font style", is_correct: false },
          { label: "To define the title displayed in the browser's title bar", is_correct: true }
        ]
      },
      {
        title: 'Can you have multiple <title> elements in a single HTML document?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Yes, but only one will be displayed', is_correct: false },
          { label: 'No, there can be only one <title> element', is_correct: true },
          { label: 'Yes, all of them will be displayed', is_correct: false }
        ]
      },
      {
        title: 'Which HTML attribute is used to provide alternative text for an <img> element?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'alt', is_correct: true },
          { label: 'title', is_correct: false },
          { label: 'src', is_correct: false }
        ]
      },
      {
        title: 'How should you format the text inside the <title> element?',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'In UPPERCASE letters', is_correct: false },
          { label: 'In Sentence case', is_correct: true },
          { label: 'In lowercase letters', is_correct: false }
        ]
      },
      {
        title: 'What is the maximum length of the text you can put inside a <title> element?',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '255 characters', is_correct: false },
          { label: '512 characters', is_correct: false },
          { label: 'Depends on the browser', is_correct: true }
        ]
      },
      {
        title: 'What is the purpose of setting a page title?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: "To specify the page's background color", is_correct: false },
          { label: "To define the page's layout", is_correct: false },
          { label: 'To provide a meaningful title for the web page', is_correct: true }
        ]
      },
      {
        title: "What is the HTML tag used to display the page title in the browser's title bar?",
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '<h1>', is_correct: false },
          { label: '<p>', is_correct: false },
          { label: '<title>', is_correct: false },
          { label: '<head>', is_correct: true }
        ]
      },
      {
        title: 'What is the recommended length for a page title?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '1-3 words', is_correct: false },
          { label: '3-5 words', is_correct: true },
          { label: 'Unlimited length', is_correct: false }
        ]
      }
    ]
  }
};

export default template;
