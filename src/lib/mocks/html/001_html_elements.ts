import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'HTML Elements Quiz',
  description: 'Test your knowledge of HTML elements.',
  questionnaire: {
    questions: [
      {
        title: 'What does the <p> element stand for?',
        name: 'p_element',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Paragraph', is_correct: true },
          { label: 'Page', is_correct: false },
          { label: 'Preformatted', is_correct: false }
        ]
      },
      {
        title: 'Which HTML element is used for creating an unordered list?',
        name: 'ul_element',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '<ul>', is_correct: true },
          { label: '<ol>', is_correct: false },
          { label: '<li>', is_correct: false }
        ]
      },
      {
        title: 'What does the <a> element do?',
        name: 'a_element',
        points: 2,
        order: 3,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'Defines a hyperlink', is_correct: true },
          { label: 'Creates a table', is_correct: false },
          { label: 'Adds an image', is_correct: false },
          { label: 'Defines a form', is_correct: false }
        ]
      },
      {
        title: 'Which HTML element is used for creating a line break?',
        name: 'br_element',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '<br>', is_correct: true },
          { label: '<p>', is_correct: false },
          { label: '<hr>', is_correct: false }
        ]
      },
      {
        title: 'What does the <h1> to <h6> elements represent?',
        name: 'h_elements',
        points: 2,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      }
    ]
  }
};

export default template;
