import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'Node.js MySQL ORDER BY Clause Quiz',
  description: 'Test your knowledge of using the "ORDER BY" clause in MySQL with Node.js.',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of the "ORDER BY" clause in a SQL SELECT statement?',
        name: 'question1',
        points: 2,
        order: 0,
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
      },
      {
        title: 'Which SQL keyword is used to specify the sorting order in the "ORDER BY" clause?',
        name: 'question2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'ASC',
            is_correct: true
          },
          {
            label: 'DESC',
            is_correct: true
          },
          {
            label: 'ORDER',
            is_correct: false
          }
        ]
      },
      {
        title: 'What does "ASC" stand for in the context of sorting in SQL?',
        name: 'question3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'Ascending Sort Condition',
            is_correct: false
          },
          {
            label: 'Alphabetical Sorting Condition',
            is_correct: false
          },
          {
            label: 'Ascending',
            is_correct: true
          }
        ]
      },
      {
        title: 'Explain the purpose of the "DESC" keyword in an "ORDER BY" clause.',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you specify multiple columns for sorting in the "ORDER BY" clause?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Separate column names with commas.',
            is_correct: true
          },
          {
            label: 'Use the "AND" operator between column names.',
            is_correct: false
          },
          {
            label: 'Use the "OR" operator between column names.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the default sorting order when using the "ORDER BY" clause?',
        name: 'question6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Ascending (ASC)',
            is_correct: true
          },
          {
            label: 'Descending (DESC)',
            is_correct: false
          },
          {
            label: 'Random order',
            is_correct: false
          }
        ]
      },
      {
        title: 'Can you use an alias in the "ORDER BY" clause?',
        name: 'question7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'Yes, you can use an alias to specify sorting order.',
            is_correct: false
          },
          {
            label: 'No, aliases are not allowed in the "ORDER BY" clause.',
            is_correct: true
          },
          {
            label: 'Yes, but only for numeric columns.',
            is_correct: false
          }
        ]
      },
      {
        title: "What happens if you don't specify a sorting order (ASC or DESC) in the 'ORDER BY' clause?",
        name: 'question8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'The query will return an error.',
            is_correct: false
          },
          {
            label: 'The default sorting order (ASC) will be used.',
            is_correct: true
          },
          {
            label: 'The sorting order will be random.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "LIMIT" clause in a SQL SELECT statement?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To filter rows based on a specified condition.',
            is_correct: false
          },
          {
            label: 'To order the selected rows based on one or more columns.',
            is_correct: false
          },
          {
            label: 'To limit the number of rows returned by the query.',
            is_correct: true
          }
        ]
      },
      {
        title: 'What is the purpose of using the "OFFSET" clause with the "LIMIT" clause?',
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
            label: 'To skip a specified number of rows before returning results.',
            is_correct: true
          },
          {
            label: 'To order rows in descending order.',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
