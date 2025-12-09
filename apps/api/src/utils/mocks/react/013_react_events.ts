import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'React Events Quiz',
  description: 'Test your knowledge of React events.',
  questionnaire: {
    questions: [
      {
        title: 'What are React events?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Functions that handle user interactions in React', is_correct: true },
          { label: 'CSS styles applied to React components', is_correct: false },
          { label: 'React components used to trigger animations', is_correct: false }
        ]
      },
      {
        title: 'How do you define an event handler in React?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'By creating a new React component', is_correct: false },
          { label: 'By adding an `onEvent` attribute to an HTML element', is_correct: false },
          {
            label: 'By defining a function and assigning it to an event attribute',
            is_correct: true
          }
        ]
      },
      {
        title: 'Which of the following is an example of a React event?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'onClick', is_correct: true },
          { label: 'style', is_correct: false },
          { label: 'render', is_correct: false }
        ]
      },
      {
        title: 'Select all valid event types in React.',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'onClick', is_correct: true },
          { label: 'onMouseOver', is_correct: true },
          { label: 'onChange', is_correct: true },
          { label: 'onSubmit', is_correct: true }
        ]
      },
      {
        title: 'Write an example of defining an event handler function in React.',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is event propagation in React?',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you prevent the default behavior of an event in React?',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Explain the concept of "binding" in React event handlers.',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the purpose of synthetic events in React?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you pass additional data to an event handler function in React?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      }
    ]
  }
};

export default template;
