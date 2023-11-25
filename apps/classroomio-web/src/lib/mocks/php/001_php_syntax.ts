import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'PHP Syntax Quiz',
  description: 'Test your knowledge of PHP syntax.',
  questionnaire: {
    questions: [
      {
        title: 'What does PHP stand for?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Personal Hypertext Processor',
            is_correct: false
          },
          {
            label: 'PHP: Hypertext Preprocessor',
            is_correct: true
          },
          {
            label: 'Pretext Hyper Processor',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which of the following is the correct way to start a PHP script?',
        name: 'question2',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: '<?php',
            is_correct: true
          },
          {
            label: '<?',
            is_correct: false
          },
          {
            label: '<script>',
            is_correct: false
          },
          {
            label: '<php>',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the correct way to output "Hello, World!" in PHP?',
        name: 'question3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How do you end a PHP statement?',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: ';',
            is_correct: true
          },
          {
            label: '.',
            is_correct: false
          },
          {
            label: ':',
            is_correct: false
          },
          {
            label: ',',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the correct way to create a variable in PHP?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: '$variable_name',
            is_correct: true
          },
          {
            label: '@variable_name',
            is_correct: false
          },
          {
            label: '%variable_name%',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you concatenate two strings in PHP?',
        name: 'question6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: '+',
            is_correct: false
          },
          {
            label: '.',
            is_correct: true
          },
          {
            label: ',',
            is_correct: false
          },
          {
            label: '&',
            is_correct: false
          }
        ]
      },
      {
        title: 'What does the "echo" function do in PHP?',
        name: 'question7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'It performs mathematical calculations.',
            is_correct: false
          },
          {
            label: 'It outputs text or variables.',
            is_correct: true
          },
          {
            label: 'It generates random numbers.',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which operator is used to check if two values are equal in PHP?',
        name: 'question8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: '==',
            is_correct: true
          },
          {
            label: '===',
            is_correct: false
          },
          {
            label: '=',
            is_correct: false
          },
          {
            label: '!=',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you comment out a single line of code in PHP?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: '// This is a comment',
            is_correct: false
          },
          {
            label: '# This is a comment',
            is_correct: false
          },
          {
            label: '/* This is a comment */',
            is_correct: false
          },
          {
            label: '/* This is a comment',
            is_correct: true
          }
        ]
      },
      {
        title: 'Which PHP function is used to include the contents of one PHP file into another?',
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
