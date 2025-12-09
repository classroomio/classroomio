import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'Node.js MySQL Database Creation Quiz',
  description: 'Test your knowledge of creating MySQL databases in Node.js.',
  questionnaire: {
    questions: [
      {
        title: 'Why would you use a MySQL database in a Node.js application?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To store and manage data for the application.',
            is_correct: true
          },
          {
            label: 'To display images on the website.',
            is_correct: false
          },
          {
            label: 'To create interactive user interfaces.',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which Node.js module is commonly used to interact with MySQL databases?',
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
            label: 'mysql',
            is_correct: true
          }
        ]
      },
      {
        title: 'What is the purpose of the "mysql.createConnection" method in the mysql module?',
        name: 'question3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'To establish a connection to a MySQL database server.',
            is_correct: true
          },
          {
            label: 'To create a new database.',
            is_correct: false
          },
          {
            label: 'To define a route in an Express.js application.',
            is_correct: false
          }
        ]
      },
      {
        title: 'Explain the purpose of the "query" method in the mysql module.',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you handle errors when connecting to a MySQL database in Node.js?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By using try-catch blocks.',
            is_correct: false
          },
          {
            label: 'By providing a callback function to the connection method.',
            is_correct: true
          },
          {
            label: 'By ignoring errors and proceeding with the connection.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "CREATE DATABASE" SQL statement?',
        name: 'question6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To insert data into a database.',
            is_correct: false
          },
          {
            label: 'To create a new MySQL database.',
            is_correct: true
          },
          {
            label: 'To update existing records in a database.',
            is_correct: false
          }
        ]
      },
      {
        title: 'How can you execute SQL queries in Node.js using the mysql module?',
        name: 'question7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'By calling the "execute" method.',
            is_correct: false
          },
          {
            label: 'By using the "query" method.',
            is_correct: true
          },
          {
            label: 'By sending HTTP requests to a database server.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "DROP DATABASE" SQL statement?',
        name: 'question8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'To retrieve data from a database.',
            is_correct: false
          },
          {
            label: 'To delete an existing MySQL database.',
            is_correct: true
          },
          {
            label: 'To modify the structure of a table.',
            is_correct: false
          }
        ]
      },
      {
        title: 'How can you prevent SQL injection when executing user-provided SQL queries in Node.js?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By using input validation and sanitization.',
            is_correct: true
          },
          {
            label: 'By disabling the execution of user-provided queries.',
            is_correct: false
          },
          {
            label: 'By increasing the database security settings.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "pooling" mechanism in the mysql module?',
        name: 'question10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To group multiple databases together.',
            is_correct: false
          },
          {
            label: 'To efficiently manage and reuse database connections.',
            is_correct: true
          },
          {
            label: 'To create backup copies of the database.',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
