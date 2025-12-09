import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'Node.js File System Quiz',
  description: 'Test your knowledge of Node.js File System module from W3Schools',
  questionnaire: {
    questions: [
      {
        title: 'What is the primary use of the Node.js File System module?',
        name: 'q1',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Handling file operations', is_correct: true },
          { label: 'Database operations', is_correct: false },
          { label: 'Network communication', is_correct: false }
        ]
      },
      {
        title: 'Which method is used to read the contents of a file in Node.js?',
        name: 'q2',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'fs.read()', is_correct: false },
          { label: 'fs.readFile()', is_correct: true },
          { label: 'fs.write()', is_correct: false }
        ]
      },
      {
        title: 'What is the purpose of the "fs.promises" API in Node.js File System?',
        name: 'q3',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Handling synchronous file operations', is_correct: false },
          { label: 'Handling asynchronous file operations with promises', is_correct: true },
          { label: 'Handling network requests', is_correct: false }
        ]
      },
      {
        title: 'Which of the following is a valid way to create a new file using the File System module?',
        name: 'q4',
        points: 1,
        order: 4,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'fs.createFile()', is_correct: true },
          { label: 'fs.writeFile()', is_correct: true },
          { label: 'fs.newFile()', is_correct: false },
          { label: 'fs.appendFile()', is_correct: false }
        ]
      },
      {
        title: 'Explain the difference between synchronous and asynchronous file operations in Node.js.',
        name: 'q5',
        points: 2,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you check if a file exists using the File System module in Node.js?',
        name: 'q6',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'fs.exists()', is_correct: false },
          { label: 'fs.access()', is_correct: true },
          { label: 'fs.checkFile()', is_correct: false }
        ]
      },
      {
        title: 'Which method is used to delete a file in Node.js using the File System module?',
        name: 'q7',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'fs.remove()', is_correct: false },
          { label: 'fs.deleteFile()', is_correct: false },
          { label: 'fs.unlink()', is_correct: true }
        ]
      },
      {
        title: 'What is the purpose of the "fs.createReadStream()" method in Node.js?',
        name: 'q8',
        points: 2,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Which of the following is a valid use case for the File System module in Node.js?',
        name: 'q9',
        points: 2,
        order: 9,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'Reading and writing configuration files', is_correct: true },
          { label: 'Creating a web server', is_correct: false },
          { label: 'Sending emails', is_correct: false },
          { label: 'Database operations', is_correct: false }
        ]
      },
      {
        title: 'Explain the difference between "fs.readFile()" and "fs.readFileSync()" in Node.js.',
        name: 'q10',
        points: 2,
        order: 10,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      }
    ]
  }
};

export default template;
