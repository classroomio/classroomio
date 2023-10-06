import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'HTML Classes Quiz',
  description: 'Test your knowledge of HTML classes',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of the HTML class attribute?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To define a CSS class for styling',
            is_correct: true
          },
          {
            label: 'To define a JavaScript function',
            is_correct: false
          },
          {
            label: 'To create a new HTML element',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you apply a class to an HTML element?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Using the id attribute',
            is_correct: false
          },
          {
            label: 'Using the name attribute',
            is_correct: false
          },
          {
            label: 'Using the class attribute',
            is_correct: true
          }
        ]
      },
      {
        title: 'Which character is used to separate multiple class names in the class attribute?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: ', (comma)',
            is_correct: false
          },
          {
            label: '. (period)',
            is_correct: false
          },
          {
            label: 'space',
            is_correct: true
          }
        ]
      },
      {
        title: 'How do you select an element with a specific class using CSS?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the purpose of using multiple classes on an HTML element?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How do you apply multiple classes to an HTML element?',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the syntax for selecting elements with a specific class using JavaScript?',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What does the following CSS rule do: .my-class { color: red; }',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you remove a class from an HTML element using JavaScript?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the purpose of the :not() pseudo-class in CSS?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'To select elements that do not match a given selector',
            is_correct: true
          },
          {
            label: 'To select all elements',
            is_correct: false
          },
          {
            label: 'To select child elements',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
