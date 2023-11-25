import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'CSS Box Model Quiz',
  description: 'Test your knowledge of the CSS Box Model',
  questionnaire: {
    questions: [
      {
        title: 'What does the CSS Box Model describe?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A model for organizing HTML elements', is_correct: false },
          { label: 'A model for describing colors in CSS', is_correct: false },
          {
            label: 'A model for calculating the size and spacing of elements in CSS',
            is_correct: true
          },
          { label: 'A model for creating responsive layouts', is_correct: false }
        ]
      },
      {
        title: 'Which parts are included in the CSS Box Model?',
        name: 'q2',
        points: 2,
        order: 1,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'Content', is_correct: true },
          { label: 'Padding', is_correct: true },
          { label: 'Border', is_correct: true },
          { label: 'Margin', is_correct: true },
          { label: 'Outline', is_correct: false }
        ]
      },
      {
        title: 'What is the default value of the "box-sizing" property in CSS?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'border-box', is_correct: false },
          { label: 'content-box', is_correct: true },
          { label: 'margin-box', is_correct: false },
          { label: 'padding-box', is_correct: false }
        ]
      },
      {
        title: 'How do you calculate the total width of an element in the CSS Box Model?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Width + Padding + Border + Margin', is_correct: true },
          { label: 'Width + Padding + Border', is_correct: false },
          { label: 'Width + Padding', is_correct: false },
          { label: 'Width', is_correct: false }
        ]
      },
      {
        title: 'What is the purpose of the "box-sizing" property in CSS?',
        name: 'q5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Explain the difference between margin and padding in the CSS Box Model.',
        name: 'q6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you make an element ignore the margin of its parent element?',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'By setting the margin of the child element to "auto"', is_correct: false },
          { label: 'By using the "overflow" property', is_correct: false },
          { label: 'By setting the margin of the parent element to "auto"', is_correct: false },
          { label: 'By using the "position" property', is_correct: true }
        ]
      },
      {
        title: 'What happens to the total width of an element when you add padding?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'It increases', is_correct: true },
          { label: 'It decreases', is_correct: false },
          { label: 'It remains the same', is_correct: false }
        ]
      },
      {
        title: 'In the CSS Box Model, what does the "border-collapse" property control?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'The width of the border', is_correct: false },
          { label: 'The spacing between table cells', is_correct: true },
          { label: 'The padding of table cells', is_correct: false },
          { label: 'The margin of table cells', is_correct: false }
        ]
      },
      {
        title: 'What is the CSS property used to add space around an element?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'margin', is_correct: true },
          { label: 'padding', is_correct: false },
          { label: 'border', is_correct: false },
          { label: 'spacing', is_correct: false }
        ]
      }
    ]
  }
};

export default template;
