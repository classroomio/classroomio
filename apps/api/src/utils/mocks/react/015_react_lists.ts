import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'React Lists and Keys Quiz',
  description: 'Test your knowledge of React lists and keys.',
  questionnaire: {
    questions: [
      {
        title: 'What is a key in React?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A unique identifier for list items in React', is_correct: true },
          { label: 'A CSS class name for styling list items', is_correct: false },
          { label: 'A component used to render lists in React', is_correct: false }
        ]
      },
      {
        title: 'Why is it important to use keys when rendering lists in React?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To improve the performance of list rendering', is_correct: false },
          {
            label: 'To ensure that React can uniquely identify and update list items',
            is_correct: true
          },
          { label: 'To apply a specific CSS style to list items', is_correct: false }
        ]
      },
      {
        title: "What happens if you don't provide keys when rendering lists in React?",
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'React generates keys automatically', is_correct: false },
          { label: 'React throws a warning but still renders the list', is_correct: false },
          { label: 'React may have difficulty updating the list efficiently', is_correct: true }
        ]
      },
      {
        title: 'Select all valid data types that can be used as keys in React lists.',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'Numbers', is_correct: true },
          { label: 'Strings', is_correct: true },
          { label: 'Objects', is_correct: true },
          { label: 'Booleans', is_correct: false }
        ]
      },
      {
        title: 'Write an example of rendering a list of items in React using the `map` method and keys.',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Explain the concept of "reconciliation" in React when dealing with keys in lists.',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the purpose of the `index` argument in the `map` method when rendering lists in React?',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you update the order of items in a rendered list in React?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the difference between keys and refs in React?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Can you use the same key for multiple items in a list in React?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Yes, as long as the items have different content', is_correct: false },
          { label: 'No, keys must be unique within a list', is_correct: true },
          { label: 'Only if the items have the same parent component', is_correct: false }
        ]
      }
    ]
  }
};

export default template;
