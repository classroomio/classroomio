import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'CSS Border Quiz',
  description: 'Test your knowledge of CSS borders',
  questionnaire: {
    questions: [
      {
        title: 'Which CSS property is used to set the width of a border?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'border-width', is_correct: true },
          { label: 'border-size', is_correct: false },
          { label: 'border-thickness', is_correct: false }
        ]
      },
      {
        title: 'How do you set the border color in CSS?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'border-color', is_correct: true },
          { label: 'color', is_correct: false },
          { label: 'border-style', is_correct: false }
        ]
      },
      {
        title: 'What is the default value of the "border-style" property in CSS?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'solid', is_correct: false },
          { label: 'none', is_correct: false },
          { label: 'none (or not specified)', is_correct: true }
        ]
      },
      {
        title: 'How do you create a rounded border in CSS?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'border-round', is_correct: false },
          { label: 'border-radius', is_correct: true },
          { label: 'rounded-border', is_correct: false }
        ]
      },
      {
        title: 'What is the CSS property used to set the space between the border and the content?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'border-spacing', is_correct: false },
          { label: 'padding', is_correct: true },
          { label: 'margin', is_correct: false }
        ]
      },
      {
        title: 'Explain the difference between "border-width" and "border-style" in CSS.',
        name: 'q6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you set different border colors for each side of an element in CSS?',
        name: 'q7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the purpose of the "border-collapse" property in CSS?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To collapse table borders', is_correct: true },
          { label: 'To add a shadow to borders', is_correct: false },
          { label: 'To remove all borders', is_correct: false }
        ]
      },
      {
        title: 'How do you remove the border from an image in CSS?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'border: none;', is_correct: true },
          { label: 'border-image: none;', is_correct: false },
          { label: 'border-remove: true;', is_correct: false }
        ]
      },
      {
        title: 'What is the CSS property used to set the space between the borders of adjacent cells in a table?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'cell-spacing', is_correct: false },
          { label: 'border-space', is_correct: false },
          { label: 'border-spacing', is_correct: true }
        ]
      }
    ]
  }
};

export default template;
