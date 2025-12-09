import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'Node.js URL Handling Quiz',
  description: 'Test your knowledge of Node.js URL handling.',
  questionnaire: {
    questions: [
      {
        title: 'What is the primary purpose of the "url" module in Node.js?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To parse and manipulate URLs.',
            is_correct: true
          },
          {
            label: 'To make HTTP requests.',
            is_correct: false
          },
          {
            label: 'To create dynamic web pages.',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which method is used to parse a URL string in Node.js?',
        name: 'question2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'parseURL()',
            is_correct: false
          },
          {
            label: 'url.parse()',
            is_correct: true
          },
          {
            label: 'decodeURI()',
            is_correct: false
          }
        ]
      },
      {
        title: 'What information can you extract from a parsed URL object in Node.js?',
        name: 'question3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'Host and port',
            is_correct: true
          },
          {
            label: 'Query parameters',
            is_correct: true
          },
          {
            label: 'HTTP request method',
            is_correct: false
          }
        ]
      },
      {
        title: 'Explain the difference between "pathname" and "path" in a URL object.',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you create a URL object in Node.js?',
        name: 'question5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Using the "url.create()" method.',
            is_correct: false
          },
          {
            label: 'By directly instantiating the URL class.',
            is_correct: false
          },
          {
            label: 'Using the "url.parse()" method.',
            is_correct: false
          },
          {
            label: 'By importing it from the "url" module.',
            is_correct: true
          }
        ]
      },
      {
        title: 'What is the purpose of the "querystring" module in Node.js URL handling?',
        name: 'question6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To parse and manipulate query strings in URLs.',
            is_correct: true
          },
          {
            label: 'To create new URLs from scratch.',
            is_correct: false
          },
          {
            label: 'To perform HTTP requests.',
            is_correct: false
          }
        ]
      },
      {
        title: 'How can you extract query parameters from a URL in Node.js using the "querystring" module?',
        name: 'question7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'Using the "parse()" method of the "querystring" module.',
            is_correct: true
          },
          {
            label: 'Accessing the "query" property of the URL object.',
            is_correct: false
          },
          {
            label: 'By splitting the URL string using a delimiter.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What does the "format()" method of the URL object in Node.js do?',
        name: 'question8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'It serializes a URL object back to a URL string.',
            is_correct: true
          },
          {
            label: 'It decodes a URL string.',
            is_correct: false
          },
          {
            label: 'It parses a query string into an object.',
            is_correct: false
          }
        ]
      },
      {
        title: 'In Node.js, which module is commonly used for making HTTP requests?',
        name: 'question9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'fs',
            is_correct: false
          },
          {
            label: 'http',
            is_correct: true
          },
          {
            label: 'url',
            is_correct: false
          }
        ]
      },
      {
        title: 'How can you include the "http" module in your Node.js application?',
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
