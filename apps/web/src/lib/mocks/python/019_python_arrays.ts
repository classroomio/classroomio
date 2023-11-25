import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Python Arrays Quiz',
  description: 'Test your knowledge of Python arrays',
  questionnaire: {
    questions: [
      {
        title: 'What is a Python list?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'An ordered collection of items', is_correct: true },
          { label: 'A data type to store text', is_correct: false },
          { label: 'A way to define functions', is_correct: false }
        ]
      },
      {
        title: 'How do you create an empty list in Python?',
        name: 'question2',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Using the `array()` function', is_correct: false },
          { label: 'Using the `list()` function', is_correct: true },
          { label: 'You cannot create an empty list', is_correct: false }
        ]
      },
      {
        title: 'What is the index of the first element in a Python list?',
        name: 'question3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '0', is_correct: true },
          { label: '1', is_correct: false },
          { label: '-1', is_correct: false }
        ]
      },
      {
        title: 'Explain the concept of slicing in Python lists.',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the difference between lists and tuples in Python?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Lists are immutable, tuples are mutable', is_correct: false },
          {
            label: 'Lists are ordered and mutable, tuples are ordered and immutable',
            is_correct: true
          },
          { label: 'Lists are unordered, tuples are ordered', is_correct: false }
        ]
      },
      {
        title: 'How do you add an element to the end of a list in Python?',
        name: 'question6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Using the `insert()` method', is_correct: false },
          { label: 'Using the `append()` method', is_correct: true },
          { label: 'Using the `add()` function', is_correct: false }
        ]
      },
      {
        title: 'Explain the concept of list comprehension in Python.',
        name: 'question7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How do you remove an element from a list by value in Python?',
        name: 'question8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Using the `delete()` method', is_correct: false },
          { label: 'Using the `remove()` method', is_correct: true },
          { label: 'Using the `pop()` function', is_correct: false }
        ]
      },
      {
        title: 'What is the result of the expression `len(my_list)` where `my_list` is a list?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'The last element of the list', is_correct: false },
          { label: 'The length (number of elements) of the list', is_correct: true },
          { label: 'The sum of all elements in the list', is_correct: false }
        ]
      },
      {
        title: 'Explain an example use case for Python arrays in programming.',
        name: 'question10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      }
    ]
  }
};

export default template;
