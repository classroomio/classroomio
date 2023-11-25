import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Python Classes Quiz',
  description: 'Test your knowledge of Python classes and object-oriented programming',
  questionnaire: {
    questions: [
      {
        title: 'What is a class in Python?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A blueprint for creating objects', is_correct: true },
          { label: 'A built-in data type', is_correct: false },
          { label: 'A function that returns a value', is_correct: false }
        ]
      },
      {
        title: 'How do you define a class in Python?',
        name: 'question2',
        points: 2,
        order: 1,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'Using the `define` keyword', is_correct: false },
          { label: 'Using the `class` keyword', is_correct: true },
          { label: 'Using the `new` keyword', is_correct: false }
        ]
      },
      {
        title: 'What is an object in object-oriented programming?',
        name: 'question3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A function in a class', is_correct: false },
          { label: 'An instance of a class', is_correct: true },
          { label: 'A global variable', is_correct: false }
        ]
      },
      {
        title: 'Explain the concept of inheritance in Python classes.',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is a constructor method in a Python class?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A method that constructs objects', is_correct: false },
          { label: 'A special method that initializes objects', is_correct: true },
          { label: 'A method for destroying objects', is_correct: false }
        ]
      },
      {
        title: 'How do you create an instance of a class in Python?',
        name: 'question6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Using the `new` keyword', is_correct: false },
          { label: 'By calling the class name as a function', is_correct: true },
          { label: 'Using the `create` method', is_correct: false }
        ]
      },
      {
        title: 'Explain the concept of encapsulation in Python classes.',
        name: 'question7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is method overriding in Python classes?',
        name: 'question8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Changing the class name', is_correct: false },
          { label: 'Creating a new class', is_correct: false },
          {
            label: 'Providing a new implementation for a parent class method in a child class',
            is_correct: true
          }
        ]
      },
      {
        title: 'What is the purpose of the `self` parameter in Python class methods?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'It is a reserved keyword and cannot be used as a parameter',
            is_correct: false
          },
          {
            label:
              'It refers to the instance of the class and is used to access its attributes and methods',
            is_correct: true
          },
          { label: 'It is used to pass parameters to the class constructor', is_correct: false }
        ]
      },
      {
        title: 'Explain the concept of a class variable in Python.',
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
