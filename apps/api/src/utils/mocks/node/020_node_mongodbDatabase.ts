import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'Node.js MongoDB Database Creation Quiz',
  description: 'Test your knowledge of creating MongoDB databases with Node.js.',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of MongoDB in a Node.js application?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To create a new Node.js application.',
            is_correct: false
          },
          {
            label: 'To store and manage data in a NoSQL database.',
            is_correct: true
          },
          {
            label: 'To create a front-end interface for a website.',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which MongoDB driver is commonly used to connect to MongoDB from a Node.js application?',
        name: 'question2',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'MySQL',
            is_correct: false
          },
          {
            label: 'SQLite',
            is_correct: false
          },
          {
            label: 'Mongoose',
            is_correct: true
          },
          {
            label: 'Express.js',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the role of the "mongodb://localhost/mydb" connection string?',
        name: 'question3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Which command is used to create a new MongoDB database?',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'CREATE DATABASE',
            is_correct: false
          },
          {
            label: 'USE DATABASE',
            is_correct: false
          },
          {
            label: 'db.createDatabase()',
            is_correct: true
          },
          {
            label: 'db.create()',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is a "collection" in MongoDB?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'A group of related Node.js modules.',
            is_correct: false
          },
          {
            label: 'A set of documents in a MongoDB database.',
            is_correct: true
          },
          {
            label: 'A JavaScript function in a Node.js application.',
            is_correct: false
          }
        ]
      },
      {
        title: 'How can you insert a document into a MongoDB collection using Node.js?',
        name: 'question6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Which method is used to find documents in a MongoDB collection with specific criteria?',
        name: 'question7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'findOne()',
            is_correct: false
          },
          {
            label: 'find()',
            is_correct: true
          },
          {
            label: 'search()',
            is_correct: false
          },
          {
            label: 'get()',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of an ObjectId in MongoDB?',
        name: 'question8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'To uniquely identify a document within a collection.',
            is_correct: true
          },
          {
            label: 'To define the structure of a collection.',
            is_correct: false
          },
          {
            label: 'To store binary data.',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which method is used to update documents in a MongoDB collection?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'modify()',
            is_correct: false
          },
          {
            label: 'updateOne()',
            is_correct: true
          },
          {
            label: 'change()',
            is_correct: false
          },
          {
            label: 'patch()',
            is_correct: false
          }
        ]
      },
      {
        title: 'How can you delete a document from a MongoDB collection using Node.js?',
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
