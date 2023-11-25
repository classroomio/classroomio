import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'HTML Images Quiz',
  description: 'Test your knowledge of HTML images',
  questionnaire: {
    questions: [
      {
        title: 'Which HTML element is used to display an image?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '<img>', is_correct: true },
          { label: '<image>', is_correct: false },
          { label: '<picture>', is_correct: false }
        ]
      },
      {
        title: "What is the purpose of the 'src' attribute in an HTML image?",
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: "It specifies the image's width", is_correct: false },
          { label: "It defines the image's source URL", is_correct: true },
          { label: "It sets the image's alt text", is_correct: false }
        ]
      },
      {
        title: 'How can you specify the width and height of an HTML image?',
        name: 'q3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: "Using the 'width' and 'height' attributes", is_correct: true },
          { label: 'Using CSS styles', is_correct: true },
          { label: 'Using JavaScript', is_correct: false }
        ]
      },
      {
        title: "What does the 'alt' attribute in an HTML image do?",
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: "It defines the image's source URL", is_correct: false },
          { label: "It specifies the image's width", is_correct: false },
          { label: 'It provides alternative text for the image', is_correct: true }
        ]
      },
      {
        title:
          'Which attribute is used to provide a text description for an image for accessibility?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'title', is_correct: false },
          { label: 'alt', is_correct: true },
          { label: 'description', is_correct: false }
        ]
      },
      {
        title: 'How do you make an image a clickable link?',
        name: 'q6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'Wrap the image in an <a> element', is_correct: true },
          { label: "Use the 'href' attribute on the <img> element", is_correct: false },
          { label: "Add an 'onclick' attribute to the image", is_correct: false }
        ]
      },
      {
        title: "What is the purpose of the 'title' attribute in an HTML image?",
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: "It defines the image's title", is_correct: false },
          { label: 'It provides a tooltip text for the image', is_correct: true },
          { label: "It sets the image's width", is_correct: false }
        ]
      },
      {
        title: 'Which HTML element is used to define a clickable area within an image?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '<area>', is_correct: true },
          { label: '<map>', is_correct: false },
          { label: '<link>', is_correct: false }
        ]
      },
      {
        title: "What does the 'usemap' attribute in an HTML image do?",
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: "It specifies the image's source URL", is_correct: false },
          { label: 'It links to an external map file', is_correct: false },
          { label: 'It defines an image map to be used', is_correct: true }
        ]
      },
      {
        title: 'Which attribute is used to set the initial width of an image in pixels?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'width', is_correct: true },
          { label: 'height', is_correct: false },
          { label: 'size', is_correct: false }
        ]
      }
    ]
  }
};

export default template;
