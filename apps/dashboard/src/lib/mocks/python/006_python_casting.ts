import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Python Casting Quiz',
  description: 'Test your knowledge of Python casting',
  questionnaire: {
    questions: [
      {
        title: 'What is type casting in Python?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Casting spells in Python', is_correct: false },
          { label: 'Changing the data type of a value', is_correct: true },
          { label: 'Type checking in Python', is_correct: false }
        ]
      },
      {
        title: 'How do you perform type casting in Python?',
        name: 'question2',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Using the "cast" keyword', is_correct: false },
          { label: 'Using the "to" keyword', is_correct: false },
          { label: 'By specifying the target data type', is_correct: true }
        ]
      },
      {
        title: 'What is the result of casting "3.14" to an integer in Python?',
        name: 'question3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '3.14', is_correct: false },
          { label: '3', is_correct: true },
          { label: '14', is_correct: false }
        ]
      },
      {
        title: 'Explain the purpose of type casting in Python.',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Which casting function is used to convert a value to a floating-point number?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'float()', is_correct: true },
          { label: 'int()', is_correct: false },
          { label: 'str()', is_correct: false }
        ]
      },
      {
        title: 'What happens if you try to cast a string that is not a valid number to an integer?',
        name: 'question6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'It becomes a valid integer', is_correct: false },
          { label: 'An error occurs', is_correct: true },
          { label: 'It becomes a float', is_correct: false }
        ]
      },
      {
        title: 'Which casting function is used to convert a value to an integer in Python?',
        name: 'question7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'int()', is_correct: true },
          { label: 'float()', is_correct: false },
          { label: 'str()', is_correct: false }
        ]
      },
      {
        title: 'Explain the concept of implicit type casting in Python.',
        name: 'question8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What happens if you try to cast a floating-point number to an integer using int()?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'It becomes a string', is_correct: false },
          { label: 'It becomes a float', is_correct: false },
          { label: 'The decimal part is truncated', is_correct: true }
        ]
      },
      {
        title: 'Which casting function is used to convert a value to a string in Python?',
        name: 'question10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'str()', is_correct: true },
          { label: 'int()', is_correct: false },
          { label: 'float()', is_correct: false }
        ]
      }
    ]
  }
};

export default template;
