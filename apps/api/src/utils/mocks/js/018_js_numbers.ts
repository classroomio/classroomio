import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'JavaScript Numbers Quiz',
  description: 'Test your knowledge of JavaScript numbers.',
  questionnaire: {
    questions: [
      {
        title: 'Which of the following is a valid way to represent a number in JavaScript?',
        name: 'q1',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: '12345',
            is_correct: true
          },
          {
            label: '"12345"',
            is_correct: false
          },
          {
            label: "'12345'",
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the maximum value for a number in JavaScript?',
        name: 'q2',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Number.MAX_VALUE',
            is_correct: true
          },
          {
            label: 'Infinity',
            is_correct: false
          },
          {
            label: 'There is no maximum value.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the result of dividing by zero in JavaScript?',
        name: 'q3',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Infinity',
            is_correct: true
          },
          {
            label: 'NaN',
            is_correct: false
          },
          {
            label: '0',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the `isNaN()` function in JavaScript?',
        name: 'q4',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'To check if a value is not a number',
            is_correct: true
          },
          {
            label: 'To check if a value is negative',
            is_correct: false
          },
          {
            label: 'To check if a value is infinite',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which of the following represents a floating-point number in JavaScript?',
        name: 'q5',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: '3.14',
            is_correct: true
          },
          {
            label: '42',
            is_correct: false
          },
          {
            label: '0xFF',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the result of the expression `0.1 + 0.2` in JavaScript?',
        name: 'q6',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: '0.3',
            is_correct: false
          },
          {
            label: '0.30000000000000004',
            is_correct: true
          },
          {
            label: '0.2',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the `parseInt()` function in JavaScript?',
        name: 'q7',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'To parse a string and convert it to an integer',
            is_correct: true
          },
          {
            label: 'To round a decimal number to the nearest integer',
            is_correct: false
          },
          {
            label: 'To check if a value is positive',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the result of the expression `Math.random()` in JavaScript?',
        name: 'q8',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'A random number between 0 (inclusive) and 1 (exclusive)',
            is_correct: true
          },
          {
            label: 'A random integer between 0 and 100',
            is_correct: false
          },
          {
            label: 'The value of pi (π)',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the `toFixed()` method in JavaScript?',
        name: 'q9',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'To format a number with a specified number of decimal places',
            is_correct: true
          },
          {
            label: 'To convert a number to a string',
            is_correct: false
          },
          {
            label: 'To round a number to the nearest integer',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the value of `NaN` in JavaScript?',
        name: 'q10',
        points: 1,
        order: 10,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Not-a-Number',
            is_correct: true
          },
          {
            label: 'Zero',
            is_correct: false
          },
          {
            label: 'Infinity',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
