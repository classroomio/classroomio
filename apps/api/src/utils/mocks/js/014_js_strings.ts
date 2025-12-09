import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'JavaScript Strings Quiz',
  description: 'Test your knowledge of JavaScript strings.',
  questionnaire: {
    questions: [
      {
        title: 'What is a string in JavaScript?',
        name: 'q1',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'A sequence of characters enclosed in double quotes',
            is_correct: true
          },
          {
            label: 'A numeric data type',
            is_correct: false
          },
          {
            label: 'A Boolean data type',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you declare a string variable in JavaScript?',
        name: 'q2',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'string x = "Hello";',
            is_correct: false
          },
          {
            label: 'var x = "Hello";',
            is_correct: true
          },
          {
            label: 'let x = "Hello";',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which method is used to find the length of a string in JavaScript?',
        name: 'q3',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'length()',
            is_correct: false
          },
          {
            label: 'size()',
            is_correct: false
          },
          {
            label: 'length',
            is_correct: true
          }
        ]
      },
      {
        title: 'What is the result of "Hello" + "World" in JavaScript?',
        name: 'q4',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Hello',
            is_correct: false
          },
          {
            label: 'World',
            is_correct: false
          },
          {
            label: 'HelloWorld',
            is_correct: true
          }
        ]
      },
      {
        title: 'Which method is used to convert a string to lowercase in JavaScript?',
        name: 'q5',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'toLowerCase()',
            is_correct: true
          },
          {
            label: 'toLowercase()',
            is_correct: false
          },
          {
            label: 'lowerCase()',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the index of the first occurrence of "world" in the string "Hello world"?',
        name: 'q6',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: '0',
            is_correct: false
          },
          {
            label: '5',
            is_correct: true
          },
          {
            label: '6',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which method is used to extract a part of a string in JavaScript?',
        name: 'q7',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'substring()',
            is_correct: true
          },
          {
            label: 'slice()',
            is_correct: false
          },
          {
            label: 'splice()',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the escape character in JavaScript?',
        name: 'q8',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: '\\',
            is_correct: true
          },
          {
            label: '/',
            is_correct: false
          },
          {
            label: '!',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which of the following is NOT a valid method to manipulate strings in JavaScript?',
        name: 'q9',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'toUpperCase()',
            is_correct: false
          },
          {
            label: 'replace()',
            is_correct: false
          },
          {
            label: 'split()',
            is_correct: true
          }
        ]
      },
      {
        title: 'What is the result of the expression 10 + "20" in JavaScript?',
        name: 'q10',
        points: 1,
        order: 10,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: '1020',
            is_correct: true
          },
          {
            label: '30',
            is_correct: false
          },
          {
            label: 'Error',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
