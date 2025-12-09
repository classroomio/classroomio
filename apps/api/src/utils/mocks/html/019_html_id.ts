import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'HTML ID Quiz',
  description: 'Test your knowledge of HTML ID attributes',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of the HTML id attribute?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To define a class for styling',
            is_correct: false
          },
          {
            label: 'To define a JavaScript function',
            is_correct: false
          },
          {
            label: 'To uniquely identify an HTML element',
            is_correct: true
          }
        ]
      },
      {
        title: 'Can multiple HTML elements have the same id?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Yes',
            is_correct: false
          },
          {
            label: 'No',
            is_correct: true
          }
        ]
      },
      {
        title: 'How do you select an element with a specific id using CSS?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the purpose of the HTML name attribute?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How do you apply an id to an HTML element?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the syntax for selecting elements with a specific id using JavaScript?',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the purpose of the HTML data-* attribute?',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'To store custom data private to the page or application',
            is_correct: true
          },
          {
            label: 'To define a CSS class',
            is_correct: false
          },
          {
            label: 'To define JavaScript functions',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the difference between id and class attributes in HTML?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the purpose of the HTML for attribute?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you remove an id from an HTML element using JavaScript?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      }
    ]
  }
};

export default template;
