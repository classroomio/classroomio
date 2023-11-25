import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'React CSS Styling Quiz',
  description: 'Test your knowledge of styling in React.',
  questionnaire: {
    questions: [
      {
        title: 'Which method can be used to add inline styles in React?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'style attribute', is_correct: true },
          { label: 'class attribute', is_correct: false },
          { label: 'className attribute', is_correct: false }
        ]
      },
      {
        title: 'How can you apply CSS classes to React components?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Using the className attribute', is_correct: true },
          { label: 'Using the style attribute', is_correct: false },
          { label: 'Using the class attribute', is_correct: false }
        ]
      },
      {
        title: 'What is the purpose of CSS Modules in React?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To scope CSS styles locally to a component', is_correct: true },
          { label: 'To apply global styles to the entire application', is_correct: false },
          { label: 'To generate CSS code dynamically', is_correct: false }
        ]
      },
      {
        title: 'How do you define styles using CSS Modules in React?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the benefit of using a CSS-in-JS library like styled-components in React?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'Encapsulation of styles', is_correct: true },
          { label: 'Simpler CSS file management', is_correct: false },
          { label: 'Better performance', is_correct: false },
          { label: 'Easier debugging', is_correct: false }
        ]
      },
      {
        title: 'How do you use styled-components to create a styled element in React?',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the purpose of the CSS-in-JS library Emotion in React?',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To create and manage styled components', is_correct: true },
          { label: 'To apply global styles', is_correct: false },
          { label: 'To add inline styles', is_correct: false }
        ]
      },
      {
        title: 'In React, what is the difference between CSS Modules and styled-components?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the purpose of the CSS property `classNames` in React?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To conditionally apply multiple CSS classes', is_correct: true },
          { label: 'To define styles using JavaScript', is_correct: false },
          { label: 'To create CSS animations', is_correct: false }
        ]
      },
      {
        title: 'How can you apply conditional styles to a React component?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'By using a ternary operator in the className attribute', is_correct: true },
          { label: 'By using a switch statement in the style attribute', is_correct: false },
          { label: 'By using a for loop in the class attribute', is_correct: false }
        ]
      }
    ]
  }
};

export default template;
