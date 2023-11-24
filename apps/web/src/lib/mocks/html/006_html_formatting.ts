import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'HTML Formatting Quiz',
  description: 'Test your knowledge of HTML Formatting',
  questionnaire: {
    questions: [
      {
        title: 'What HTML tag is used to define bold text?',
        name: 'q1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0],
        options: [
          {
            label: '<b>',
            is_correct: true
          },
          {
            label: '<strong>',
            is_correct: false
          },
          {
            label: '<bold>',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which HTML tag is used to create italicized text?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[2],
        options: [
          {
            label: '<italic>',
            is_correct: false
          },
          {
            label: '<i>',
            is_correct: true
          },
          {
            label: '<em>',
            is_correct: false
          }
        ]
      },
      {
        title: 'What HTML tag is used to define a superscripted text?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[1],
        options: [
          {
            label: '<sup>',
            is_correct: true
          },
          {
            label: '<super>',
            is_correct: false
          },
          {
            label: '<sub>',
            is_correct: false
          }
        ]
      },
      {
        title: "What is the purpose of the 'small' element in HTML?",
        name: 'q4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[0],
        options: [
          {
            label: 'To make text smaller',
            is_correct: true
          },
          {
            label: 'To highlight text',
            is_correct: false
          },
          {
            label: 'To make text bold',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which HTML tag is used to create a line break?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[2],
        options: [
          {
            label: '<br>',
            is_correct: true
          },
          {
            label: '<lb>',
            is_correct: false
          },
          {
            label: '<linebreak>',
            is_correct: false
          }
        ]
      },
      {
        title: "What is the purpose of the 'mark' element in HTML?",
        name: 'q6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0],
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
            label: 'To underline text',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which HTML tag is used to create a subscripted text?',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[1],
        options: [
          {
            label: '<sub>',
            is_correct: true
          },
          {
            label: '<sup>',
            is_correct: false
          },
          {
            label: '<subscript>',
            is_correct: false
          }
        ]
      },
      {
        title: "What is the purpose of the 'del' element in HTML?",
        name: 'q8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0],
        options: [
          {
            label: 'To define a deleted text',
            is_correct: true
          },
          {
            label: 'To create a hyperlink',
            is_correct: false
          },
          {
            label: 'To make text bold',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which HTML tag is used to create a horizontal rule?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0],
        options: [
          {
            label: '<hr>',
            is_correct: true
          },
          {
            label: '<line>',
            is_correct: false
          },
          {
            label: '<rule>',
            is_correct: false
          }
        ]
      },
      {
        title: "What is the purpose of the 'ins' element in HTML?",
        name: 'q10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[0],
        options: [
          {
            label: 'To define an inserted text',
            is_correct: true
          },
          {
            label: 'To create a hyperlink',
            is_correct: false
          },
          {
            label: 'To underline text',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
