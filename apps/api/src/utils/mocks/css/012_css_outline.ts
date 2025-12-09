import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'CSS Outline Quiz',
  description: 'Test your knowledge of CSS outline properties',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of the CSS "outline" property?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To add a shadow to text', is_correct: false },
          { label: 'To draw a border around an element outside of the border', is_correct: true },
          { label: 'To create a background color', is_correct: false },
          { label: 'To change the font size', is_correct: false }
        ]
      },
      {
        title: 'What is the default style of the CSS "outline" property?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Dotted', is_correct: false },
          { label: 'Solid', is_correct: true },
          { label: 'None', is_correct: false },
          { label: 'Inset', is_correct: false }
        ]
      },
      {
        title: 'Which of the following CSS properties is used to set the color of the outline?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'outline-color', is_correct: true },
          { label: 'outline-style', is_correct: false },
          { label: 'outline-width', is_correct: false },
          { label: 'border-color', is_correct: false }
        ]
      },
      {
        title: 'How do you remove the outline from an element in CSS?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'By setting "outline: none;"', is_correct: true },
          { label: 'By setting "outline: 0;"', is_correct: false },
          { label: 'By setting "outline: transparent;"', is_correct: false },
          { label: 'By setting "outline: hidden;"', is_correct: false }
        ]
      },
      {
        title: 'What is the purpose of the "outline-offset" property in CSS?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Explain the difference between "border" and "outline" in CSS.',
        name: 'q6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What happens when you use the "outline" property on a text element?',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'The text becomes bold', is_correct: false },
          { label: 'The text is underlined', is_correct: false },
          { label: 'The text receives an outline around it', is_correct: true },
          { label: 'The text changes color', is_correct: false }
        ]
      },
      {
        title: 'In CSS, can you have multiple outlines on the same element?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Yes', is_correct: true },
          { label: 'No', is_correct: false }
        ]
      },
      {
        title: 'What is the CSS property used to control the width of the outline?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'outline-width', is_correct: true },
          { label: 'outline-color', is_correct: false },
          { label: 'outline-style', is_correct: false },
          { label: 'border-width', is_correct: false }
        ]
      },
      {
        title: 'What is the CSS property used to control the style of the outline?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'outline-style', is_correct: true },
          { label: 'outline-color', is_correct: false },
          { label: 'outline-width', is_correct: false },
          { label: 'border-style', is_correct: false }
        ]
      }
    ]
  }
};

export default template;
