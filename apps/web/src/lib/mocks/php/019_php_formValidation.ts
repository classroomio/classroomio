import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'PHP Form Validation Quiz',
  description: 'Test your knowledge of PHP form validation.',
  questionnaire: {
    questions: [
      {
        title: 'What is form validation?',
        name: 'q1',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0],
        options: [
          {
            label: 'Ensuring that data is submitted to the server',
            is_correct: false
          },
          {
            label: 'Validating user input before processing',
            is_correct: true
          },
          {
            label: 'Displaying form data on the page',
            is_correct: false
          }
        ]
      },
      {
        title: 'How is form data typically sent to the server?',
        name: 'q2',
        points: 2,
        order: 2,
        question_type: QuestionTypes[1],
        options: [
          {
            label: 'Using GET method',
            is_correct: false
          },
          {
            label: 'Using POST method',
            is_correct: true
          },
          {
            label: 'Using PUT method',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which function is used to perform form validation in PHP?',
        name: 'q3',
        points: 2,
        order: 3,
        question_type: QuestionTypes[2],
        options: [
          {
            label: 'validate_form()',
            is_correct: false
          },
          {
            label: 'check_form_data()',
            is_correct: false
          },
          {
            label: 'filter_input()',
            is_correct: true
          }
        ]
      },

      {
        title: 'Your text area question goes here.',
        name: 'q4',
        points: 2,
        order: 4,
        question_type: QuestionTypes[3],
        options: [] // No options for TEXTAREA type
      },

      {
        title: 'Your checkbox question goes here.',
        name: 'q5',
        points: 2,
        order: 5,
        question_type: QuestionTypes[4],
        options: [
          {
            label: 'Option 1',
            is_correct: true
          },
          {
            label: 'Option 2',
            is_correct: false
          },
          {
            label: 'Option 3',
            is_correct: true
          }
        ]
      },

      {
        title: 'Your text area question goes here.',
        name: 'q6',
        points: 2,
        order: 6,
        question_type: QuestionTypes[5],
        options: [] // No options for TEXTAREA type
      },

      {
        title: 'Your radio question goes here.',
        name: 'q7',
        points: 2,
        order: 7,
        question_type: QuestionTypes[6],
        options: [
          {
            label: 'Option A',
            is_correct: true
          },
          {
            label: 'Option B',
            is_correct: false
          }
        ]
      },

      {
        title: 'Your checkbox question goes here.',
        name: 'q8',
        points: 2,
        order: 8,
        question_type: QuestionTypes[7],
        options: [
          {
            label: 'Option X',
            is_correct: true
          },
          {
            label: 'Option Y',
            is_correct: false
          },
          {
            label: 'Option Z',
            is_correct: true
          }
        ]
      },

      {
        title: 'Your text area question goes here.',
        name: 'q9',
        points: 2,
        order: 9,
        question_type: QuestionTypes[8],
        options: [] // No options for TEXTAREA type
      },

      {
        title: 'Your radio question goes here.',
        name: 'q10',
        points: 2,
        order: 10,
        question_type: QuestionTypes[9],
        options: [
          {
            label: 'Option P',
            is_correct: false
          },
          {
            label: 'Option Q',
            is_correct: true
          }
        ]
      }
    ]
  }
};

export default template;
