import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'HTML Quotation Elements Quiz',
  description: 'Test your knowledge of HTML Quotation Elements',
  questionnaire: {
    questions: [
      {
        title: 'Which HTML tag is used to define a short quotation?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0],
        options: [
          {
            label: '<q>',
            is_correct: true
          },
          {
            label: '<quote>',
            is_correct: false
          },
          {
            label: '<short>',
            is_correct: false
          }
        ]
      },
      {
        title: "What is the purpose of the 'blockquote' element in HTML?",
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0],
        options: [
          {
            label: 'To define a block of text as a quotation',
            is_correct: true
          },
          {
            label: 'To create a bullet list',
            is_correct: false
          },
          {
            label: 'To make text bold',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which HTML tag is used to define a long quotation?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0],
        options: [
          {
            label: '<longquote>',
            is_correct: false
          },
          {
            label: '<q>',
            is_correct: false
          },
          {
            label: '<blockquote>',
            is_correct: true
          }
        ]
      },
      {
        title: "What is the purpose of the 'cite' element in HTML?",
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[1],
        options: [
          {
            label: 'To define the title of a document',
            is_correct: false
          },
          {
            label: 'To define the source of a quotation',
            is_correct: true
          },
          {
            label: 'To create a hyperlink',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which HTML tag is used to define a quotation citation?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[1],
        options: [
          {
            label: '<cite>',
            is_correct: true
          },
          {
            label: '<quotation>',
            is_correct: false
          },
          {
            label: '<source>',
            is_correct: false
          }
        ]
      },
      {
        title: "What is the purpose of the 'abbr' element in HTML?",
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[2],
        options: [
          {
            label: 'To define an abbreviation',
            is_correct: true
          },
          {
            label: 'To create a bullet list',
            is_correct: false
          },
          {
            label: 'To make text italic',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which HTML tag is used to define an abbreviation?',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[2],
        options: [
          {
            label: '<abbr>',
            is_correct: true
          },
          {
            label: '<abbrev>',
            is_correct: false
          },
          {
            label: '<ab>',
            is_correct: false
          }
        ]
      },
      {
        title: "What is the purpose of the 'dfn' element in HTML?",
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[2],
        options: [
          {
            label: 'To define a definition',
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
        title: 'Which HTML tag is used to define a definition?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0],
        options: [
          {
            label: '<definition>',
            is_correct: false
          },
          {
            label: '<def>',
            is_correct: false
          },
          {
            label: '<dfn>',
            is_correct: true
          }
        ]
      },
      {
        title: "What is the purpose of the 'mark' element in HTML?",
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[1],
        options: [
          {
            label: 'To highlight text',
            is_correct: true
          },
          {
            label: 'To create a hyperlink',
            is_correct: false
          },
          {
            label: 'To make text italic',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
