import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'HTML Blocks Quiz',
  description: 'Test your knowledge of HTML blocks',
  questionnaire: {
    questions: [
      {
        title: 'Which HTML tag is used to define an HTML block?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '<block>', is_correct: false },
          { label: '<div>', is_correct: true },
          { label: '<section>', is_correct: false }
        ]
      },
      {
        title: 'What is the purpose of the HTML <div> element?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Which HTML tag is used to define a paragraph?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '<p>', is_correct: true },
          { label: '<paragraph>', is_correct: false },
          { label: '<par>', is_correct: false }
        ]
      },
      {
        title: 'How can you make text bold in HTML?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'By using the <strong> tag', is_correct: true },
          { label: 'By using the <bold> tag', is_correct: false },
          { label: 'By using CSS styling', is_correct: true }
        ]
      },
      {
        title: 'What is the purpose of the HTML <section> element?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Which HTML tag is used to define a line break?',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '<lb>', is_correct: false },
          { label: '<break>', is_correct: false },
          { label: '<br>', is_correct: true }
        ]
      },
      {
        title: 'How do you create a hyperlink in HTML?',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'By using the <a> tag', is_correct: true },
          { label: 'By using the <link> tag', is_correct: false },
          { label: 'By using the <hyperlink> tag', is_correct: false }
        ]
      },
      {
        title: 'What is the purpose of the HTML <aside> element?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Which HTML tag is used to define a blockquote?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '<quote>', is_correct: false },
          { label: '<blockquote>', is_correct: true },
          { label: '<q>', is_correct: false }
        ]
      },
      {
        title: 'What does the HTML <hr> element represent?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A horizontal rule or thematic break', is_correct: true },
          { label: 'A hyperlink reference', is_correct: false },
          { label: 'A header element', is_correct: false }
        ]
      }
    ]
  }
};

export default template;
