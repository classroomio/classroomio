import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'Node.js Modules Quiz',
  description: 'Test your knowledge of Node.js modules from W3Schools',
  questionnaire: {
    questions: [
      {
        title: 'What is a Node.js module?',
        name: 'q1',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A JavaScript file', is_correct: true },
          { label: 'A Node.js package', is_correct: false },
          { label: 'A built-in Node.js function', is_correct: false }
        ]
      },
      {
        title: 'How do you include a module in Node.js?',
        name: 'q2',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: "require('module_name')", is_correct: true },
          { label: "import module_name from 'module'", is_correct: false },
          { label: "import 'module_name'", is_correct: false }
        ]
      },
      {
        title: 'Which of the following is a built-in Node.js module?',
        name: 'q3',
        points: 2,
        order: 3,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'fs', is_correct: true },
          { label: 'http', is_correct: true },
          { label: 'express', is_correct: false },
          { label: 'path', is_correct: true }
        ]
      },
      {
        title: 'How do you export a module in Node.js?',
        name: 'q4',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'module.exports', is_correct: true },
          { label: 'export default', is_correct: false },
          { label: 'exports', is_correct: false }
        ]
      },
      {
        title: 'What is the purpose of the "exports" object in a Node.js module?',
        name: 'q5',
        points: 2,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Which of the following is a valid way to create a readable stream in Node.js?',
        name: 'q6',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'fs.createWriteStream()', is_correct: false },
          { label: 'fs.createReadStream()', is_correct: true },
          { label: 'fs.readFile()', is_correct: false }
        ]
      },
      {
        title: 'What is the purpose of the "events" module in Node.js?',
        name: 'q7',
        points: 2,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Which method is used to handle HTTP POST requests in Node.js?',
        name: 'q8',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'HTTP POST requests are handled automatically', is_correct: false },
          { label: 'http.createServer()', is_correct: false },
          { label: 'req.on("data")', is_correct: false },
          { label: 'req.on("end")', is_correct: true }
        ]
      },
      {
        title: 'In Node.js, what does the "path" module provide?',
        name: 'q9',
        points: 2,
        order: 9,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'File system operations', is_correct: true },
          { label: 'URL parsing', is_correct: true },
          { label: 'Event handling', is_correct: false }
        ]
      },
      {
        title: 'How do you import a local module in Node.js?',
        name: 'q10',
        points: 2,
        order: 10,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: "require('./module_name')", is_correct: true },
          { label: "import module_name from 'module_name'", is_correct: false },
          { label: "import './module_name'", is_correct: false }
        ]
      }
    ]
  }
};

export default template;
