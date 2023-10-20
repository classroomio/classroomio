import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Python Dictionaries Quiz',
  description: 'Test your knowledge of Python dictionaries',
  questionnaire: {
    questions: [
      {
        title: 'What is a Python dictionary?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'An ordered collection of elements', is_correct: false },
          { label: 'An unordered collection of key-value pairs', is_correct: true },
          { label: 'A list with duplicate elements', is_correct: false },
        ],
      },
      {
        title: 'How do you declare a Python dictionary?',
        name: 'question2',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'dict x = {\'name\': \'John\', \'age\': 30}', is_correct: false },
          { label: 'x = {\'name\': \'John\', \'age\': 30}', is_correct: true },
          { label: 'x = dictionary(\'name\'=\'John\', \'age\'=30)', is_correct: false },
        ],
      },
      {
        title: 'Which of the following is a valid dictionary declaration in Python?',
        name: 'question3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'mydict = {1: \'apple\', 2: \'banana\'}', is_correct: true },
          { label: 'mydict = [\'apple\', \'banana\']', is_correct: false },
          { label: 'mydict = {\'name\': [\'John\', \'Doe\'], \'age\': 30}', is_correct: true },
        ],
      },
      {
        title: 'Explain the concept of key-value pairs in dictionaries in Python.',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'How do you access a value in a dictionary in Python?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'By index using square brackets', is_correct: false },
          { label: 'By using dot notation', is_correct: true },
          { label: 'By using curly braces', is_correct: false },
        ],
      },
      {
        title: 'What is the result of mydict.get(\'age\') in Python?',
        name: 'question6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Error', is_correct: false },
          { label: '30', is_correct: true },
          { label: 'None', is_correct: false },
        ],
      },
      {
        title: 'Explain the concept of dictionary methods in Python.',
        name: 'question7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'How do you add a key-value pair to a dictionary in Python?',
        name: 'question8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'add()', is_correct: false },
          { label: 'insert()', is_correct: false },
          { label: 'mydict[\'new_key\'] = \'new_value\'', is_correct: true },
        ],
      },
      {
        title: 'What is the result of mydict.pop(\'name\') in Python?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Error', is_correct: false },
          { label: '30', is_correct: false },
          { label: '\'John\'', is_correct: true },
        ],
      },
      {
        title: 'Explain the concept of dictionary comprehension in Python.',
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
