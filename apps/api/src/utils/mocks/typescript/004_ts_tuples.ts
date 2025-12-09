import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'TypeScript Tuples Quiz',
  description: 'Test your knowledge of TypeScript tuples.',
  questionnaire: {
    questions: [
      {
        title: 'What is a TypeScript tuple?',
        name: 'q1',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'A data structure that stores a fixed-size collection of elements of mixed types.',
            is_correct: true
          },
          {
            label: 'A data structure that stores an unlimited number of elements of the same type.',
            is_correct: false
          },
          {
            label: 'A data structure that stores elements of the same type and size.',
            is_correct: false
          },
          {
            label: 'A data structure that stores elements of mixed types without size restrictions.',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you define a tuple type in TypeScript?',
        name: 'q2',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Using the `Tuple` keyword',
            is_correct: false
          },
          {
            label: 'Using the `tuple` keyword',
            is_correct: true
          },
          {
            label: 'Using the `array` keyword',
            is_correct: false
          },
          {
            label: 'Using the `list` keyword',
            is_correct: false
          }
        ]
      },
      {
        title: 'How can you access elements of a TypeScript tuple?',
        name: 'q3',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'By using the dot notation (e.g., `tuple.0`)',
            is_correct: false
          },
          {
            label: 'By using square brackets (e.g., `tuple[0]`)',
            is_correct: true
          },
          {
            label: 'By using parentheses (e.g., `tuple(0)`)',
            is_correct: false
          },
          {
            label: 'By using the `get` method (e.g., `tuple.get(0)`)',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which of the following statements is true about TypeScript tuples?',
        name: 'q4',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Tuples allow elements to be added or removed dynamically.',
            is_correct: false
          },
          {
            label: 'Tuples can contain elements of different types but must be of fixed size.',
            is_correct: true
          },
          {
            label: 'Tuples are resizable arrays with dynamic types.',
            is_correct: false
          },
          {
            label: 'Tuples can only contain elements of the same type.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the correct way to initialize a TypeScript tuple?',
        name: 'q5',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'const myTuple: tuple = [1, "two", 3]',
            is_correct: false
          },
          {
            label: 'const myTuple: [number, string, number] = [1, "two", 3]',
            is_correct: true
          },
          {
            label: 'const myTuple: (number, string, number) = [1, "two", 3]',
            is_correct: false
          },
          {
            label: 'const myTuple: tuple<number, string, number> = [1, "two", 3]',
            is_correct: false
          }
        ]
      },
      {
        title: 'In a TypeScript tuple, what does the number in the tuple type represent?',
        name: 'q6',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'The maximum number of elements that the tuple can hold.',
            is_correct: true
          },
          {
            label: 'The index of the first element in the tuple.',
            is_correct: false
          },
          {
            label: 'The type of the elements in the tuple.',
            is_correct: false
          },
          {
            label: 'The size of the tuple in memory.',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you update a value in a TypeScript tuple?',
        name: 'q7',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'You cannot update values in a tuple; tuples are immutable.',
            is_correct: true
          },
          {
            label: 'By using the `update` method on the tuple.',
            is_correct: false
          },
          {
            label: 'By directly assigning a new value to the tuple element.',
            is_correct: false
          },
          {
            label: 'By using the `set` method on the tuple.',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the advantage of using TypeScript tuples over arrays?',
        name: 'q8',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Tuples have a dynamic size, making them more flexible.',
            is_correct: false
          },
          {
            label: 'Tuples allow you to store elements of different types.',
            is_correct: true
          },
          {
            label: 'Tuples have better performance for iteration.',
            is_correct: false
          },
          {
            label: 'Tuples provide built-in sorting methods.',
            is_correct: false
          }
        ]
      },
      {
        title: 'Can TypeScript tuples be used to represent key-value pairs?',
        name: 'q9',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Yes, by using the `key` and `value` properties of a tuple element.',
            is_correct: false
          },
          {
            label:
              'Yes, by using tuples with two elements where the first element is the key and the second element is the value.',
            is_correct: true
          },
          {
            label: 'No, tuples are not suitable for representing key-value pairs.',
            is_correct: false
          },
          {
            label: 'No, TypeScript does not support key-value pairs in tuples.',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which TypeScript version introduced tuple types?',
        name: 'q10',
        points: 1,
        order: 10,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'TypeScript has always had tuple types.',
            is_correct: false
          },
          {
            label: 'TypeScript 2.0',
            is_correct: true
          },
          {
            label: 'TypeScript 3.0',
            is_correct: false
          },
          {
            label: 'TypeScript 4.0',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
