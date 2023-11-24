import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Python Tuples Quiz',
  description: 'Test your knowledge of Python tuples',
  questionnaire: {
    questions: [
      {
        title: 'What is a Python tuple?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'An ordered collection of elements that can be modified', is_correct: false },
          { label: 'An ordered collection of elements that cannot be modified', is_correct: true },
          { label: 'A list with different syntax', is_correct: false },
        ],
      },
      {
        title: 'How do you declare a Python tuple?',
        name: 'question2',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'tuple x = (1, 2, 3)', is_correct: false },
          { label: 'x = (1, 2, 3)', is_correct: true },
          { label: 'x = tuple(1, 2, 3)', is_correct: false },
        ],
      },
      {
        title: 'Which of the following is a valid tuple declaration in Python?',
        name: 'question3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'mytuple = (1, 2, 3)', is_correct: true },
          { label: 'mytuple = [1, 2, 3]', is_correct: false },
          { label: 'mytuple = (\'apple\', \'banana\', \'cherry\')', is_correct: true },
        ],
      },
      {
        title: 'Explain the concept of immutability of tuples in Python.',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'How do you access elements in a tuple in Python?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'By index using square brackets', is_correct: true },
          { label: 'By using dot notation', is_correct: false },
          { label: 'By using curly braces', is_correct: false },
        ],
      },
      {
        title: 'What is the result of (1, 2, 3) + (4, 5, 6) in Python?',
        name: 'question6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '(1, 2, 3, 4, 5, 6)', is_correct: true },
          { label: '10', is_correct: false },
          { label: '(10, 15, 21)', is_correct: false },
        ],
      },
      {
        title: 'Explain the concept of tuple methods in Python.',
        name: 'question7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'How do you check if an item is present in a tuple in Python?',
        name: 'question8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'By using the `contains` keyword', is_correct: false },
          { label: 'Using the `in` keyword', is_correct: true },
          { label: 'By using a loop', is_correct: false },
        ],
      },
      {
        title: 'What is the result of (1, 2, 3).count(2) in Python?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '2', is_correct: false },
          { label: '3', is_correct: false },
          { label: '1', is_correct: true },
        ],
      },
      {
        title: 'Explain the concept of tuple unpacking in Python.',
        name: 'question10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
    ],
  },
};

export default template;
