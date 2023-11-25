import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Node.js MySQL Data Selection Quiz',
  description: 'Test your knowledge of selecting data from MySQL databases in Node.js.',
  questionnaire: {
    questions: [
      {
        title:
          'What is the purpose of selecting data from a MySQL database in a Node.js application?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To update existing records in the database.',
            is_correct: false
          },
          {
            label: 'To retrieve and display data from the database.',
            is_correct: true
          },
          {
            label: 'To create new tables in the database.',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which SQL statement is used to select data from a MySQL table?',
        name: 'question2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'INSERT',
            is_correct: false
          },
          {
            label: 'SELECT',
            is_correct: true
          },
          {
            label: 'DELETE',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "WHERE" clause in a SQL SELECT statement?',
        name: 'question3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'To specify which columns to select from the table.',
            is_correct: false
          },
          {
            label: 'To filter rows based on a specified condition.',
            is_correct: true
          },
          {
            label: 'To order the selected rows in ascending order.',
            is_correct: false
          }
        ]
      },
      {
        title: 'Explain the purpose of the "LIMIT" clause in a SQL SELECT statement.',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you perform a join operation between two MySQL tables in Node.js?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By using the "JOIN" clause in the SQL SELECT statement.',
            is_correct: true
          },
          {
            label: 'By creating a new table that combines the data from both tables.',
            is_correct: false
          },
          {
            label: 'By using the "DELETE" statement to merge data.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "GROUP BY" clause in a SQL SELECT statement?',
        name: 'question6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To select all columns in the table.',
            is_correct: false
          },
          {
            label: 'To group rows with the same values in specified columns.',
            is_correct: true
          },
          {
            label: 'To order rows in descending order.',
            is_correct: false
          }
        ]
      },
      {
        title:
          'How do you handle asynchronous data retrieval when selecting data from a MySQL database in Node.js?',
        name: 'question7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'By using synchronous functions.',
            is_correct: false
          },
          {
            label: 'By using callbacks or promises.',
            is_correct: true
          },
          {
            label: 'By executing SQL statements in a loop.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "ORDER BY" clause in a SQL SELECT statement?',
        name: 'question8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'To filter rows based on a specified condition.',
            is_correct: false
          },
          {
            label: 'To order the selected rows based on one or more columns.',
            is_correct: true
          },
          {
            label: 'To limit the number of rows returned by the query.',
            is_correct: false
          }
        ]
      },
      {
        title: 'How can you select distinct values from a column in a SQL SELECT statement?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By using the "DISTINCT" keyword.',
            is_correct: true
          },
          {
            label: 'By using the "WHERE" clause.',
            is_correct: false
          },
          {
            label: 'By using the "LIMIT" clause.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "HAVING" clause in a SQL SELECT statement?',
        name: 'question10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To specify the columns to select from the table.',
            is_correct: false
          },
          {
            label: 'To filter groups of rows based on a condition.',
            is_correct: true
          },
          {
            label: 'To order rows in ascending order.',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
