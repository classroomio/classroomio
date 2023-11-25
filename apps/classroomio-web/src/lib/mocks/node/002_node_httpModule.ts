import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Node.js HTTP Quiz',
  description: 'Test your knowledge of Node.js HTTP module from W3Schools',
  questionnaire: {
    questions: [
      {
        title: 'What is the primary use of the Node.js HTTP module?',
        name: 'q1',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Handling HTTP requests and responses', is_correct: true },
          { label: 'Creating file streams', is_correct: false },
          { label: 'Database operations', is_correct: false }
        ]
      },
      {
        title: 'Which HTTP method is used to request data from a server?',
        name: 'q2',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'POST', is_correct: false },
          { label: 'GET', is_correct: true },
          { label: 'PUT', is_correct: false }
        ]
      },
      {
        title: 'What does the HTTP response status code 404 indicate?',
        name: 'q3',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'OK', is_correct: false },
          { label: 'Not Found', is_correct: true },
          { label: 'Server Error', is_correct: false }
        ]
      },
      {
        title: 'Which of the following is a valid HTTP request header?',
        name: 'q4',
        points: 1,
        order: 4,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'Content-Type', is_correct: true },
          { label: 'Authorization', is_correct: true },
          { label: 'User-Agent', is_correct: false },
          { label: 'Cache-Control', is_correct: true }
        ]
      },
      {
        title: 'Explain the purpose of a query string in a URL.',
        name: 'q5',
        points: 2,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the purpose of the "http" module in Node.js?',
        name: 'q6',
        points: 2,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Which method in the "http" module is used to create an HTTP server?',
        name: 'q7',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'http.createServer()', is_correct: true },
          { label: 'http.request()', is_correct: false },
          { label: 'http.listen()', is_correct: false }
        ]
      },
      {
        title:
          'What is the purpose of the "request" and "response" objects in an HTTP server callback?',
        name: 'q8',
        points: 2,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Which HTTP method is used to send data to the server for processing?',
        name: 'q9',
        points: 2,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'POST', is_correct: true },
          { label: 'GET', is_correct: false },
          { label: 'PUT', is_correct: false }
        ]
      },
      {
        title: 'What is the purpose of the "querystring" module in Node.js?',
        name: 'q10',
        points: 2,
        order: 10,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'Parsing and formatting URL query strings', is_correct: true },
          { label: 'Handling HTTP headers', is_correct: false },
          { label: 'Creating HTML templates', is_correct: false }
        ]
      }
    ]
  }
};

export default template;
