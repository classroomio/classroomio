import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Node.js Email Handling Quiz',
  description: 'Test your knowledge of sending emails in Node.js.',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of sending emails in Node.js applications?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To print messages on the server console.',
            is_correct: false,
          },
          {
            label: 'To send notifications and messages to users via email.',
            is_correct: true,
          },
          {
            label: 'To create HTML documents for the web.',
            is_correct: false,
          },
        ],
      },
      {
        title: 'Which Node.js module is commonly used for sending emails?',
        name: 'question2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'fs',
            is_correct: false,
          },
          {
            label: 'http',
            is_correct: false,
          },
          {
            label: 'nodemailer',
            is_correct: true,
          },
        ],
      },
      {
        title: 'What is the purpose of the "nodemailer" module in Node.js?',
        name: 'question3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'To handle email sending and transport in Node.js.',
            is_correct: true,
          },
          {
            label: 'To create web servers in Node.js.',
            is_correct: false,
          },
          {
            label: 'To manage databases in Node.js applications.',
            is_correct: false,
          },
        ],
      },
      {
        title: 'Explain the difference between SMTP and POP3 in email handling.',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'How can you configure nodemailer to send emails using a Gmail account?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By specifying the SMTP server and credentials.',
            is_correct: true,
          },
          {
            label: 'By using the default settings without any configuration.',
            is_correct: false,
          },
          {
            label: 'By installing additional plugins for nodemailer.',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the purpose of the "transporter" object in nodemailer?',
        name: 'question6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To receive incoming emails.',
            is_correct: false,
          },
          {
            label: 'To configure email transport options.',
            is_correct: true,
          },
          {
            label: 'To send HTTP requests.',
            is_correct: false,
          },
        ],
      },
      {
        title: 'How do you send an email using nodemailer in Node.js?',
        name: 'question7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'By calling the "sendmail" function.',
            is_correct: true,
          },
          {
            label: 'By using the "transporter.sendMail()" method.',
            is_correct: true,
          },
          {
            label: 'By making a POST request to an email API.',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the purpose of the "attachments" option when sending emails with nodemailer?',
        name: 'question8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'To specify the recipient of the email.',
            is_correct: false,
          },
          {
            label: 'To include file attachments in the email.',
            is_correct: true,
          },
          {
            label: 'To set the email subject.',
            is_correct: false,
          },
        ],
      },
      {
        title: 'How can you handle errors when sending emails with nodemailer?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By using try-catch blocks.',
            is_correct: false,
          },
          {
            label: 'By providing a callback function to the "sendMail" method.',
            is_correct: true,
          },
          {
            label: 'By configuring nodemailer to automatically retry sending.',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the purpose of the "from" field when sending emails with nodemailer?',
        name: 'question10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To specify the recipient of the email.',
            is_correct: false,
          },
          {
            label: 'To set the email sender\'s address.',
            is_correct: true,
          },
          {
            label: 'To include file attachments in the email.',
            is_correct: false,
          },
        ],
      },
    ],
  },
};


export default template;
