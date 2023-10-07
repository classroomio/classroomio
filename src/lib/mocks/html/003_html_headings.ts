import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'HTML Headings Quiz',
  description: 'Test your knowledge of HTML headings',
  questionnaire: {
    questions: [
      {
        title: 'What HTML tag is used for the main heading in a document?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '<main>', is_correct: false },
          { label: '<title>', is_correct: false },
          { label: '<h1>', is_correct: true }
        ]
      },
      {
        title: 'How many levels of headings are available in HTML?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '3', is_correct: false },
          { label: '4', is_correct: false },
          { label: '6', is_correct: true }
        ]
      },
      {
        title: 'Which HTML tag is used for the smallest heading?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '<h6>', is_correct: true },
          { label: '<h1>', is_correct: false },
          { label: '<h3>', is_correct: false }
        ]
      },
      {
        title: 'Can you change the appearance of headings using CSS?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Yes', is_correct: true },
          { label: 'No', is_correct: false }
        ]
      },
      {
        title: 'Which HTML tag is used for second-level headings?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: '<h2>', is_correct: true },
          { label: '<h3>', is_correct: false },
          { label: '<h1>', is_correct: false }
        ]
      },
      {
        title: 'What is the purpose of using semantic headings in HTML?',
        name: 'q6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'To improve SEO', is_correct: true },
          { label: 'To add background colors', is_correct: false },
          { label: 'To control font size', is_correct: false }
        ]
      },
      {
        title: "Explain the difference between an 'h1' element and an 'h2' element in HTML.",
        name: 'q7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you align a heading to the center using CSS?',
        name: 'q8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: "What is the default font size for an 'h3' element in HTML?",
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the purpose of using heading elements in HTML?',
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
