import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'CSS Font Properties Quiz',
  description: 'Test your knowledge of CSS font properties',
  questionnaire: {
    questions: [
      {
        title: 'Which CSS property is used to set the font size of an element?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'font-size', is_correct: true },
          { label: 'font-style', is_correct: false },
          { label: 'text-align', is_correct: false },
          { label: 'line-height', is_correct: false },
        ],
      },
      {
        title: 'What does the CSS property "font-weight" control?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Font size', is_correct: false },
          { label: 'Font style', is_correct: false },
          { label: 'Font weight', is_correct: true },
          { label: 'Line spacing', is_correct: false },
        ],
      },
      {
        title: 'In CSS, how can you make text italic?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'font-style: italic;', is_correct: true },
          { label: 'text-decoration: italic;', is_correct: false },
          { label: 'italicize: true;', is_correct: false },
          { label: 'font-format: italic;', is_correct: false },
        ],
      },
      {
        title: 'Which CSS property is used to set the font family of an element?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'font-family', is_correct: true },
          { label: 'font-type', is_correct: false },
          { label: 'font-group', is_correct: false },
          { label: 'font-set', is_correct: false },
        ],
      },
      {
        title: 'What does the CSS property "text-transform" do?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Converts text to uppercase', is_correct: true },
          { label: 'Converts text to lowercase', is_correct: false },
          { label: 'Underlines the text', is_correct: false },
          { label: 'Strikes through the text', is_correct: false },
        ],
      },
      {
        title: 'Explain the usage of the CSS "font-style" property.',
        name: 'q6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'What is the purpose of the CSS property "letter-spacing"?',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Controls spacing between letters', is_correct: true },
          { label: 'Controls line spacing', is_correct: false },
          { label: 'Controls word spacing', is_correct: false },
          { label: 'Controls font size', is_correct: false },
        ],
      },
      {
        title: 'In CSS, how can you change the color of text?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'color', is_correct: true },
          { label: 'text-color', is_correct: false },
          { label: 'font-color', is_correct: false },
          { label: 'text-style', is_correct: false },
        ],
      },
      {
        title: 'What is the default value of the CSS "line-height" property?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '1', is_correct: false },
          { label: 'normal', is_correct: true },
          { label: '100%', is_correct: false },
          { label: '0', is_correct: false },
        ],
      },
      {
        title: 'What does the CSS property "text-decoration" control?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Font decoration', is_correct: false },
          { label: 'Line spacing', is_correct: false },
          { label: 'Text decoration', is_correct: true },
          { label: 'Font color', is_correct: false },
        ],
      },
    ],
  },
};

export default template;
