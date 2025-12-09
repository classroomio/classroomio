import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'Node.js MySQL Data Insertion Quiz',
  description: 'Test your knowledge of inserting data into MySQL databases in Node.js.',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of inserting data into a MySQL database in a Node.js application?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To display images on the website.',
            is_correct: false
          },
          {
            label: 'To store and manage data in the database.',
            is_correct: true
          },
          {
            label: 'To create interactive user interfaces.',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which SQL statement is used to insert data into a MySQL table?',
        name: 'question2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'UPDATE',
            is_correct: false
          },
          {
            label: 'INSERT',
            is_correct: true
          },
          {
            label: 'DELETE',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of prepared statements when inserting data into a MySQL database?',
        name: 'question3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'To improve code readability.',
            is_correct: false
          },
          {
            label: 'To prevent SQL injection attacks.',
            is_correct: true
          },
          {
            label: 'To define the table structure.',
            is_correct: false
          }
        ]
      },
      {
        title: 'Explain the difference between synchronous and asynchronous data insertion in Node.js.',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you handle errors when inserting data into a MySQL database in Node.js?',
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
            label: 'By providing a callback function to the insertion method.',
            is_correct: true
          },
          {
            label: 'By ignoring errors and proceeding with the insertion.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "INSERT INTO" SQL statement?',
        name: 'question6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To update existing records in a table.',
            is_correct: false
          },
          {
            label: 'To insert new rows of data into a table.',
            is_correct: true
          },
          {
            label: 'To delete data from a table.',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you insert data into a MySQL database in Node.js using prepared statements?',
        name: 'question7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'By using the "VALUES" clause in the SQL statement.',
            is_correct: true
          },
          {
            label: 'By directly concatenating user input into the SQL query.',
            is_correct: false
          },
          {
            label: 'By passing placeholders and values as an array to the prepared statement.',
            is_correct: true
          }
        ]
      },
      {
        title: 'What is the purpose of the "LAST_INSERT_ID()" function in MySQL?',
        name: 'question8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'To retrieve the ID of the last inserted row in a table.',
            is_correct: true
          },
          {
            label: 'To delete the last inserted row in a table.',
            is_correct: false
          },
          {
            label: 'To update the last inserted row in a table.',
            is_correct: false
          }
        ]
      },
      {
        title: 'How can you insert multiple rows of data into a MySQL table in a single query?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By executing multiple "INSERT INTO" statements.',
            is_correct: false
          },
          {
            label: 'By using a single "INSERT INTO" statement with multiple value sets.',
            is_correct: true
          },
          {
            label: 'By creating multiple prepared statements.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "ON DUPLICATE KEY UPDATE" clause in an "INSERT INTO" statement?',
        name: 'question10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To create a new table if the data already exists.',
            is_correct: false
          },
          {
            label: 'To update existing rows if there is a duplicate key.',
            is_correct: true
          },
          {
            label: 'To prevent inserting duplicate data into the table.',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
