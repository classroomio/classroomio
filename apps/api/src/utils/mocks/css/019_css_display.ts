import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'CSS Display and Visibility Quiz',
  description: 'Test your knowledge of CSS display and visibility properties',
  questionnaire: {
    questions: [
      {
        title: 'Which CSS property is used to hide an element without affecting the layout of the page?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'display: none;', is_correct: true },
          { label: 'visibility: hidden;', is_correct: false },
          { label: 'opacity: 0;', is_correct: false },
          { label: 'position: absolute;', is_correct: false }
        ]
      },
      {
        title: 'What is the default value of the "display" property for most HTML elements?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'block', is_correct: false },
          { label: 'inline', is_correct: false },
          { label: 'none', is_correct: false },
          { label: 'initial', is_correct: true }
        ]
      },
      {
        title: 'How can you make an element take up the full width of its parent container?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'width: 100%;', is_correct: true },
          { label: 'width: auto;', is_correct: false },
          { label: 'width: inherit;', is_correct: false },
          { label: 'width: initial;', is_correct: false }
        ]
      },
      {
        title: 'Which CSS property is used to hide an element but still occupy space in the layout?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'display: none;', is_correct: false },
          { label: 'visibility: hidden;', is_correct: true },
          { label: 'opacity: 0;', is_correct: false },
          { label: 'position: absolute;', is_correct: false }
        ]
      },
      {
        title: 'What is the purpose of the "visibility" property in CSS?',
        name: 'q5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you change an element from "inline" to "block" using CSS?',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'display: inline;', is_correct: false },
          { label: 'display: block;', is_correct: true },
          { label: 'display: inline-block;', is_correct: false },
          { label: 'display: initial;', is_correct: false }
        ]
      },
      {
        title: 'What is the purpose of the "display: inline-block;" property value in CSS?',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you make an element invisible to the screen reader while still rendering it on the page?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'visibility: hidden;', is_correct: false },
          { label: 'display: none;', is_correct: false },
          { label: 'opacity: 0;', is_correct: false },
          { label: 'position: absolute;', is_correct: true }
        ]
      },
      {
        title: 'What is the purpose of the "position: absolute;" property value in CSS?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you center-align an element horizontally using CSS?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'text-align: center;', is_correct: false },
          { label: 'margin: 0 auto;', is_correct: true },
          { label: 'align: center;', is_correct: false },
          { label: 'position: center;', is_correct: false }
        ]
      }
    ]
  }
};

export default template;
