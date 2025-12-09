import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'Node.js MySQL WHERE Clause Quiz',
  description: 'Test your knowledge of using the "WHERE" clause in MySQL with Node.js.',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of the "WHERE" clause in a SQL statement?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To order the selected rows in ascending order.',
            is_correct: false
          },
          {
            label: 'To filter rows based on a specified condition.',
            is_correct: true
          },
          {
            label: 'To group rows with the same values in specified columns.',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which SQL statement is used to filter rows in a SQL SELECT statement?',
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
            label: 'FILTER',
            is_correct: false
          },
          {
            label: 'WHERE',
            is_correct: true
          }
        ]
      },
      {
        title: 'What is the purpose of the "AND" operator in a WHERE clause?',
        name: 'question3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'To combine multiple conditions, all of which must be true.',
            is_correct: true
          },
          {
            label: 'To exclude rows that meet any of the specified conditions.',
            is_correct: false
          },
          {
            label: 'To order the selected rows.',
            is_correct: false
          }
        ]
      },
      {
        title: 'Explain the difference between the "AND" and "OR" operators in a WHERE clause.',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you filter rows based on a range of values in a WHERE clause?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By using the "BETWEEN" operator.',
            is_correct: true
          },
          {
            label: 'By using the "LIKE" operator.',
            is_correct: false
          },
          {
            label: 'By using the "IN" operator.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "LIKE" operator in a WHERE clause?',
        name: 'question6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To filter rows based on a range of values.',
            is_correct: false
          },
          {
            label: 'To filter rows based on a partial match of a value.',
            is_correct: true
          },
          {
            label: 'To filter rows based on an exact match of a value.',
            is_correct: false
          }
        ]
      },
      {
        title: 'How can you combine multiple conditions with different logical operators in a WHERE clause?',
        name: 'question7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'By using parentheses to group conditions.',
            is_correct: true
          },
          {
            label: 'By separating conditions with commas.',
            is_correct: false
          },
          {
            label: 'By using the "AND" operator only.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "NOT" operator in a WHERE clause?',
        name: 'question8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'To negate the meaning of a condition.',
            is_correct: true
          },
          {
            label: 'To filter rows that meet any of the specified conditions.',
            is_correct: false
          },
          {
            label: 'To order the selected rows in descending order.',
            is_correct: false
          }
        ]
      },
      {
        title: 'How can you use the "IS NULL" condition in a WHERE clause?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To filter rows that have a non-null value.',
            is_correct: false
          },
          {
            label: 'To filter rows that have a null value.',
            is_correct: true
          },
          {
            label: 'To filter rows that have a specific value.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of using the "ORDER BY" clause in a SQL SELECT statement?',
        name: 'question10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
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
      }
    ]
  }
};

export default template;
