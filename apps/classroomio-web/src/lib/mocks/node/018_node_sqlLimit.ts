import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Node.js MySQL LIMIT Quiz',
  description: 'Test your knowledge of limiting results in MySQL with Node.js.',
  questionnaire: {
    questions: [
      {
        title: 'What SQL statement is used to limit the number of rows returned in a MySQL query?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'LIMIT',
            is_correct: true
          },
          {
            label: 'SELECT',
            is_correct: false
          },
          {
            label: 'WHERE',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "LIMIT" clause in a MySQL query?',
        name: 'question2',
        points: 2,
        order: 1,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'To specify the maximum number of columns to return.',
            is_correct: false
          },
          {
            label: 'To limit the number of rows returned by the query.',
            is_correct: true
          },
          {
            label: 'To filter the results based on a condition.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the default value for the "LIMIT" clause if not specified?',
        name: 'question3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: '0',
            is_correct: false
          },
          {
            label: '1',
            is_correct: false
          },
          {
            label: 'No limit (all rows)',
            is_correct: true
          }
        ]
      },
      {
        title: 'Which SQL statement is used to skip a specific number of rows in a query result?',
        name: 'question4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'LIMIT',
            is_correct: false
          },
          {
            label: 'OFFSET',
            is_correct: true
          },
          {
            label: 'SKIP',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "OFFSET" clause in a MySQL query?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Can you use both "LIMIT" and "OFFSET" clauses in a single query?',
        name: 'question6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Yes, to limit the number of rows and skip a specific number of rows.',
            is_correct: true
          },
          {
            label: 'No, "LIMIT" and "OFFSET" cannot be used together.',
            is_correct: false
          }
        ]
      },
      {
        title:
          'What happens if the "LIMIT" value is greater than the total number of rows in the result set?',
        name: 'question7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'An error is thrown.',
            is_correct: false
          },
          {
            label: 'All rows in the result set are returned.',
            is_correct: true
          },
          {
            label: 'No rows are returned.',
            is_correct: false
          }
        ]
      },
      {
        title:
          'Which SQL statement is used to limit the number of rows returned from the beginning of a result set?',
        name: 'question8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'LIMIT',
            is_correct: false
          },
          {
            label: 'TOP',
            is_correct: true
          },
          {
            label: 'OFFSET',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "FETCH FIRST" clause in a MySQL query?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the purpose of the "FETCH NEXT" clause in a MySQL query?',
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
