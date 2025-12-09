import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'HTML Elements Quiz',
  description: 'Test your knowledge of HTML elements',
  questionnaire: {
    questions: [
      {
        title: 'Which HTML tag is used to define the structure of an HTML document?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '<html>', is_correct: true },
          { label: '<head>', is_correct: false },
          { label: '<body>', is_correct: false }
        ]
      },
      {
        title: 'How can you create a hyperlink in HTML?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: "<a href='url'>link text</a>", is_correct: true },
          { label: "<link href='url'>link text</link>", is_correct: false },
          { label: '<hyperlink>link text</hyperlink>', is_correct: false }
        ]
      },
      {
        title: 'Which HTML tag is used to define a paragraph?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '<p>', is_correct: true },
          { label: '<paragraph>', is_correct: false },
          { label: '<para>', is_correct: false }
        ]
      },
      {
        title: 'How do you create an ordered list in HTML?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '<ol>', is_correct: true },
          { label: '<ul>', is_correct: false },
          { label: '<li>', is_correct: false }
        ]
      },
      {
        title: 'Which HTML tag is used to define a table?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: '<table>', is_correct: true },
          { label: '<tab>', is_correct: false },
          { label: '<tb>', is_correct: false }
        ]
      },
      {
        title: 'How do you insert an image in HTML?',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: "<img src='image.jpg'>", is_correct: true },
          { label: "<image href='image.jpg'>", is_correct: false },
          { label: "<picture src='image.jpg'>", is_correct: false }
        ]
      },
      {
        title: "What is the purpose of the 'div' element in HTML?",
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'Define a division or a section', is_correct: true },
          { label: 'Create a link', is_correct: false },
          { label: 'Insert a video', is_correct: false }
        ]
      },
      {
        title: "Explain the use of the 'hr' element in HTML.",
        name: 'q8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: "What is the purpose of the 'iframe' element in HTML?",
        name: 'q9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How do you create an unordered list in HTML?',
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
