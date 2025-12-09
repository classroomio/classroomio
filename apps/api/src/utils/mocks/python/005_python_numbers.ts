import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'Python Numbers Quiz',
  description: 'Test your knowledge of Python numbers',
  questionnaire: {
    questions: [
      {
        title: 'What is the main purpose of numbers in Python?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To add color to your code', is_correct: false },
          { label: 'To perform mathematical operations', is_correct: true },
          { label: 'To create text strings', is_correct: false }
        ]
      },
      {
        title: 'Which of the following is not a valid numeric data type in Python?',
        name: 'question2',
        points: 2,
        order: 1,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'int', is_correct: true },
          { label: 'float', is_correct: true },
          { label: 'str', is_correct: false },
          { label: 'char', is_correct: false }
        ]
      },
      {
        title: 'How do you declare a floating-point number in Python?',
        name: 'question3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'x = 5', is_correct: false },
          { label: 'float x', is_correct: false },
          { label: 'x = 5.0', is_correct: true }
        ]
      },
      {
        title: 'What is the result of 5 + 2 in Python?',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '7', is_correct: true },
          { label: '52', is_correct: false },
          { label: '25', is_correct: false }
        ]
      },
      {
        title: 'Explain the purpose of numeric data types in Python.',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Which operator is used for exponentiation in Python?',
        name: 'question6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '^', is_correct: false },
          { label: '**', is_correct: true },
          { label: '^^', is_correct: false }
        ]
      },
      {
        title: 'What is the result of 10 / 3 in Python?',
        name: 'question7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '3.333', is_correct: false },
          { label: '3.0', is_correct: false },
          { label: '3', is_correct: true }
        ]
      },
      {
        title: 'What is the purpose of the "complex" data type in Python?',
        name: 'question8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To store complex numbers', is_correct: true },
          { label: 'To represent text', is_correct: false },
          { label: 'To handle exceptions', is_correct: false }
        ]
      },
      {
        title: 'Explain the purpose of mathematical operators in Python.',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Which operator is used to find the remainder of a division in Python?',
        name: 'question10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: '%', is_correct: true },
          { label: '/', is_correct: false },
          { label: '*', is_correct: false },
          { label: '//', is_correct: false }
        ]
      }
    ]
  }
};

export default template;
