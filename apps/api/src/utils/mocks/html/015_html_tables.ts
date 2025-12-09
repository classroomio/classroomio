import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'HTML Tables Quiz',
  description: 'Test your knowledge of HTML tables',
  questionnaire: {
    questions: [
      {
        title: 'What HTML tag is used to create a table?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '<table>', is_correct: true },
          { label: '<tr>', is_correct: false },
          { label: '<td>', is_correct: false }
        ]
      },
      {
        title: 'Which HTML tag is used to define a table row?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '<table>', is_correct: false },
          { label: '<tr>', is_correct: true },
          { label: '<td>', is_correct: false }
        ]
      },
      {
        title: 'What is the purpose of the <th> element in an HTML table?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To create a new table', is_correct: false },
          { label: 'To define a table header cell', is_correct: true },
          { label: 'To define a table data cell', is_correct: false }
        ]
      },
      {
        title: 'Which HTML tag is used to define a table data cell?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '<th>', is_correct: false },
          { label: '<td>', is_correct: true },
          { label: '<tr>', is_correct: false }
        ]
      },
      {
        title: 'What attribute is used to define the alignment of the content inside a table cell?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'align', is_correct: false },
          { label: 'valign', is_correct: false },
          { label: 'style', is_correct: false },
          { label: 'text-align', is_correct: true }
        ]
      },
      {
        title: 'How can you create a border around an HTML table?',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Using the <border> element', is_correct: false },
          { label: "Setting the border attribute to '1'", is_correct: true },
          { label: 'Using the <table-border> element', is_correct: false }
        ]
      },
      {
        title: 'Which HTML attribute is used to specify the width of a table border?',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'border-width', is_correct: false },
          { label: 'border-style', is_correct: false },
          { label: 'border-color', is_correct: false },
          { label: 'border', is_correct: true }
        ]
      },
      {
        title: 'What HTML tag is used to create a table header cell?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '<th>', is_correct: true },
          { label: '<td>', is_correct: false },
          { label: '<tr>', is_correct: false }
        ]
      },
      {
        title: 'How do you add a caption to an HTML table?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Using the <caption> element', is_correct: true },
          { label: 'Using the <header> element', is_correct: false },
          { label: 'Using the <caption-text> element', is_correct: false }
        ]
      },
      {
        title: 'Which HTML attribute is used to specify the background color of a table?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'bgcolor', is_correct: false },
          { label: 'background-color', is_correct: true },
          { label: 'table-color', is_correct: false },
          { label: 'color', is_correct: false }
        ]
      }
    ]
  }
};

export default template;
