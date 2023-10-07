import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'HTML Styles Quiz',
  description: 'Test your knowledge of HTML styles',
  questionnaire: {
    questions: [
      {
        title: 'Which HTML attribute is used to add inline styles?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'style', is_correct: true },
          { label: 'css', is_correct: false },
          { label: 'class', is_correct: false }
        ]
      },
      {
        title: 'What is the purpose of CSS in web development?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To add interactivity to a webpage', is_correct: false },
          { label: 'To define the structure of a webpage', is_correct: false },
          { label: 'To style the appearance of a webpage', is_correct: true }
        ]
      },
      {
        title: 'How can you include an external CSS file in an HTML document?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Using the <script> tag', is_correct: false },
          { label: 'Using the <link> tag', is_correct: true },
          { label: 'Using the <style> tag', is_correct: false }
        ]
      },
      {
        title: "What is the purpose of the 'id' attribute in HTML?",
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To define a class for styling', is_correct: false },
          { label: 'To define a unique identifier for an element', is_correct: true },
          { label: 'To create a hyperlink', is_correct: false }
        ]
      },
      {
        title: 'How can you select multiple HTML elements with a specific class using CSS?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: '.classname', is_correct: true },
          { label: '#idname', is_correct: false },
          { label: 'elementname.classname', is_correct: false },
          { label: 'elementname#idname', is_correct: false }
        ]
      },
      {
        title: "What is the purpose of the 'color' property in CSS?",
        name: 'q6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'To specify the background color', is_correct: false },
          { label: 'To specify the font size', is_correct: false },
          { label: 'To define the text color', is_correct: true },
          { label: 'To set the margin', is_correct: false }
        ]
      },
      {
        title: "Explain the difference between 'padding' and 'margin' in CSS.",
        name: 'q7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you center-align an element horizontally using CSS?',
        name: 'q8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: "What does the 'font-family' property in CSS specify?",
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you apply styles to all <p> elements within a <div> element using CSS?',
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
