import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'JavaScript Statements Quiz',
  description: 'Test your knowledge of JavaScript statements.',
  questionnaire: {
    questions: [
      {
        title: 'What is the correct JavaScript syntax for declaring a variable?',
        name: 'q1',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'variable x;',
            is_correct: true
          },
          {
            label: 'var x = 5;',
            is_correct: false
          },
          {
            label: 'int x;',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which statement is used to perform actions based on a condition?',
        name: 'q2',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'if',
            is_correct: true
          },
          {
            label: 'for',
            is_correct: false
          },
          {
            label: 'select',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the result of the following expression: 5 + "2"?',
        name: 'q3',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: '7',
            is_correct: true
          },
          {
            label: '52',
            is_correct: false
          },
          {
            label: 'undefined',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which of the following is a correct way to comment out a single line of code in JavaScript?',
        name: 'q4',
        points: 1,
        order: 4,
        question_type: QuestionTypes[1], // CHECKBOX type
        options: [
          {
            label: '// This is a comment',
            is_correct: true
          },
          {
            label: '/* This is a comment */',
            is_correct: false
          },
          {
            label: '-- This is a comment',
            is_correct: false
          },
          {
            label: '## This is a comment',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "break" statement in a loop?',
        name: 'q5',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'To exit the loop prematurely',
            is_correct: true
          },
          {
            label: 'To continue to the next iteration of the loop',
            is_correct: false
          },
          {
            label: 'To declare a variable',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you define a function in JavaScript?',
        name: 'q6',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'function myFunction()',
            is_correct: true
          },
          {
            label: 'def myFunction():',
            is_correct: false
          },
          {
            label: 'method myFunction():',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which statement is used to stop the execution of a function and return a value?',
        name: 'q7',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'return',
            is_correct: true
          },
          {
            label: 'stop',
            is_correct: false
          },
          {
            label: 'break',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you create a multiline comment in JavaScript?',
        name: 'q8',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: '/* This is a multiline comment */',
            is_correct: true
          },
          {
            label: '// This is a multiline comment',
            is_correct: false
          },
          {
            label: '## This is a multiline comment',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the correct way to write an if statement in JavaScript?',
        name: 'q9',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'if (x == 5) {',
            is_correct: true
          },
          {
            label: 'if x == 5:',
            is_correct: false
          },
          {
            label: 'if x = 5;',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which JavaScript statement is used to declare a variable?',
        name: 'q10',
        points: 1,
        order: 10,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'var',
            is_correct: true
          },
          {
            label: 'int',
            is_correct: false
          },
          {
            label: 'variable',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
