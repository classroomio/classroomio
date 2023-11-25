import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'React Memo and useMemo Quiz',
  description: 'Test your knowledge of React memoization.',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of React `memo`?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To optimize the rendering of functional components by memoizing their results',
            is_correct: true
          },
          { label: 'To manage state in class components', is_correct: false },
          { label: 'To create custom hooks', is_correct: false }
        ]
      },
      {
        title: 'How do you wrap a functional component with `memo` in React?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'By using `React.memo(Component)`', is_correct: true },
          { label: 'By using `Component.memo()`', is_correct: false },
          { label: 'By using `memoize(Component)`', is_correct: false }
        ]
      },
      {
        title: 'What is the purpose of `useMemo` in React?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To memoize the result of a function or computation', is_correct: true },
          { label: 'To create a new component', is_correct: false },
          { label: 'To manage component state', is_correct: false }
        ]
      },
      {
        title: 'How do you use the `useMemo` hook in a functional component?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the difference between `React.memo` and `useMemo`?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'In which scenarios is it beneficial to use `memo` in React?',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the purpose of the dependency array in `useMemo`?',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Can you use `memo` with class components in React?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Yes, by extending the `React.PureComponent` class', is_correct: true },
          { label: 'No, `memo` can only be used with functional components', is_correct: false },
          { label: 'Yes, by using the `@memo` decorator', is_correct: false }
        ]
      },
      {
        title: 'What is one of the benefits of using memoization in React components?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'Improved performance by avoiding unnecessary renders', is_correct: true },
          { label: 'Simpler component code', is_correct: false },
          { label: 'Automatic state management', is_correct: false },
          { label: 'Easier debugging', is_correct: false }
        ]
      },
      {
        title: 'How can you force a re-render of a memoized component in React?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'By passing new props to the component', is_correct: true },
          { label: 'By using the `shouldComponentUpdate` method', is_correct: false },
          { label: 'By calling the `forceUpdate` method', is_correct: false }
        ]
      }
    ]
  }
};

export default template;
