import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'HTML Lists Quiz',
  description: 'Test your knowledge of HTML lists',
  questionnaire: {
    questions: [
      {
        title: 'Which HTML tag is used to create an unordered list?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '<ul>', is_correct: true },
          { label: '<ol>', is_correct: false },
          { label: '<li>', is_correct: false }
        ]
      },
      {
        title: 'What does HTML stand for?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Which HTML tag is used to create a numbered list?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '<ul>', is_correct: false },
          { label: '<ol>', is_correct: true },
          { label: '<li>', is_correct: false }
        ]
      },
      {
        title: 'How do you create a nested list in HTML?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'By using multiple <ul> elements', is_correct: false },
          { label: 'By using multiple <ol> elements', is_correct: false },
          { label: 'By using the <li> element within another <li> element', is_correct: true }
        ]
      },
      {
        title: 'Which attribute is used to start counting the list items from a specific number?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'start', is_correct: true },
          { label: 'begin', is_correct: false },
          { label: 'value', is_correct: false }
        ]
      },
      {
        title: 'What HTML tag is used to define the description list?',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '<dl>', is_correct: true },
          { label: '<ul>', is_correct: false },
          { label: '<ol>', is_correct: false }
        ]
      },
      {
        title: 'Which HTML tag is used to define the term in a description list?',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '<dt>', is_correct: true },
          { label: '<dd>', is_correct: false },
          { label: '<dl>', is_correct: false }
        ]
      },
      {
        title: 'Which HTML tag is used to define the description in a description list?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '<dt>', is_correct: false },
          { label: '<dd>', is_correct: true },
          { label: '<dl>', is_correct: false }
        ]
      },
      {
        title: 'How do you create a horizontal list?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'By using the <ul> element', is_correct: false },
          { label: 'By using the <ol> element', is_correct: false },
          { label: 'By using the <li> element with CSS styling', is_correct: true }
        ]
      },
      {
        title: 'Which HTML tag is used to define an item in a list?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '<ul>', is_correct: false },
          { label: '<ol>', is_correct: false },
          { label: '<li>', is_correct: true }
        ]
      }
    ]
  }
};

export default template;
