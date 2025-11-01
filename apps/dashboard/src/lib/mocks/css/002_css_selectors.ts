import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'CSS Selectors Quiz',
  description: 'Test your knowledge of CSS selectors',
  questionnaire: {
    questions: [
      {
        title: 'What does the CSS selector "h1" target?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'All <h1> elements', is_correct: true },
          { label: 'The first <h1> element', is_correct: false },
          { label: 'All elements with class "h1"', is_correct: false }
        ]
      },
      {
        title: 'Which CSS selector selects all elements with the class "example"?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '.example', is_correct: true },
          { label: '#example', is_correct: false },
          { label: 'element="example"', is_correct: false }
        ]
      },
      {
        title: 'How can you select all elements inside a <div> element?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '<div> { }', is_correct: false },
          { label: 'div { }', is_correct: true },
          { label: '<div> * { }', is_correct: false }
        ]
      },
      {
        title: 'Which CSS selector selects elements with the "href" attribute?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '[href]', is_correct: true },
          { label: 'href', is_correct: false },
          { label: 'element="href"', is_correct: false }
        ]
      },
      {
        title: 'How do you select an element with the id "myID"?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '#myID', is_correct: true },
          { label: '.myID', is_correct: false },
          { label: 'id="myID"', is_correct: false }
        ]
      },
      {
        title: 'What does the CSS selector "p.intro" target?',
        name: 'q6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'All <p> elements with class "intro"', is_correct: true },
          { label: 'The first <p> element with class "intro"', is_correct: false },
          { label: 'All elements with the id "intro"', is_correct: false }
        ]
      },
      {
        title: 'Explain the usage of the universal selector "*" in CSS.',
        name: 'q7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you select only the first child element of a parent element?',
        name: 'q8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the purpose of pseudo-classes in CSS?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the difference between the "descendant" selector and the "child" selector in CSS?',
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
