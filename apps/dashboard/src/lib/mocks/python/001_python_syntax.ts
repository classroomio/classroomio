import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Python Syntax Quiz',
  description: 'Test your knowledge of Python syntax',
  questionnaire: {
    questions: [
      {
        title: 'What is Python used for?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Web development', is_correct: false },
          { label: 'Data analysis', is_correct: false },
          { label: 'All of the above', is_correct: true }
        ]
      },
      {
        title: 'What symbol is used for comments in Python?',
        name: 'question2',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '#', is_correct: true },
          { label: '//', is_correct: false },
          { label: '--', is_correct: false }
        ]
      },
      {
        title: 'How do you declare a variable in Python?',
        name: 'question3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'var x;', is_correct: false },
          { label: 'let x;', is_correct: false },
          { label: 'x = 5', is_correct: true }
        ]
      },
      {
        title: 'What is the correct way to print "Hello, World!" in Python?',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'print("Hello, World!")', is_correct: true },
          { label: 'echo("Hello, World!")', is_correct: false },
          { label: 'console.log("Hello, World!")', is_correct: false },
          { label: 'System.out.println("Hello, World!")', is_correct: false }
        ]
      },
      {
        title: 'Explain the purpose of "if" statements in Python.',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the correct way to define a function in Python?',
        name: 'question6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'function myFunction():', is_correct: false },
          { label: 'def myFunction():', is_correct: true },
          { label: 'method myFunction():', is_correct: false }
        ]
      },
      {
        title: 'Which operator is used for exponentiation in Python?',
        name: 'question7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '^', is_correct: false },
          { label: '**', is_correct: true },
          { label: '^^', is_correct: false }
        ]
      },
      {
        title: 'What is the correct way to create a list in Python?',
        name: 'question8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '[1, 2, 3]', is_correct: true },
          { label: '(1, 2, 3)', is_correct: false },
          { label: '{1, 2, 3}', is_correct: false }
        ]
      },
      {
        title: 'Explain the purpose of "for" loops in Python.',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How do you check the length of a list in Python?',
        name: 'question10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'len(myList)', is_correct: true },
          { label: 'myList.length', is_correct: false },
          { label: 'size(myList)', is_correct: false }
        ]
      }
    ]
  }
};

export default template;
