import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Node.js MySQL Table Creation Quiz',
  description: 'Test your knowledge of creating MySQL tables in Node.js.',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of creating tables in a MySQL database?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To store and organize data in a structured format.',
            is_correct: true,
          },
          {
            label: 'To display images on the website.',
            is_correct: false,
          },
          {
            label: 'To create HTML documents for the web.',
            is_correct: false,
          },
        ],
      },
      {
        title: 'Which SQL statement is used to create a new table in a MySQL database?',
        name: 'question2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'INSERT TABLE',
            is_correct: false,
          },
          {
            label: 'CREATE TABLE',
            is_correct: true,
          },
          {
            label: 'ADD TABLE',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the purpose of the "AUTO_INCREMENT" attribute in a MySQL table?',
        name: 'question3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'To automatically insert data into the table.',
            is_correct: false,
          },
          {
            label: 'To generate unique values for a column when inserting data.',
            is_correct: true,
          },
          {
            label: 'To sort data in the table in ascending order.',
            is_correct: false,
          },
        ],
      },
      {
        title: 'Explain the purpose of primary keys in MySQL tables.',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'What is the purpose of the "FOREIGN KEY" constraint in MySQL tables?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To restrict access to the table.',
            is_correct: false,
          },
          {
            label: 'To enforce referential integrity between tables.',
            is_correct: true,
          },
          {
            label: 'To define the primary key of the table.',
            is_correct: false,
          },
        ],
      },
      {
        title: 'How do you add a new column to an existing MySQL table?',
        name: 'question6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By using the "ALTER TABLE" statement.',
            is_correct: true,
          },
          {
            label: 'By creating a new table and copying the data.',
            is_correct: false,
          },
          {
            label: 'By deleting and recreating the table.',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the purpose of the "UNIQUE" constraint in MySQL columns?',
        name: 'question7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'To ensure that the column contains only unique values.',
            is_correct: true,
          },
          {
            label: 'To set the default value for the column.',
            is_correct: false,
          },
          {
            label: 'To specify the data type of the column.',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the purpose of the "DROP TABLE" statement in MySQL?',
        name: 'question8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'To create a new table.',
            is_correct: false,
          },
          {
            label: 'To delete an existing table and its data.',
            is_correct: true,
          },
          {
            label: 'To modify the structure of an existing table.',
            is_correct: false,
          },
        ],
      },
      {
        title: 'How can you add a foreign key constraint to a MySQL table column?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By using the "ADD FOREIGN KEY" statement.',
            is_correct: false,
          },
          {
            label: 'By specifying the foreign key constraint when creating the table.',
            is_correct: true,
          },
          {
            label: 'By renaming the column to match the primary key of another table.',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the purpose of indexing columns in MySQL tables?',
        name: 'question10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To add graphical icons to the table.',
            is_correct: false,
          },
          {
            label: 'To improve query performance by speeding up data retrieval.',
            is_correct: true,
          },
          {
            label: 'To create a backup of the table.',
            is_correct: false,
          },
        ],
      },
    ],
  },
};


export default template;
