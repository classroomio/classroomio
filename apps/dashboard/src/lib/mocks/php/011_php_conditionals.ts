import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'PHP If-Else Statements Quiz',
  description: 'Test your knowledge of PHP if-else statements.',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of the PHP if statement?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To execute code if a condition is true',
            is_correct: true
          },
          {
            label: 'To execute code if a condition is false',
            is_correct: false
          },
          {
            label: 'To execute code in all cases',
            is_correct: false
          },
          {
            label: 'To execute code only in a loop',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which keyword is used to start an if-else statement in PHP?',
        name: 'question2',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'if-else',
            is_correct: false
          },
          {
            label: 'if',
            is_correct: true
          },
          {
            label: 'else',
            is_correct: false
          },
          {
            label: 'elseif',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you write "if $x is equal to 5" in PHP?',
        name: 'question3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'if $x = 5',
            is_correct: true
          },
          {
            label: 'if $x == 5',
            is_correct: false
          },
          {
            label: 'if $x := 5',
            is_correct: false
          },
          {
            label: 'if $x -> 5',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the PHP else statement?',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To execute code only if the condition is true',
            is_correct: false
          },
          {
            label: 'To execute code only if the condition is false',
            is_correct: true
          },
          {
            label: 'To execute code in all cases',
            is_correct: false
          },
          {
            label: 'To execute code only in a loop',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which of the following is the correct way to write an if-else statement in PHP?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'if (condition) { // code } else { // code }',
            is_correct: true
          },
          {
            label: 'if (condition) { // code } else (condition) { // code }',
            is_correct: false
          },
          {
            label: 'if { // code } else { // code } (condition)',
            is_correct: false
          },
          {
            label: 'if (condition) { // code } { // code } else { // code }',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the PHP elseif statement?',
        name: 'question6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To execute code only if the condition is true',
            is_correct: true
          },
          {
            label: 'To execute code only if the condition is false',
            is_correct: false
          },
          {
            label: 'To execute code in all cases',
            is_correct: false
          },
          {
            label: 'To execute code only in a loop',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the output of the code snippet: `if (true) { echo "Hello"; } else { echo "Goodbye"; }`?',
        name: 'question7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Hello',
            is_correct: true
          },
          {
            label: 'Goodbye',
            is_correct: false
          },
          {
            label: 'HelloGoodbye',
            is_correct: false
          },
          {
            label: 'No output',
            is_correct: false
          }
        ]
      },
      {
        title: 'How can you write a switch statement in PHP?',
        name: 'question8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'switch (x) { case 1: // code break; case 2: // code break; default: // code }',
            is_correct: true
          },
          {
            label: 'if (x) { // code } else { // code }',
            is_correct: false
          },
          {
            label: 'if (x == 1) { // code } else if (x == 2) { // code } else { // code }',
            is_correct: false
          },
          {
            label: 'select (x) { case 1: // code break; case 2: // code break; default: // code }',
            is_correct: false
          }
        ]
      },
      {
        title: 'In a switch statement, what does the `break` keyword do?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'It exits the switch statement',
            is_correct: true
          },
          {
            label: 'It continues to the next case without checking conditions',
            is_correct: false
          },
          {
            label: 'It restarts the switch statement',
            is_correct: false
          },
          {
            label: 'It is used to define a default case',
            is_correct: false
          }
        ]
      },
      {
        title:
          'What is the output of the code: `if (false) { echo "Hello"; } elseif (true) { echo "Goodbye"; } else { echo "No output"; }`?',
        name: 'question10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Goodbye',
            is_correct: true
          },
          {
            label: 'Hello',
            is_correct: false
          },
          {
            label: 'No output',
            is_correct: false
          },
          {
            label: 'HelloGoodbye',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
