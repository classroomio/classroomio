import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'React Conditional Rendering Practical Quiz',
  description: 'Test your practical knowledge of conditional rendering in React.',
  questionnaire: {
    questions: [
      {
        title: 'How can you conditionally render content in React?',
        name: 'conditionalRendering',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0],
        options: [
          {
            label: 'Using conditional statements (if-else).',
            is_correct: true
          },
          {
            label: 'Always rendering all content.',
            is_correct: false
          },
          {
            label: 'Using randomization.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "ternary operator" in conditional rendering?',
        name: 'ternaryOperatorPurpose',
        points: 1,
        order: 1,
        question_type: QuestionTypes[2],
        options: []
      },
      {
        title:
          'How would you conditionally render "ComponentA" if a condition is true and "ComponentB" if the condition is false?',
        name: 'conditionalRenderingComponents',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0],
        options: [
          {
            label: '{condition ? <ComponentA /> : <ComponentB />}',
            is_correct: true
          },
          {
            label: '<ComponentA /> || <ComponentB />',
            is_correct: false
          },
          {
            label: '<ComponentA /> && <ComponentB />',
            is_correct: false
          }
        ]
      },
      {
        title: 'In React, how do you conditionally render content based on the state?',
        name: 'conditionalRenderingState',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0],
        options: [
          {
            label: 'Using the "setState" method.',
            is_correct: true
          },
          {
            label: 'By directly modifying the state object.',
            is_correct: false
          },
          {
            label: 'State cannot be used for conditional rendering.',
            is_correct: false
          }
        ]
      },
      {
        title:
          'What is the purpose of the "map" function in conditional rendering with lists in React?',
        name: 'mapFunctionPurpose',
        points: 1,
        order: 4,
        question_type: QuestionTypes[2],
        options: []
      },
      {
        title: 'How do you conditionally render a list of items in React using the "map" function?',
        name: 'conditionalRenderingList',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0],
        options: [
          {
            label: '{items.map(item => <ItemComponent key={item.id} />)}',
            is_correct: true
          },
          {
            label: '{items.forEach(item => <ItemComponent />)}',
            is_correct: false
          },
          {
            label: '{items.render(item => <ItemComponent />)}',
            is_correct: false
          }
        ]
      },
      {
        title: 'How can you conditionally render content based on user input in a form?',
        name: 'conditionalRenderingForm',
        points: 1,
        order: 6,
        question_type: QuestionTypes[1],
        options: [
          {
            label: 'Using event handlers and state changes.',
            is_correct: true
          },
          {
            label: 'By hardcoding the content in the form.',
            is_correct: false
          },
          {
            label: 'By using server-side logic only.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of conditional rendering in a React form?',
        name: 'conditionalRenderingFormPurpose',
        points: 1,
        order: 7,
        question_type: QuestionTypes[2],
        options: []
      },
      {
        title:
          'How would you conditionally render a component "ErrorMessage" if a form input is invalid?',
        name: 'conditionalRenderingInvalidInput',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0],
        options: [
          {
            label: '{isInvalid ? <ErrorMessage /> : null}',
            is_correct: true
          },
          {
            label: '{!isInvalid && <ErrorMessage />}',
            is_correct: false
          },
          {
            label: '{isInvalid && <ErrorMessage />}',
            is_correct: false
          }
        ]
      },
      {
        title: 'Explain briefly why conditional rendering is important in React applications.',
        name: 'conditionalRenderingImportance',
        points: 5,
        order: 9,
        question_type: QuestionTypes[2],
        options: []
      }
    ]
  }
};

export default template;
