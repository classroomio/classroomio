import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'HTML Iframes Quiz',
  description: 'Test your knowledge of HTML iframes',
  questionnaire: {
    questions: [
      {
        title: 'What does HTML stand for?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Hypertext Markup Language',
            is_correct: true
          },
          {
            label: 'Hyperlink and Text Markup Language',
            is_correct: false
          },
          {
            label: 'Highly Textual Markup Language',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of an iframe element?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To embed external web content within a web page',
            is_correct: true
          },
          {
            label: 'To create a hyperlink to another webpage',
            is_correct: false
          },
          {
            label: 'To format text and images on a web page',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which attribute is used to specify the source URL of an iframe?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What happens if the src attribute of an iframe is empty?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'The iframe displays an error message',
            is_correct: false
          },
          {
            label: 'The iframe is hidden',
            is_correct: false
          },
          {
            label: 'The iframe remains blank',
            is_correct: true
          }
        ]
      },
      {
        title: 'Which attribute is used to specify the width of an iframe?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Can an iframe display content from a different domain?',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Yes, always',
            is_correct: false
          },
          {
            label: 'No, never',
            is_correct: false
          },
          {
            label: 'Yes, if the external domain allows it through CORS',
            is_correct: true
          }
        ]
      },
      {
        title: 'What is the purpose of the frameborder attribute in an iframe?',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'To specify the border width',
            is_correct: true
          },
          {
            label: 'To allow or disallow scrolling',
            is_correct: false
          },
          {
            label: 'To control the display of a border around the iframe',
            is_correct: true
          }
        ]
      },
      {
        title: 'What is the purpose of the allowfullscreen attribute in an iframe?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'To enable or disable fullscreen mode',
            is_correct: false
          },
          {
            label: 'To allow the embedded content to be displayed in fullscreen mode',
            is_correct: true
          }
        ]
      },
      {
        title: "What does the term 'sandboxing' refer to in iframes?",
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the default value of the scrolling attribute in an iframe?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Auto',
            is_correct: false
          },
          {
            label: 'Yes',
            is_correct: true
          },
          {
            label: 'No',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
