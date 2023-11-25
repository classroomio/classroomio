import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Python Data Types Quiz',
  description: 'Test your knowledge of Python data types',
  questionnaire: {
    questions: [
      {
        title: 'What is a data type in Python?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A type of snake', is_correct: false },
          { label: 'A classification of data', is_correct: true },
          { label: 'A Python function', is_correct: false }
        ]
      },
      {
        title: 'How do you declare a variable with the "int" data type in Python?',
        name: 'question2',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'var x: int', is_correct: false },
          { label: 'int x', is_correct: true },
          { label: 'x = int', is_correct: false }
        ]
      },
      {
        title: 'Which of the following is a valid variable name in Python?',
        name: 'question3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: '123variable', is_correct: false },
          { label: 'my_variable', is_correct: true },
          { label: 'variable@name', is_correct: false },
          { label: '_variable', is_correct: true }
        ]
      },
      {
        title: 'What is the purpose of the "str" data type in Python?',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To store integers', is_correct: false },
          { label: 'To store strings', is_correct: true },
          { label: 'To store floating-point numbers', is_correct: false }
        ]
      },
      {
        title: 'Explain the purpose of data types in Python.',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Which data type is used to store a sequence of items in Python?',
        name: 'question6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'int', is_correct: false },
          { label: 'str', is_correct: false },
          { label: 'list', is_correct: true }
        ]
      },
      {
        title: 'How do you check the data type of a variable in Python?',
        name: 'question7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'typeof()', is_correct: false },
          { label: 'type()', is_correct: true },
          { label: 'datatype()', is_correct: false }
        ]
      },
      {
        title: 'Which data type is used to store a single character in Python?',
        name: 'question8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'char', is_correct: false },
          { label: 'str', is_correct: false },
          { label: 'chr', is_correct: true }
        ]
      },
      {
        title: 'What is the "bool" data type used for in Python?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Which data type is used to store a collection of items in Python?',
        name: 'question10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'tuple', is_correct: true },
          { label: 'set', is_correct: true },
          { label: 'dict', is_correct: true },
          { label: 'str', is_correct: false }
        ]
      }
    ]
  }
};

export default template;
