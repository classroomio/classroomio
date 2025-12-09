import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'Node.js MySQL DELETE Statement Quiz',
  description: 'Test your knowledge of using the "DELETE" statement in MySQL with Node.js.',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of the "DELETE" statement in SQL?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To update existing records in a table.',
            is_correct: false
          },
          {
            label: 'To insert new records into a table.',
            is_correct: false
          },
          {
            label: 'To remove existing records from a table.',
            is_correct: true
          }
        ]
      },
      {
        title: 'Which SQL statement is used to delete a specific record from a table?',
        name: 'question2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'DELETE ALL',
            is_correct: false
          },
          {
            label: 'DELETE',
            is_correct: true
          },
          {
            label: 'REMOVE',
            is_correct: false
          }
        ]
      },
      {
        title: 'What happens if you execute a "DELETE" statement without a "WHERE" clause?',
        name: 'question3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'All records in the table are deleted.',
            is_correct: true
          },
          {
            label: 'No records are deleted, and an error is thrown.',
            is_correct: false
          },
          {
            label: 'The first record in the table is deleted.',
            is_correct: false
          }
        ]
      },
      {
        title: 'Explain the purpose of the "WHERE" clause in a "DELETE" statement.',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Can you use the "LIMIT" clause with a "DELETE" statement in MySQL?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Yes, you can use "LIMIT" to specify the maximum number of rows to delete.',
            is_correct: true
          },
          {
            label: 'No, "LIMIT" is not allowed in a "DELETE" statement.',
            is_correct: false
          },
          {
            label: 'Yes, but only with the "ORDER BY" clause.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "ORDER BY" clause in a "DELETE" statement?',
        name: 'question6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To filter rows based on a specified condition.',
            is_correct: false
          },
          {
            label: 'To order the rows before deleting them.',
            is_correct: false
          },
          {
            label: 'To specify the columns to delete.',
            is_correct: false
          }
        ]
      },
      {
        title: 'How can you delete all records from a table using a "DELETE" statement?',
        name: 'question7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'Execute "DELETE FROM table_name".',
            is_correct: true
          },
          {
            label: 'Execute "DELETE * FROM table_name".',
            is_correct: false
          },
          {
            label: 'Execute "DELETE table_name".',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of using the "TRUNCATE" statement?',
        name: 'question8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'To delete specific records from a table.',
            is_correct: false
          },
          {
            label: 'To remove all records from a table quickly.',
            is_correct: true
          },
          {
            label: 'To update records in a table.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the difference between the "DELETE" and "TRUNCATE" statements?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Can you use the "JOIN" clause in a "DELETE" statement?',
        name: 'question10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Yes, you can use "JOIN" to delete records from multiple tables.',
            is_correct: true
          },
          {
            label: 'No, "JOIN" is not allowed in a "DELETE" statement.',
            is_correct: false
          },
          {
            label: 'Yes, but only with the "ORDER BY" clause.',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
