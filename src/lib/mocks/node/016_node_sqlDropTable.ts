import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Node.js MySQL DROP TABLE Quiz',
  description: 'Test your knowledge of dropping tables in MySQL with Node.js.',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of the "DROP TABLE" statement in SQL?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To create a new table in the database.',
            is_correct: false,
          },
          {
            label: 'To delete an existing table and all its data.',
            is_correct: true,
          },
          {
            label: 'To update records in a table.',
            is_correct: false,
          },
        ],
      },
      {
        title: 'Which SQL statement is used to delete a table in MySQL?',
        name: 'question2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'DELETE TABLE',
            is_correct: false,
          },
          {
            label: 'DROP TABLE',
            is_correct: true,
          },
          {
            label: 'REMOVE TABLE',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What happens if you execute a "DROP TABLE" statement without a table name?',
        name: 'question3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'All tables in the database are deleted.',
            is_correct: false,
          },
          {
            label: 'The first table in the database is deleted.',
            is_correct: false,
          },
          {
            label: 'An error is thrown, and no table is deleted.',
            is_correct: true,
          },
        ],
      },
      {
        title: 'Explain the purpose of the "IF EXISTS" clause in a "DROP TABLE" statement.',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'Can you drop multiple tables in a single "DROP TABLE" statement?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Yes, you can specify multiple table names separated by commas.',
            is_correct: true,
          },
          {
            label: 'No, you can only drop one table at a time.',
            is_correct: false,
          },
          {
            label: 'Yes, but you need to use a separate "DROP TABLE" statement for each table.',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the purpose of the "CASCADE" option in a "DROP TABLE" statement?',
        name: 'question6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To drop the table and all dependent objects.',
            is_correct: true,
          },
          {
            label: 'To drop the table without affecting dependent objects.',
            is_correct: false,
          },
          {
            label: 'To rename the table instead of dropping it.',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the purpose of using the "RESTRICT" option in a "DROP TABLE" statement?',
        name: 'question7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'To drop the table without affecting dependent objects.',
            is_correct: true,
          },
          {
            label: 'To drop the table and all dependent objects.',
            is_correct: false,
          },
          {
            label: 'To rename the table instead of dropping it.',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the difference between "DROP TABLE" and "DELETE FROM" in SQL?',
        name: 'question8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'Can you use the "IF NOT EXISTS" option with "DROP TABLE"?',
        name: 'question9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'Yes, it prevents an error if the table does not exist.',
            is_correct: true,
          },
          {
            label: 'No, "IF NOT EXISTS" is not allowed with "DROP TABLE".',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the purpose of the "RENAME" option in a "DROP TABLE" statement?',
        name: 'question10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'To rename the table instead of dropping it.',
            is_correct: true,
          },
          {
            label: 'To drop the table and all dependent objects.',
            is_correct: false,
          },
          {
            label: 'To drop the table without affecting dependent objects.',
            is_correct: false,
          },
        ],
      },
    ],
  },
};


export default template;
