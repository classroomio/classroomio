import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'HTML Attributes Quiz',
  description: 'Test your knowledge of HTML attributes',
  questionnaire: {
    questions: [
      {
        title: "What does the 'href' attribute specify?",
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'The source URL of an image', is_correct: false },
          { label: 'The target of a hyperlink', is_correct: true },
          { label: 'The name of a form field', is_correct: false }
        ]
      },
      {
        title: 'How can you make a text input field read-only in HTML?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: "By using the 'disabled' attribute", is_correct: false },
          { label: "By using the 'readonly' attribute", is_correct: true },
          { label: "By using the 'read-only' attribute", is_correct: false }
        ]
      },
      {
        title: 'Which HTML attribute is used to define inline styles?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'style', is_correct: true },
          { label: 'css', is_correct: false },
          { label: 'inline', is_correct: false }
        ]
      },
      {
        title: 'How can you specify multiple CSS classes for an HTML element?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: "Use the 'multiple-classes' attribute", is_correct: false },
          { label: 'Separate class names with spaces', is_correct: true },
          { label: "Use the 'classlist' attribute", is_correct: false }
        ]
      },
      {
        title: 'Which HTML attribute is used to provide additional information about an element?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'alt', is_correct: false },
          { label: 'title', is_correct: true },
          { label: 'description', is_correct: false },
          { label: 'info', is_correct: false }
        ]
      },
      {
        title: "What is the purpose of the 'alt' attribute in an image tag?",
        name: 'q6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'Define the alignment of the image', is_correct: false },
          { label: 'Provide alternative text for the image', is_correct: true },
          { label: "Specify the image's width", is_correct: false }
        ]
      },
      {
        title: "Explain the use of the 'placeholder' attribute in an input field.",
        name: 'q7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you create a tooltip for an element using HTML attributes?',
        name: 'q8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Which HTML attribute is used to define the source URL of an iframe?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: "Explain the purpose of the 'disabled' attribute in an input field.",
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
