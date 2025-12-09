import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'HTML Paragraphs Quiz',
  description: 'Test your knowledge of HTML paragraphs',
  questionnaire: {
    questions: [
      {
        title: 'What HTML tag is used to define a paragraph?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '<p>', is_correct: true },
          { label: '<para>', is_correct: false },
          { label: '<text>', is_correct: false }
        ]
      },
      {
        title: 'How can you create a line break in HTML?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '<br>', is_correct: true },
          { label: '<lb>', is_correct: false },
          { label: '<linebreak>', is_correct: false }
        ]
      },
      {
        title: "What is the purpose of the 'align' attribute in the 'p' tag?",
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To specify the font size', is_correct: false },
          { label: 'To specify the text alignment', is_correct: true },
          { label: 'To add a border around the paragraph', is_correct: false }
        ]
      },
      {
        title: 'Which HTML tag is used to create a preformatted text?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '<pre>', is_correct: true },
          { label: '<text>', is_correct: false },
          { label: '<code>', is_correct: false }
        ]
      },
      {
        title: 'How can you emphasize text in HTML?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: '<strong>', is_correct: true },
          { label: '<em>', is_correct: true },
          { label: '<b>', is_correct: false },
          { label: '<i>', is_correct: false }
        ]
      },
      {
        title: "What is the purpose of the 'blockquote' element in HTML?",
        name: 'q6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'To create a quotation', is_correct: true },
          { label: 'To add a background color', is_correct: false },
          { label: 'To insert an image', is_correct: false }
        ]
      },
      {
        title: "Explain the use of the 'q' element in HTML.",
        name: 'q7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you create a subscript text in HTML?',
        name: 'q8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: "What does the 'cite' attribute in the 'blockquote' element specify?",
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you create a superscript text in HTML?',
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
