import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Python Conditions Quiz',
  description: 'Test your knowledge of Python conditions',
  questionnaire: {
    questions: [
      {
        title: 'What is a Python if statement used for?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Looping', is_correct: false },
          { label: 'Making decisions', is_correct: true },
          { label: 'Defining functions', is_correct: false }
        ]
      },
      {
        title: 'How do you write an if statement in Python?',
        name: 'question2',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'if x > 5', is_correct: true },
          { label: 'if x < 5:', is_correct: false },
          { label: 'if (x > 5) {', is_correct: false }
        ]
      },
      {
        title: 'Which of the following is a valid Python if statement?',
        name: 'question3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'if x > 5:', is_correct: true },
          { label: 'if x < 10:', is_correct: true },
          { label: 'if x == 7', is_correct: false }
        ]
      },
      {
        title: 'Explain the concept of boolean expressions in Python conditions.',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How do you use the "else" statement in Python?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'As a replacement for "if"', is_correct: false },
          { label: 'To define a function', is_correct: false },
          { label: 'To execute code if the "if" statement is false', is_correct: true }
        ]
      },
      {
        title: 'What is the result of (5 > 3) and (10 > 7) in Python?',
        name: 'question6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'True', is_correct: true },
          { label: 'False', is_correct: false },
          { label: '1', is_correct: false }
        ]
      },
      {
        title: 'Explain the concept of "elif" in Python conditions.',
        name: 'question7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How do you use the "or" operator in Python conditions?',
        name: 'question8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To combine conditions that must both be true', is_correct: false },
          { label: 'To combine conditions where at least one must be true', is_correct: true },
          { label: 'To exclude conditions', is_correct: false }
        ]
      },
      {
        title: 'What is the result of not(True) in Python?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'True', is_correct: false },
          { label: 'False', is_correct: true },
          { label: 'None', is_correct: false }
        ]
      },
      {
        title: 'Explain the concept of nested if statements in Python.',
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
