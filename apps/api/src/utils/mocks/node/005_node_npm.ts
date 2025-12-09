import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'Node.js NPM Quiz',
  description: 'Test your knowledge of Node.js and NPM (Node Package Manager).',
  questionnaire: {
    questions: [
      {
        title: 'What is NPM?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Node Project Manager',
            is_correct: false
          },
          {
            label: 'Node Package Manager',
            is_correct: true
          },
          {
            label: 'Node Module Processor',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you initialize a new Node.js project with NPM?',
        name: 'question2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'npm create-project',
            is_correct: false
          },
          {
            label: 'npm init',
            is_correct: true
          },
          {
            label: 'npm start-project',
            is_correct: false
          }
        ]
      },
      {
        title: 'What command is used to install a package locally using NPM?',
        name: 'question3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'npm install',
            is_correct: true
          },
          {
            label: 'npm add',
            is_correct: false
          },
          {
            label: 'npm get',
            is_correct: false
          }
        ]
      },
      {
        title: 'Explain the purpose of the "package.json" file in a Node.js project.',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How do you update a global NPM package to the latest version?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'npm update -g package-name',
            is_correct: true
          },
          {
            label: 'npm upgrade package-name',
            is_correct: false
          },
          {
            label: 'npm install -g package-name',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "npm start" command?',
        name: 'question6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'It starts the development server.',
            is_correct: true
          },
          {
            label: 'It installs all project dependencies.',
            is_correct: false
          },
          {
            label: 'It updates NPM to the latest version.',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you remove a package from your Node.js project using NPM?',
        name: 'question7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'npm remove package-name',
            is_correct: true
          },
          {
            label: 'npm uninstall package-name',
            is_correct: true
          },
          {
            label: 'npm delete package-name',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of "npm install --save"?',
        name: 'question8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'To install a package globally.',
            is_correct: false
          },
          {
            label: 'To install a package and add it to the dependencies in package.json.',
            is_correct: true
          },
          {
            label: 'To uninstall a package.',
            is_correct: false
          }
        ]
      },
      {
        title: 'How can you view a list of globally installed NPM packages?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'npm list -g',
            is_correct: true
          },
          {
            label: 'npm global list',
            is_correct: false
          },
          {
            label: 'npm show -g',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "npm audit" command?',
        name: 'question10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To perform security audits on your project dependencies.',
            is_correct: true
          },
          {
            label: 'To check the version of NPM installed globally.',
            is_correct: false
          },
          {
            label: 'To start a new NPM project.',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
