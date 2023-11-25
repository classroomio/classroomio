import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'PHP Switch Statements Quiz',
  description: 'Test your knowledge of PHP switch statements.',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of the PHP switch statement?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To execute code only if the condition is true',
            is_correct: false
          },
          {
            label: 'To execute code only if the condition is false',
            is_correct: false
          },
          {
            label: 'To execute code in all cases',
            is_correct: true
          },
          {
            label: 'To execute code only in a loop',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which keyword is used to start a switch statement in PHP?',
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
            label: 'switch',
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
        title: 'How do you write a case in a switch statement in PHP?',
        name: 'question3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'case x:',
            is_correct: true
          },
          {
            label: 'if x:',
            is_correct: false
          },
          {
            label: 'when x:',
            is_correct: false
          },
          {
            label: 'condition x:',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the PHP default case in a switch statement?',
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
            is_correct: false
          },
          {
            label: 'To execute code in all cases',
            is_correct: false
          },
          {
            label: 'To execute code if no other case matches',
            is_correct: true
          }
        ]
      },
      {
        title: 'Which of the following is the correct way to write a switch statement in PHP?',
        name: 'question5',
        points: 2,
        order: 4,
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
        name: 'question6',
        points: 2,
        order: 5,
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
          'What is the output of the code snippet: `switch (2) { case 1: echo "One"; break; case 2: echo "Two"; break; default: echo "Default"; }`?',
        name: 'question7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Two',
            is_correct: true
          },
          {
            label: 'One',
            is_correct: false
          },
          {
            label: 'Default',
            is_correct: false
          },
          {
            label: 'TwoDefault',
            is_correct: false
          }
        ]
      },
      {
        title: 'What happens if there is no `break` statement in a case in a switch statement?',
        name: 'question8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label:
              'The code in that case is executed, and then the switch statement continues to the next case',
            is_correct: true
          },
          {
            label: 'An error is thrown',
            is_correct: false
          },
          {
            label: 'The switch statement terminates',
            is_correct: false
          },
          {
            label: 'The code in that case is skipped',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which of the following is used to define the default case in a switch statement?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'case default:',
            is_correct: false
          },
          {
            label: 'default:',
            is_correct: true
          },
          {
            label: 'case else:',
            is_correct: false
          },
          {
            label: 'else:',
            is_correct: false
          }
        ]
      },
      {
        title:
          'What is the output of the code: `switch (true) { case 1: echo "One"; break; case 2: echo "Two"; break; default: echo "Default"; }`?',
        name: 'question10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'One',
            is_correct: false
          },
          {
            label: 'Two',
            is_correct: false
          },
          {
            label: 'Default',
            is_correct: true
          },
          {
            label: 'OneDefault',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
