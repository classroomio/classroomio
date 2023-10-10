import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'PHP Arrays Quiz',
  description: 'Test your knowledge of PHP arrays and their usage.',
  questionnaire: {
    questions: [
      {
        title: 'What is an array in PHP?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'A mathematical function',
            is_correct: false,
          },
          {
            label: 'A data structure that can hold multiple values',
            is_correct: true,
          },
          {
            label: 'A string manipulation technique',
            is_correct: false,
          },
          {
            label: 'A type of loop in PHP',
            is_correct: false,
          },
        ],
      },
      {
        title: 'How do you create an indexed array in PHP?',
        name: 'question2',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Using the `array()` constructor',
            is_correct: true,
          },
          {
            label: 'Using the `new Array()` constructor',
            is_correct: false,
          },
          {
            label: 'By defining each element separately',
            is_correct: false,
          },
          {
            label: 'Indexed arrays are not supported in PHP',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the index of the first element in a PHP indexed array?',
        name: 'question3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: '0',
            is_correct: true,
          },
          {
            label: '1',
            is_correct: false,
          },
          {
            label: '-1',
            is_correct: false,
          },
          {
            label: 'No index for the first element',
            is_correct: false,
          },
        ],
      },
      {
        title: 'How do you access an element in a PHP indexed array?',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By using the element name',
            is_correct: false,
          },
          {
            label: 'By using the element value',
            is_correct: false,
          },
          {
            label: 'By using the element index',
            is_correct: true,
          },
          {
            label: 'By using the element key',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the purpose of an associative array in PHP?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To store only numbers',
            is_correct: false,
          },
          {
            label: 'To store only strings',
            is_correct: false,
          },
          {
            label: 'To store key-value pairs',
            is_correct: true,
          },
          {
            label: 'To store only boolean values',
            is_correct: false,
          },
        ],
      },
      {
        title: 'How do you add a key-value pair to an associative array in PHP?',
        name: 'question6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By using the `add` keyword',
            is_correct: false,
          },
          {
            label: 'By using the `append` method',
            is_correct: false,
          },
          {
            label: 'By using square brackets and the key name',
            is_correct: true,
          },
          {
            label: 'Associative arrays do not support adding key-value pairs',
            is_correct: false,
          },
        ],
      },
      {
        title: 'How do you check if a key exists in an associative array in PHP?',
        name: 'question7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By using the `exists` method',
            is_correct: false,
          },
          {
            label: 'By using the `contains` keyword',
            is_correct: false,
          },
          {
            label: 'By using the `in_array` function',
            is_correct: false,
          },
          {
            label: 'By using the `array_key_exists` function',
            is_correct: true,
          },
        ],
      },
      {
        title: 'What is the purpose of a multidimensional array in PHP?',
        name: 'question8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To store only numbers',
            is_correct: false,
          },
          {
            label: 'To store only strings',
            is_correct: false,
          },
          {
            label: 'To store key-value pairs',
            is_correct: false,
          },
          {
            label: 'To store arrays within an array',
            is_correct: true,
          },
        ],
      },
      {
        title: 'How do you access an element in a multidimensional array in PHP?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By using the element name',
            is_correct: false,
          },
          {
            label: 'By using the element value',
            is_correct: false,
          },
          {
            label: 'By using the element index',
            is_correct: true,
          },
          {
            label: 'By using the element key',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the difference between indexed and associative arrays in PHP?',
        name: 'question10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Indexed arrays have keys and values, while associative arrays only have values',
            is_correct: false,
          },
          {
            label: 'Indexed arrays are unordered, while associative arrays are ordered',
            is_correct: false,
          },
          {
            label: 'Indexed arrays use strings as keys, while associative arrays use integers',
            is_correct: false,
          },
          {
            label: 'Indexed arrays use integers as keys, while associative arrays use named keys',
            is_correct: true,
          },
        ],
      },
    ],
  },
};

export default template;
