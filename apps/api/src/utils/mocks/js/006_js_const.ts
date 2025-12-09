import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'JavaScript "const" Quiz',
  description: 'Test your knowledge of the "const" keyword in JavaScript.',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of the "const" keyword in JavaScript?',
        name: 'q1',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'To declare constants with block scope',
            is_correct: false
          },
          {
            label: 'To declare constants with function scope',
            is_correct: false
          },
          {
            label: 'To declare constants with block scope that cannot be reassigned',
            is_correct: true
          }
        ]
      },
      {
        title: 'Can you reassign a variable declared with "const"?',
        name: 'q2',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Yes, you can reassign it',
            is_correct: false
          },
          {
            label: 'No, it cannot be reassigned',
            is_correct: true
          }
        ]
      },
      {
        title: 'What happens if you try to reassign a "const" variable?',
        name: 'q3',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'It will result in a ReferenceError',
            is_correct: true
          },
          {
            label: 'It will reassign the variable without an error',
            is_correct: false
          },
          {
            label: 'It will throw a TypeError',
            is_correct: false
          }
        ]
      },
      {
        title: 'When should you use the "const" keyword in JavaScript?',
        name: 'q4',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'For variables that will be reassigned frequently',
            is_correct: false
          },
          {
            label: 'For variables that should not be reassigned',
            is_correct: true
          },
          {
            label: 'For all variables in your code',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which of the following is true about "const" variables?',
        name: 'q5',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'They have block scope',
            is_correct: false
          },
          {
            label: 'They have function scope',
            is_correct: false
          },
          {
            label: 'They have block scope and cannot be reassigned',
            is_correct: true
          }
        ]
      },
      {
        title: 'Can you declare a "const" variable without initializing it?',
        name: 'q6',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'No, you must initialize it when declaring',
            is_correct: true
          },
          {
            label: 'Yes, it will have an initial value of undefined',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the initial value of a "const" variable?',
        name: 'q7',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Undefined',
            is_correct: false
          },
          {
            label: '0',
            is_correct: false
          },
          {
            label: 'null',
            is_correct: false
          },
          {
            label: 'It must be initialized with a value',
            is_correct: true
          }
        ]
      },
      {
        title: 'In which ECMAScript version was "const" introduced?',
        name: 'q8',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'ES6 (ECMAScript 2015)',
            is_correct: true
          },
          {
            label: 'ES5 (ECMAScript 2009)',
            is_correct: false
          },
          {
            label: 'ES7 (ECMAScript 2016)',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the scoping behavior of "const" variables?',
        name: 'q9',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'They have block scope',
            is_correct: true
          },
          {
            label: 'They have global scope',
            is_correct: false
          },
          {
            label: 'They have function scope',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which of the following is NOT a valid way to declare a "const" variable?',
        name: 'q10',
        points: 1,
        order: 10,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'const myVar = 10;',
            is_correct: false
          },
          {
            label: 'const myVar;',
            is_correct: true
          },
          {
            label: 'const myVar = "Hello";',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
