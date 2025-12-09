import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'HTML Links Quiz',
  description: 'Test your knowledge of HTML Links',
  questionnaire: {
    questions: [
      {
        title: 'Which HTML tag is used to create a hyperlink?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0],
        options: [
          {
            label: '<a>',
            is_correct: true
          },
          {
            label: '<link>',
            is_correct: false
          },
          {
            label: '<hlink>',
            is_correct: false
          }
        ]
      },
      {
        title: "What does the 'href' attribute in the 'a' tag specify?",
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0],
        options: [
          {
            label: 'The URL of the linked page',
            is_correct: true
          },
          {
            label: 'The color of the link',
            is_correct: false
          },
          {
            label: 'The heading of the linked page',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you open a link in a new browser window or tab?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[1],
        options: [
          {
            label: "target='_new'",
            is_correct: true
          },
          {
            label: "target='_blank'",
            is_correct: false
          },
          {
            label: "target='_window'",
            is_correct: false
          }
        ]
      },
      {
        title: 'Which attribute is used to specify the email address in an email link?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0],
        options: [
          {
            label: 'mailto',
            is_correct: true
          },
          {
            label: 'email',
            is_correct: false
          },
          {
            label: 'href',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you create a bookmark link in HTML?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0],
        options: [
          {
            label: "<a href='#bookmark'>",
            is_correct: true
          },
          {
            label: '<bookmark>',
            is_correct: false
          },
          {
            label: "<a href='bookmark'>",
            is_correct: false
          }
        ]
      },
      {
        title: "What is the purpose of the 'target' attribute in the 'a' tag?",
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0],
        options: [
          {
            label: 'To specify where to open the linked document',
            is_correct: true
          },
          {
            label: 'To change the font color of the link',
            is_correct: false
          },
          {
            label: 'To add a border around the link',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you create a link to an external webpage?',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0],
        options: [
          {
            label: "<a href='http://www.example.com'>",
            is_correct: true
          },
          {
            label: "<a src='http://www.example.com'>",
            is_correct: false
          },
          {
            label: "<a link='http://www.example.com'>",
            is_correct: false
          }
        ]
      },
      {
        title: "What is the purpose of the 'rel' attribute in the 'a' tag?",
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[2],
        options: [
          {
            label: 'To specify the relationship between the current document and the linked document',
            is_correct: true
          },
          {
            label: 'To add a background color to the link',
            is_correct: false
          },
          {
            label: 'To underline the link',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you create a link that opens the email client to send an email?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0],
        options: [
          {
            label: "<a href='mailto:email@example.com'>",
            is_correct: true
          },
          {
            label: "<a href='email@example.com'>",
            is_correct: false
          },
          {
            label: "<a send='email@example.com'>",
            is_correct: false
          }
        ]
      },
      {
        title: "What is the purpose of the 'download' attribute in the 'a' tag?",
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[1],
        options: [
          {
            label: 'To specify that the target will be downloaded when a user clicks on the link',
            is_correct: true
          },
          {
            label: 'To change the font size of the link',
            is_correct: false
          },
          {
            label: 'To add a border around the link',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
