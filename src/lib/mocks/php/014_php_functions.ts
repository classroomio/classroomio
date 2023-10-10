import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'PHP Functions Quiz',
  description: 'Test your knowledge of PHP functions and their usage.',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of a PHP function?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To define a variable',
            is_correct: false,
          },
          {
            label: 'To execute a block of code when called',
            is_correct: true,
          },
          {
            label: 'To perform mathematical operations',
            is_correct: false,
          },
          {
            label: 'To display a message',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the correct syntax for defining a PHP function?',
        name: 'question2',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'function myFunction() { }',
            is_correct: true,
          },
          {
            label: 'def myFunction():',
            is_correct: false,
          },
          {
            label: 'func myFunction { }',
            is_correct: false,
          },
          {
            label: 'void myFunction() { }',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is a parameter in a PHP function?',
        name: 'question3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'A value that is returned by the function',
            is_correct: false,
          },
          {
            label: 'A variable used to store the function name',
            is_correct: false,
          },
          {
            label: 'A value passed into the function when it is called',
            is_correct: true,
          },
          {
            label: 'A variable that is declared inside the function',
            is_correct: false,
          },
        ],
      },
      {
        title: 'How do you call a PHP function named "myFunction"?',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'call myFunction()',
            is_correct: false,
          },
          {
            label: 'myFunction;',
            is_correct: false,
          },
          {
            label: 'myFunction();',
            is_correct: true,
          },
          {
            label: 'execute myFunction;',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the purpose of the `return` statement in a PHP function?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To define a variable',
            is_correct: false,
          },
          {
            label: 'To exit the function and return a value',
            is_correct: true,
          },
          {
            label: 'To print a message to the console',
            is_correct: false,
          },
          {
            label: 'To declare a function',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the purpose of function parameters?',
        name: 'question6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To store global variables',
            is_correct: false,
          },
          {
            label: 'To define the function name',
            is_correct: false,
          },
          {
            label: 'To provide input values to the function',
            is_correct: true,
          },
          {
            label: 'To print output values',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What does the `global` keyword do in PHP?',
        name: 'question7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Declares a function as global',
            is_correct: false,
          },
          {
            label: 'Defines a global variable',
            is_correct: true,
          },
          {
            label: 'Specifies the function scope',
            is_correct: false,
          },
          {
            label: 'Prints a message to the screen',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the purpose of a PHP built-in function?',
        name: 'question8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To define a user-defined function',
            is_correct: false,
          },
          {
            label: 'To create a new variable',
            is_correct: false,
          },
          {
            label: 'To perform common tasks without writing custom code',
            is_correct: true,
          },
          {
            label: 'To declare a class',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the purpose of the `strlen()` function in PHP?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To calculate the square root of a number',
            is_correct: false,
          },
          {
            label: 'To check if a variable is empty',
            is_correct: false,
          },
          {
            label: 'To count the number of characters in a string',
            is_correct: true,
          },
          {
            label: 'To convert a string to lowercase',
            is_correct: false,
          },
        ],
      },
      {
        title: 'How do you define a default value for a function parameter in PHP?',
        name: 'question10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By using the `default` keyword',
            is_correct: false,
          },
          {
            label: 'By specifying the default value in the function declaration',
            is_correct: true,
          },
          {
            label: 'By using the `value` keyword',
            is_correct: false,
          },
          {
            label: 'Default values are not supported in PHP',
            is_correct: false,
          },
        ],
      },
    ],
  },
};

export default template;
