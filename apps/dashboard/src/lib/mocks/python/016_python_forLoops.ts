import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Python For Loops Quiz',
  description: 'Test your knowledge of Python for loops',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of a for loop in Python?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Iterating over a range of values', is_correct: false },
          { label: 'Repeating a block of code a specific number of times', is_correct: true },
          { label: 'Defining a function', is_correct: false }
        ]
      },
      {
        title: 'How do you write a simple for loop in Python?',
        name: 'question2',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'for (x < 10):', is_correct: false },
          { label: 'for condition:', is_correct: false },
          { label: 'for x in range(5):', is_correct: true }
        ]
      },
      {
        title: 'Which of the following statements is true about the "break" statement in a for loop?',
        name: 'question3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'It is used to exit the current loop', is_correct: true },
          { label: 'It is used to define a new variable', is_correct: false },
          { label: 'It is used to skip the next iteration of the loop', is_correct: false }
        ]
      },
      {
        title: 'Explain the concept of an infinite loop in Python for loops.',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the result of using "continue" in a for loop in Python?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Exit the loop', is_correct: false },
          { label: 'Skip the current iteration and continue with the next', is_correct: true },
          { label: 'Re-run the loop from the beginning', is_correct: false }
        ]
      },
      {
        title: 'What is the purpose of the "else" statement in a for loop?',
        name: 'question6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'As a replacement for "if"', is_correct: false },
          { label: 'To execute code if the loop completes without a "break"', is_correct: true },
          { label: 'To define a function', is_correct: false }
        ]
      },
      {
        title: 'Explain the concept of "nested for loops" in Python.',
        name: 'question7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How do you use the "while" loop in Python?',
        name: 'question8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To create an infinite loop', is_correct: false },
          { label: 'To iterate over a sequence of items', is_correct: false },
          { label: 'To execute code while a condition is true', is_correct: true }
        ]
      },
      {
        title: 'What is the result of "range(3)" in a while loop in Python?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '0, 1, 2', is_correct: true },
          { label: '3, 6, 9', is_correct: false },
          { label: '1, 2, 3', is_correct: false }
        ]
      },
      {
        title: 'Explain the concept of "loop control statements" in Python.',
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
