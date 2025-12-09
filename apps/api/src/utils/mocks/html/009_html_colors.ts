import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'HTML Colors Quiz',
  description: 'Test your knowledge of HTML Colors',
  questionnaire: {
    questions: [
      {
        title: 'What is the hexadecimal color code for red?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0],
        options: [
          {
            label: '#FF0000',
            is_correct: true
          },
          {
            label: '#00FF00',
            is_correct: false
          },
          {
            label: '#0000FF',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which CSS property is used to set the background color of an element?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0],
        options: [
          {
            label: 'background-color',
            is_correct: true
          },
          {
            label: 'color',
            is_correct: false
          },
          {
            label: 'border-color',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you specify a color in CSS using its name?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0],
        options: [
          {
            label: 'color: red;',
            is_correct: true
          },
          {
            label: 'color: #FF0000;',
            is_correct: false
          },
          {
            label: 'color: rgb(255, 0, 0);',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the RGB value for the color green?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0],
        options: [
          {
            label: 'rgb(0, 128, 0)',
            is_correct: true
          },
          {
            label: 'rgb(255, 0, 0)',
            is_correct: false
          },
          {
            label: 'rgb(0, 0, 255)',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which CSS property is used to set the text color of an element?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0],
        options: [
          {
            label: 'color',
            is_correct: true
          },
          {
            label: 'text-color',
            is_correct: false
          },
          {
            label: 'font-color',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the hexadecimal color code for blue?',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0],
        options: [
          {
            label: '#0000FF',
            is_correct: true
          },
          {
            label: '#FF0000',
            is_correct: false
          },
          {
            label: '#00FF00',
            is_correct: false
          }
        ]
      },
      {
        title: "What does the 'opacity' CSS property control?",
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[1],
        options: [
          {
            label: 'The transparency of an element',
            is_correct: true
          },
          {
            label: 'The size of an element',
            is_correct: false
          },
          {
            label: 'The font of an element',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you specify a color in CSS using RGBA?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0],
        options: [
          {
            label: 'color: rgba(255, 0, 0, 0.5);',
            is_correct: true
          },
          {
            label: 'color: rgb(0, 128, 0, 0.5);',
            is_correct: false
          },
          {
            label: 'color: rgba(0, 0, 255);',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the HSL value for the color yellow?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0],
        options: [
          {
            label: 'hsl(60, 100%, 50%)',
            is_correct: true
          },
          {
            label: 'hsl(0, 100%, 50%)',
            is_correct: false
          },
          {
            label: 'hsl(120, 100%, 50%)',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you specify a color in CSS using HSLA?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0],
        options: [
          {
            label: 'color: hsla(120, 100%, 50%, 0.5);',
            is_correct: true
          },
          {
            label: 'color: hsl(60, 100%, 50%, 0.5);',
            is_correct: false
          },
          {
            label: 'color: hsla(0, 100%, 50%);',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
