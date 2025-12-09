import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'JavaScript Comments Quiz',
  description: 'Test your knowledge of JavaScript comments.',
  questionnaire: {
    questions: [
      {
        title: 'What is the correct way to add a single-line comment in JavaScript?',
        name: 'q1',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: '// This is a comment',
            is_correct: true
          },
          {
            label: '-- This is a comment',
            is_correct: false
          },
          {
            label: '# This is a comment',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you add a multi-line comment in JavaScript?',
        name: 'q2',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: '/* This is a multi-line comment */',
            is_correct: true
          },
          {
            label: '// This is a multi-line comment',
            is_correct: false
          },
          {
            label: '-- This is a multi-line comment',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which of the following is NOT a valid comment syntax in JavaScript?',
        name: 'q3',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: '/? This is a comment',
            is_correct: false
          },
          {
            label: '/* This is a comment',
            is_correct: false
          },
          {
            label: '// This is a comment',
            is_correct: true
          }
        ]
      },
      {
        title: 'What is the purpose of comments in JavaScript?',
        name: 'q4',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'To provide explanations and make the code more readable',
            is_correct: true
          },
          {
            label: 'To hide code from other developers',
            is_correct: false
          },
          {
            label: 'To execute code',
            is_correct: false
          }
        ]
      },
      {
        title: 'Can comments be nested in JavaScript?',
        name: 'q5',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Yes',
            is_correct: true
          },
          {
            label: 'No',
            is_correct: false
          }
        ]
      },
      {
        title: "What happens to comments in JavaScript code when it's executed by a browser?",
        name: 'q6',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Comments are ignored and not executed',
            is_correct: true
          },
          {
            label: 'Comments cause errors in the code',
            is_correct: false
          },
          {
            label: 'Comments are executed like regular code',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of commenting out code in JavaScript?',
        name: 'q7',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'To temporarily disable code',
            is_correct: true
          },
          {
            label: 'To hide code from other developers',
            is_correct: false
          },
          {
            label: 'To improve code performance',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which comment style is recommended for adding documentation comments in JavaScript?',
        name: 'q8',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'JSDoc style (/** ... */)',
            is_correct: true
          },
          {
            label: 'Single-line style (// ...)',
            is_correct: false
          },
          {
            label: 'Block comment style (/* ... */)',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "debugger" statement in JavaScript code?',
        name: 'q9',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'To pause code execution and open the browser debugger',
            is_correct: true
          },
          {
            label: 'To generate debugging logs',
            is_correct: false
          },
          {
            label: 'To display a message in the console',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which of the following is NOT a recommended use of comments in JavaScript?',
        name: 'q10',
        points: 1,
        order: 10,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Adding explanations to code',
            is_correct: false
          },
          {
            label: 'Hiding code from other developers',
            is_correct: true
          },
          {
            label: 'Documenting functions and APIs',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
