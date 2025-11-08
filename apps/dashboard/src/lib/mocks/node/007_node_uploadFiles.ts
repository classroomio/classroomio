import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Node.js File Upload Quiz',
  description: 'Test your knowledge of uploading files in Node.js.',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of file uploading in Node.js applications?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To download files from the internet.',
            is_correct: false
          },
          {
            label: 'To allow users to upload files to the server.',
            is_correct: true
          },
          {
            label: 'To generate random files on the server.',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which module in Node.js is commonly used for handling file uploads?',
        name: 'question2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'fs',
            is_correct: false
          },
          {
            label: 'http',
            is_correct: false
          },
          {
            label: 'express',
            is_correct: true
          }
        ]
      },
      {
        title: 'What is the purpose of the "multer" middleware in Express.js?',
        name: 'question3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'To handle file uploads in a convenient way.',
            is_correct: true
          },
          {
            label: 'To serve static files from a directory.',
            is_correct: false
          },
          {
            label: 'To create and manipulate files on the server.',
            is_correct: false
          }
        ]
      },
      {
        title: 'Explain the difference between synchronous and asynchronous file uploads.',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you restrict the types of files that users can upload in an Express.js application?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By using the "fileType" option in Multer.',
            is_correct: true
          },
          {
            label: 'By disabling file uploads altogether.',
            is_correct: false
          },
          {
            label: 'By configuring the Express.js routes.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "single" method in Multer?',
        name: 'question6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To handle multiple file uploads at once.',
            is_correct: false
          },
          {
            label: 'To handle a single file upload.',
            is_correct: true
          },
          {
            label: 'To handle text input fields.',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you access the uploaded file in your Express.js route handler?',
        name: 'question7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'By using the "req.files" object provided by Multer.',
            is_correct: true
          },
          {
            label: 'By using the "req.body" object.',
            is_correct: false
          },
          {
            label: 'By sending a separate HTTP request to retrieve it.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "destination" option in Multer?',
        name: 'question8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'To specify the folder where uploaded files will be saved.',
            is_correct: true
          },
          {
            label: 'To limit the maximum file size of uploads.',
            is_correct: false
          },
          {
            label: 'To define custom validation rules for uploaded files.',
            is_correct: false
          }
        ]
      },
      {
        title: 'How can you handle errors during file uploads in an Express.js route?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By using try-catch blocks.',
            is_correct: false
          },
          {
            label: 'By passing an error-handling middleware to the route.',
            is_correct: true
          },
          {
            label: 'By ignoring errors and continuing the upload process.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "file.fieldname" property in the uploaded file object?',
        name: 'question10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To identify the original field name of the file input.',
            is_correct: true
          },
          {
            label: 'To store the binary content of the uploaded file.',
            is_correct: false
          },
          {
            label: 'To specify the destination folder for file storage.',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
