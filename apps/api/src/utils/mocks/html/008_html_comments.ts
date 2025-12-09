import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'HTML Comments Quiz',
  description: 'Test your knowledge of HTML Comments',
  questionnaire: {
    questions: [
      {
        title: 'How do you start an HTML comment?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0],
        options: [
          {
            label: '<!--',
            is_correct: true
          },
          {
            label: '<comment>',
            is_correct: false
          },
          {
            label: '<html-comment>',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you end an HTML comment?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0],
        options: [
          {
            label: '-->',
            is_correct: true
          },
          {
            label: '</comment>',
            is_correct: false
          },
          {
            label: '</html-comment>',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of HTML comments?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0],
        options: [
          {
            label: 'To provide information to the browser',
            is_correct: true
          },
          {
            label: 'To display text on the webpage',
            is_correct: false
          },
          {
            label: 'To create a hyperlink',
            is_correct: false
          }
        ]
      },
      {
        title: 'Can you nest comments in HTML?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[1],
        options: [
          {
            label: 'Yes',
            is_correct: true
          },
          {
            label: 'No',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the correct syntax for adding a comment in an HTML document?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0],
        options: [
          {
            label: '<!-- This is a comment -->',
            is_correct: true
          },
          {
            label: '<! This is a comment !>',
            is_correct: false
          },
          {
            label: '// This is a comment',
            is_correct: false
          }
        ]
      },
      {
        title: 'In HTML, comments are visible to:',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0],
        options: [
          {
            label: 'Web developers only',
            is_correct: true
          },
          {
            label: 'Both web developers and users',
            is_correct: false
          },
          {
            label: 'Web users only',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of hiding comments in HTML?',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[2],
        options: [
          {
            label: 'To prevent comments from being displayed in the browser',
            is_correct: true
          },
          {
            label: 'To make comments bold',
            is_correct: false
          },
          {
            label: 'To create a hyperlink',
            is_correct: false
          }
        ]
      },
      {
        title: 'How can you hide comments in HTML?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[2],
        options: [
          {
            label: '<!--#comment-->',
            is_correct: true
          },
          {
            label: '<!--!comment-->',
            is_correct: false
          },
          {
            label: '<!--*comment*-->',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of conditional comments in HTML?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0],
        options: [
          {
            label: 'To target specific versions of Internet Explorer',
            is_correct: true
          },
          {
            label: 'To create a dropdown list',
            is_correct: false
          },
          {
            label: 'To make text bold',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you create a conditional comment for Internet Explorer 9 and below?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0],
        options: [
          {
            label: '<!--[if lt IE 9]>',
            is_correct: true
          },
          {
            label: '<!--[if IE 9]>',
            is_correct: false
          },
          {
            label: '<!--[if gt IE 9]>',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
