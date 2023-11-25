import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Node.js MySQL JOIN Quiz',
  description: 'Test your knowledge of performing JOIN operations in MySQL with Node.js.',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of a JOIN operation in a MySQL query?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To create a new table.',
            is_correct: false
          },
          {
            label:
              'To combine rows from two or more tables based on a related column between them.',
            is_correct: true
          },
          {
            label: 'To delete data from a table.',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which JOIN type returns all rows when there is a match in either table?',
        name: 'question2',
        points: 2,
        order: 1,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'INNER JOIN',
            is_correct: false
          },
          {
            label: 'LEFT JOIN (or LEFT OUTER JOIN)',
            is_correct: true
          },
          {
            label: 'RIGHT JOIN (or RIGHT OUTER JOIN)',
            is_correct: true
          },
          {
            label: 'FULL JOIN (or FULL OUTER JOIN)',
            is_correct: true
          }
        ]
      },
      {
        title: 'Which JOIN type returns only the rows that have matching values in both tables?',
        name: 'question3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'INNER JOIN',
            is_correct: true
          },
          {
            label: 'LEFT JOIN (or LEFT OUTER JOIN)',
            is_correct: false
          },
          {
            label: 'RIGHT JOIN (or RIGHT OUTER JOIN)',
            is_correct: false
          },
          {
            label: 'FULL JOIN (or FULL OUTER JOIN)',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "ON" clause in a JOIN operation?',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title:
          'Which JOIN type returns all rows from both tables with NULL records where there is no match?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'INNER JOIN',
            is_correct: false
          },
          {
            label: 'LEFT JOIN (or LEFT OUTER JOIN)',
            is_correct: false
          },
          {
            label: 'RIGHT JOIN (or RIGHT OUTER JOIN)',
            is_correct: false
          },
          {
            label: 'FULL JOIN (or FULL OUTER JOIN)',
            is_correct: true
          }
        ]
      },
      {
        title: 'Which SQL statement is used to perform an INNER JOIN in MySQL?',
        name: 'question6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'JOIN',
            is_correct: true
          },
          {
            label: 'INNER',
            is_correct: false
          },
          {
            label: 'ON',
            is_correct: false
          }
        ]
      },
      {
        title:
          'Which JOIN type returns all rows from the left table and the matching rows from the right table?',
        name: 'question7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'INNER JOIN',
            is_correct: false
          },
          {
            label: 'LEFT JOIN (or LEFT OUTER JOIN)',
            is_correct: true
          },
          {
            label: 'RIGHT JOIN (or RIGHT OUTER JOIN)',
            is_correct: false
          },
          {
            label: 'FULL JOIN (or FULL OUTER JOIN)',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the difference between INNER JOIN and LEFT JOIN?',
        name: 'question8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Which SQL statement is used to perform a LEFT JOIN in MySQL?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'JOIN',
            is_correct: false
          },
          {
            label: 'LEFT JOIN (or LEFT OUTER JOIN)',
            is_correct: true
          },
          {
            label: 'OUTER JOIN',
            is_correct: false
          }
        ]
      },
      {
        title: 'What happens if there are duplicate column names in the tables being joined?',
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
