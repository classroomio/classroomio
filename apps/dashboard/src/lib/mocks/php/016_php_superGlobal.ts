import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'PHP Superglobals Quiz',
  description: 'Test your knowledge of PHP superglobals and their usage.',
  questionnaire: {
    questions: [
      {
        title: 'Which superglobal in PHP is used to collect form data after submitting an HTML form?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: '$_POST',
            is_correct: true
          },
          {
            label: '$_GET',
            is_correct: false
          },
          {
            label: '$_REQUEST',
            is_correct: false
          },
          {
            label: '$_SESSION',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which superglobal in PHP is used to read variables from the global scope?',
        name: 'question2',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: '$_POST',
            is_correct: false
          },
          {
            label: '$_GET',
            is_correct: false
          },
          {
            label: '$_REQUEST',
            is_correct: false
          },
          {
            label: '$GLOBALS',
            is_correct: true
          }
        ]
      },
      {
        title: 'What does the superglobal $_SESSION in PHP store?',
        name: 'question3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'User session data',
            is_correct: true
          },
          {
            label: 'Server configuration settings',
            is_correct: false
          },
          {
            label: 'Database connection details',
            is_correct: false
          },
          {
            label: 'Form input data',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which superglobal in PHP is used to retrieve data sent to the server via a URL?',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: '$_POST',
            is_correct: false
          },
          {
            label: '$_GET',
            is_correct: true
          },
          {
            label: '$_REQUEST',
            is_correct: false
          },
          {
            label: '$_SERVER',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the $_COOKIE superglobal in PHP?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To store database records',
            is_correct: false
          },
          {
            label: 'To store session data',
            is_correct: false
          },
          {
            label: 'To store user-specific data on the client side',
            is_correct: true
          },
          {
            label: 'To store form input data',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the $_REQUEST superglobal in PHP?',
        name: 'question6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To retrieve server configuration settings',
            is_correct: false
          },
          {
            label: 'To retrieve data from the client side',
            is_correct: true
          },
          {
            label: 'To store user session data',
            is_correct: false
          },
          {
            label: 'To store form input data',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the $_SERVER superglobal in PHP?',
        name: 'question7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To store user session data',
            is_correct: false
          },
          {
            label: 'To retrieve information about the server environment and request',
            is_correct: true
          },
          {
            label: 'To store form input data',
            is_correct: false
          },
          {
            label: 'To retrieve data from the client side',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the $_ENV superglobal in PHP?',
        name: 'question8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To store user session data',
            is_correct: false
          },
          {
            label: 'To retrieve server configuration settings',
            is_correct: true
          },
          {
            label: 'To store form input data',
            is_correct: false
          },
          {
            label: 'To retrieve data from the client side',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which superglobal in PHP is used to access environment variables?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: '$_SERVER',
            is_correct: false
          },
          {
            label: '$_GET',
            is_correct: false
          },
          {
            label: '$_ENV',
            is_correct: true
          },
          {
            label: '$_POST',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the $_FILES superglobal in PHP?',
        name: 'question10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To store user session data',
            is_correct: false
          },
          {
            label: 'To retrieve server configuration settings',
            is_correct: false
          },
          {
            label: 'To store form input data',
            is_correct: false
          },
          {
            label: 'To handle file uploads from HTML forms',
            is_correct: true
          }
        ]
      }
    ]
  }
};

export default template;
