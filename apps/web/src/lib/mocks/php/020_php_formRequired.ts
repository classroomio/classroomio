import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'PHP Form Required Quiz',
  description: 'Test your knowledge of required fields in PHP forms.',
  questionnaire: {
    questions: [
      {
        title: 'What is a required field in a form?',
        name: 'q1',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0],
        options: [
          {
            label: 'A field that must be filled out by the user',
            is_correct: true,
          },
          {
            label: 'A field that is optional for the user to fill out',
            is_correct: false,
          },
          {
            label: 'A field that is automatically populated by the server',
            is_correct: false,
          },
        ],
      },
      {
        title: 'How can you mark a field as required in HTML?',
        name: 'q2',
        points: 2,
        order: 2,
        question_type: QuestionTypes[1],
        options: [
          {
            label: '<input type="required">',
            is_correct: false,
          },
          {
            label: '<input required>',
            is_correct: true,
          },
          {
            label: '<input type="text" required>',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the purpose of the "required" attribute in HTML forms?',
        name: 'q3',
        points: 2,
        order: 3,
        question_type: QuestionTypes[2],
        options: [
          {
            label: 'It specifies the maximum length of input data',
            is_correct: false,
          },
          {
            label: 'It specifies that the field must be filled out before submitting the form',
            is_correct: true,
          },
          {
            label: 'It specifies the default value for the input field',
            is_correct: false,
          },
        ],
      },

      {
        title: 'Your text area question goes here.',
        name: 'q4',
        points: 2,
        order: 4,
        question_type: QuestionTypes[3],
        options: [], // No options for TEXTAREA type
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
            is_correct: true,
          },
          {
            label: 'Option 2',
            is_correct: false,
          },
          {
            label: 'Option 3',
            is_correct: true,
          },
        ],
      },

      {
        title: 'Your text area question goes here.',
        name: 'q6',
        points: 2,
        order: 6,
        question_type: QuestionTypes[5],
        options: [], // No options for TEXTAREA type
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
            is_correct: true,
          },
          {
            label: 'Option B',
            is_correct: false,
          },
        ],
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
            is_correct: true,
          },
          {
            label: 'Option Y',
            is_correct: false,
          },
          {
            label: 'Option Z',
            is_correct: true,
          },
        ],
      },

      {
        title: 'Your text area question goes here.',
        name: 'q9',
        points: 2,
        order: 9,
        question_type: QuestionTypes[8],
        options: [], // No options for TEXTAREA type
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
            is_correct: false,
          },
          {
            label: 'Option Q',
            is_correct: true,
          },
        ],
      },

    ],
  },
};

export default template;
