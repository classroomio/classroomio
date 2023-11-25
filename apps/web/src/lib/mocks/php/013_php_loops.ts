import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'PHP Looping Quiz',
  description: 'Test your knowledge of PHP looping constructs.',
  questionnaire: {
    questions: [
      {
        title: 'Which PHP construct is used for iterating over the elements of an array?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'if statement',
            is_correct: false
          },
          {
            label: 'while loop',
            is_correct: false
          },
          {
            label: 'foreach loop',
            is_correct: true
          },
          {
            label: 'switch statement',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the output of the code: `for ($i = 0; $i < 5; $i++) { echo $i; }`?',
        name: 'question2',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: '01234',
            is_correct: true
          },
          {
            label: '54321',
            is_correct: false
          },
          {
            label: '012345',
            is_correct: false
          },
          {
            label: '543210',
            is_correct: false
          }
        ]
      },
      {
        title:
          'Which looping construct is best suited for executing code as long as a condition is true?',
        name: 'question3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'for loop',
            is_correct: false
          },
          {
            label: 'while loop',
            is_correct: true
          },
          {
            label: 'foreach loop',
            is_correct: false
          },
          {
            label: 'do...while loop',
            is_correct: false
          }
        ]
      },
      {
        title: 'How can you stop an ongoing loop in PHP?',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Use the `halt` keyword',
            is_correct: false
          },
          {
            label: 'Use the `exit` function',
            is_correct: true
          },
          {
            label: 'Use the `stop` function',
            is_correct: false
          },
          {
            label: 'Use the `break` statement',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the `continue` statement in a loop?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To exit the loop',
            is_correct: false
          },
          {
            label: 'To restart the loop from the beginning',
            is_correct: false
          },
          {
            label: 'To skip the current iteration and continue to the next',
            is_correct: true
          },
          {
            label: 'To print the loop variable',
            is_correct: false
          }
        ]
      },
      {
        title: 'In a `for` loop, what does the initialization part specify?',
        name: 'question6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'The loop condition',
            is_correct: false
          },
          {
            label: 'The loop body',
            is_correct: false
          },
          {
            label: 'The loop variable and its initial value',
            is_correct: true
          },
          {
            label: 'The loop increment',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the `do...while` loop?',
        name: 'question7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To execute the loop body once and then check the condition',
            is_correct: true
          },
          {
            label: 'To execute the loop body a fixed number of times',
            is_correct: false
          },
          {
            label: 'To iterate over the elements of an array',
            is_correct: false
          },
          {
            label: 'To execute the loop body until a condition is false',
            is_correct: false
          }
        ]
      },
      {
        title:
          'Which loop construct is best suited for iterating over the elements of an associative array in PHP?',
        name: 'question8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'for loop',
            is_correct: false
          },
          {
            label: 'while loop',
            is_correct: false
          },
          {
            label: 'foreach loop',
            is_correct: true
          },
          {
            label: 'do...while loop',
            is_correct: false
          }
        ]
      },
      {
        title:
          'What is the output of the code: `foreach ($colors as $color) { echo $color; }` where `$colors` is an array containing ["red", "green", "blue"]?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'redgreenblue',
            is_correct: false
          },
          {
            label: 'RGB',
            is_correct: false
          },
          {
            label: 'red green blue',
            is_correct: true
          },
          {
            label: 'red,green,blue',
            is_correct: false
          }
        ]
      },
      {
        title: 'What does the `break` statement do in a loop?',
        name: 'question10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'It continues to the next iteration of the loop',
            is_correct: false
          },
          {
            label: 'It exits the loop prematurely',
            is_correct: true
          },
          {
            label: 'It skips the current iteration and continues to the next',
            is_correct: false
          },
          {
            label: 'It restarts the loop from the beginning',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
