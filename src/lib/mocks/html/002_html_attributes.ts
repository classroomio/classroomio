import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'HTML Attributes Quiz',
  description: 'Test your knowledge of HTML attributes.',
  questionnaire: {
    questions: [
      {
        title: 'Which HTML attribute is used to define inline styles?',
        name: 'inline_style',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'class', is_correct: false },
          { label: 'style', is_correct: true },
          { label: 'src', is_correct: false }
        ]
      },
      {
        title: "What is the purpose of the 'href' attribute in the <a> element?",
        name: 'href_attribute',
        points: 2,
        order: 2,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Which attribute is used to specify an alternate text for an image?',
        name: 'alt_attribute',
        points: 2,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'title', is_correct: false },
          { label: 'alt', is_correct: true },
          { label: 'src', is_correct: false }
        ]
      },
      {
        title: "What does the 'target' attribute in the <a> element control?",
        name: 'target_attribute',
        points: 2,
        order: 4,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'The size of the link', is_correct: false },
          { label: 'The position of the link', is_correct: false },
          { label: 'Where the linked document will open', is_correct: true },
          { label: 'The color of the link', is_correct: false }
        ]
      },
      {
        title: 'Which attribute is used to specify the URL of a linked resource?',
        name: 'href_attribute2',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'src', is_correct: false },
          { label: 'href', is_correct: true },
          { label: 'alt', is_correct: false }
        ]
      }
    ]
  }
};

export default template;
