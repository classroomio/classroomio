import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'TypeScript Classes Quiz',
  description: 'Test your knowledge of TypeScript classes!',
  questionnaire: {
    questions: [
      {
        title: 'What is a class in TypeScript?',
        name: 'q1',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A data structure', is_correct: false },
          { label: 'A blueprint for creating objects', is_correct: true },
          { label: 'A function', is_correct: false }
        ]
      },
      {
        title: 'How do you define a class in TypeScript?',
        name: 'q2',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'class MyClass {}', is_correct: true },
          { label: 'interface MyClass {}', is_correct: false },
          { label: 'type MyClass = {};', is_correct: false }
        ]
      },
      {
        title: 'What is the keyword used to create an instance of a class in TypeScript?',
        name: 'q3',
        points: 2,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'new', is_correct: true },
          { label: 'instance', is_correct: false },
          { label: 'create', is_correct: false }
        ]
      },
      {
        title: 'How do you define a constructor in a TypeScript class?',
        name: 'q4',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'constructor()', is_correct: true },
          { label: 'init()', is_correct: false },
          { label: 'create()', is_correct: false }
        ]
      },
      {
        title: 'In TypeScript, can a class inherit from multiple classes?',
        name: 'q5',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Yes', is_correct: true },
          { label: 'No', is_correct: false }
        ]
      },
      {
        title: 'What is the purpose of the "super" keyword in a subclass constructor?',
        name: 'q6',
        points: 2,
        order: 6,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'To call the constructor of the superclass', is_correct: true },
          { label: 'To create a new instance of the superclass', is_correct: false },
          { label: 'To access static methods of the superclass', is_correct: false }
        ]
      },
      {
        title: 'How do you mark a class property as private in TypeScript?',
        name: 'q7',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'private property;', is_correct: false },
          { label: 'public property;', is_correct: false },
          { label: 'private property: type;', is_correct: true }
        ]
      },
      {
        title: 'What is the purpose of the "protected" keyword for class members?',
        name: 'q8',
        points: 2,
        order: 8,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'To make members accessible only within the class', is_correct: false },
          { label: 'To make members accessible within subclasses', is_correct: true },
          { label: 'To make members accessible globally', is_correct: false }
        ]
      },
      {
        title: 'What is the difference between an abstract class and a regular class in TypeScript?',
        name: 'q9',
        points: 2,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Abstract classes cannot have constructors', is_correct: false },
          { label: 'Abstract classes cannot be instantiated directly', is_correct: true },
          { label: 'Regular classes cannot have methods', is_correct: false }
        ]
      },
      {
        title: 'How do you define an abstract method in a TypeScript abstract class?',
        name: 'q10',
        points: 2,
        order: 10,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'abstract method();', is_correct: true },
          { label: 'virtual method();', is_correct: false },
          { label: 'function method();', is_correct: false }
        ]
      }
    ]
  }
};

export default template;
