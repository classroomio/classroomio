import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'TypeScript Arrays Quiz',
  description: 'Test your knowledge of TypeScript arrays.',
  questionnaire: {
    questions: [
      {
        title: 'What is the correct way to declare an array in TypeScript?',
        name: 'q1',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'let array = []',
            is_correct: false
          },
          {
            label: 'const array = {}',
            is_correct: false
          },
          {
            label: 'const array: Array<number> = []',
            is_correct: true
          },
          {
            label: 'const array: number[] = {}',
            is_correct: false
          },
          {
            label: 'let array = new Array<number>()',
            is_correct: false
          }
        ]
      },
      {
        title: 'What method is used to add new elements to the end of an array in TypeScript?',
        name: 'q2',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'push()',
            is_correct: true
          },
          {
            label: 'add()',
            is_correct: false
          },
          {
            label: 'append()',
            is_correct: false
          },
          {
            label: 'insert()',
            is_correct: false
          },
          {
            label: 'concat()',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you access the first element of an array in TypeScript?',
        name: 'q3',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'array[0]',
            is_correct: true
          },
          {
            label: 'array.first()',
            is_correct: false
          },
          {
            label: 'array.first',
            is_correct: false
          },
          {
            label: 'array.getElement(0)',
            is_correct: false
          },
          {
            label: 'array.front()',
            is_correct: false
          }
        ]
      },
      {
        title:
          'What TypeScript method is used to remove the last element from an array and return that element?',
        name: 'q4',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'shift()',
            is_correct: false
          },
          {
            label: 'pop()',
            is_correct: true
          },
          {
            label: 'removeLast()',
            is_correct: false
          },
          {
            label: 'slice()',
            is_correct: false
          },
          {
            label: 'splice()',
            is_correct: false
          }
        ]
      },
      {
        title:
          'What is the result of the following code?\n\n```typescript\nconst numbers = [1, 2, 3, 4, 5];\nconst slicedNumbers = numbers.slice(1, 3);\nconsole.log(slicedNumbers);\n```',
        name: 'q5',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: '[1, 2, 3]',
            is_correct: false
          },
          {
            label: '[2, 3]',
            is_correct: true
          },
          {
            label: '[3, 4]',
            is_correct: false
          },
          {
            label: '[2, 4]',
            is_correct: false
          },
          {
            label: '[1, 3]',
            is_correct: false
          }
        ]
      },
      {
        title: 'In TypeScript, how can you check if an element exists in an array?',
        name: 'q6',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Use the `elementOf` operator',
            is_correct: false
          },
          {
            label: 'Use the `contains` method',
            is_correct: false
          },
          {
            label: 'Use the `includes` method',
            is_correct: true
          },
          {
            label: 'Use the `has` method',
            is_correct: false
          },
          {
            label: 'Use the `find` method',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which TypeScript method is used to join all elements of an array into a string?',
        name: 'q7',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'join()',
            is_correct: true
          },
          {
            label: 'concat()',
            is_correct: false
          },
          {
            label: 'merge()',
            is_correct: false
          },
          {
            label: 'combine()',
            is_correct: false
          },
          {
            label: 'implode()',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the correct way to remove an element by index from an array in TypeScript?',
        name: 'q8',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Use the `remove` method',
            is_correct: false
          },
          {
            label: 'Use the `splice` method',
            is_correct: true
          },
          {
            label: 'Use the `delete` operator',
            is_correct: false
          },
          {
            label: 'Use the `filter` method',
            is_correct: false
          },
          {
            label: 'Use the `discard` method',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the correct TypeScript syntax to sort an array in descending order?',
        name: 'q9',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'array.sort()',
            is_correct: false
          },
          {
            label: 'array.sort((a, b) => b - a)',
            is_correct: true
          },
          {
            label: 'array.reverse()',
            is_correct: false
          },
          {
            label: 'array.sort((a, b) => a - b)',
            is_correct: false
          },
          {
            label: 'array.descending()',
            is_correct: false
          }
        ]
      },
      {
        title:
          'Which TypeScript method is used to add one or more elements to the beginning of an array?',
        name: 'q10',
        points: 1,
        order: 10,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'prepend()',
            is_correct: false
          },
          {
            label: 'unshift()',
            is_correct: true
          },
          {
            label: 'push()',
            is_correct: false
          },
          {
            label: 'addFirst()',
            is_correct: false
          },
          {
            label: 'insertAtStart()',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
