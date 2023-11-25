import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Node.js MySQL UPDATE Quiz',
  description: 'Test your knowledge of updating data in MySQL with Node.js.',
  questionnaire: {
    questions: [
      {
        title: 'What SQL statement is used to update data in a MySQL database?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'UPDATE',
            is_correct: true
          },
          {
            label: 'INSERT',
            is_correct: false
          },
          {
            label: 'SELECT',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "SET" clause in an "UPDATE" statement?',
        name: 'question2',
        points: 2,
        order: 1,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'To specify which table to update.',
            is_correct: false
          },
          {
            label: 'To set a new value for a column.',
            is_correct: true
          },
          {
            label: 'To specify the condition for updating rows.',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which SQL statement is used to update a specific row in a table?',
        name: 'question3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'UPDATE',
            is_correct: false
          },
          {
            label: 'UPDATE ROW',
            is_correct: false
          },
          {
            label: 'UPDATE ... WHERE',
            is_correct: true
          }
        ]
      },
      {
        title: 'What is the purpose of the "WHERE" clause in an "UPDATE" statement?',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Which SQL statement is used to update multiple rows in a table?',
        name: 'question5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'UPDATE ROW',
            is_correct: false
          },
          {
            label: 'UPDATE ALL',
            is_correct: false
          },
          {
            label: 'UPDATE ... WHERE',
            is_correct: true
          }
        ]
      },
      {
        title: 'What is the purpose of the "LIMIT" clause in an "UPDATE" statement?',
        name: 'question6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To specify the maximum number of columns to update.',
            is_correct: false
          },
          {
            label: 'To limit the number of rows to update.',
            is_correct: true
          },
          {
            label: 'To set a new value for a column.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "ORDER BY" clause in an "UPDATE" statement?',
        name: 'question7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Can you use a subquery in an "UPDATE" statement?',
        name: 'question8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'Yes, to update rows based on the result of a subquery.',
            is_correct: true
          },
          {
            label: 'No, subqueries are not allowed in "UPDATE" statements.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What happens if you omit the "WHERE" clause in an "UPDATE" statement?',
        name: 'question9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'All rows in the table are updated.',
            is_correct: true
          },
          {
            label: 'An error is thrown, and no rows are updated.',
            is_correct: false
          },
          {
            label: 'The first row in the table is updated.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "RETURNING" clause in an "UPDATE" statement?',
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
