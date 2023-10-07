import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'CSS Comments Quiz',
  description: 'Test your knowledge of CSS comments',
  questionnaire: {
    questions: [
      {
        title: 'What is the correct way to add a CSS comment?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '/* This is a CSS comment */', is_correct: true },
          { label: '// This is a CSS comment', is_correct: false },
          { label: '<!-- This is a CSS comment -->', is_correct: false },
        ],
      },
      {
        title: 'Can you add multiline comments in CSS?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Yes, using /* */', is_correct: true },
          { label: 'No, CSS only supports single-line comments', is_correct: false },
        ],
      },
      {
        title: 'What is the purpose of CSS comments?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To provide explanations and notes within the code', is_correct: true },
          { label: 'To disable specific styles temporarily', is_correct: false },
          { label: 'To hide styles from the browser', is_correct: false },
        ],
      },
      {
        title: 'Which of the following is NOT a valid way to add a CSS comment?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '<!-- This is a CSS comment -->', is_correct: true },
          { label: '// This is a CSS comment', is_correct: false },
          { label: '/* This is a CSS comment */', is_correct: false },
        ],
      },
      {
        title: 'Explain the use of CSS comments in improving code readability.',
        name: 'q5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'When might you use CSS comments to organize your styles?',
        name: 'q6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'Which CSS selector should you use to select all elements with a specific class?',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '.classname', is_correct: true },
          { label: '#classname', is_correct: false },
          { label: 'elementname', is_correct: false },
        ],
      },
      {
        title: 'How do you add a CSS comment using the "style" attribute in HTML?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'style="/* This is a CSS comment */"', is_correct: true },
          { label: 'style="// This is a CSS comment"', is_correct: false },
          { label: 'style="<!-- This is a CSS comment -->"', is_correct: false },
        ],
      },
      {
        title: 'In CSS, comments are displayed in the rendered web page.',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'True', is_correct: false },
          { label: 'False', is_correct: true },
        ],
      },
      {
        title: 'Explain the advantages of using CSS comments for code maintenance.',
        name: 'q10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
    ],
  },
};

export default template;
