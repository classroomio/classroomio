import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'PHP Regular Expressions Quiz',
  description: 'Test your knowledge of regular expressions in PHP.',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of regular expressions in PHP?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To manipulate arrays',
            is_correct: false
          },
          {
            label: 'To perform pattern matching on strings',
            is_correct: true
          },
          {
            label: 'To create databases',
            is_correct: false
          },
          {
            label: 'To define classes and objects',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which PHP function is used to perform a regular expression match?',
        name: 'question2',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'strpos()',
            is_correct: false
          },
          {
            label: 'preg_match()',
            is_correct: true
          },
          {
            label: 'substr()',
            is_correct: false
          },
          {
            label: 'str_replace()',
            is_correct: false
          }
        ]
      },
      {
        title: 'In a regular expression, what does the caret (^) symbol represent?',
        name: 'question3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'The start of a line or string',
            is_correct: true
          },
          {
            label: 'The end of a line or string',
            is_correct: false
          },
          {
            label: 'A wildcard character',
            is_correct: false
          },
          {
            label: 'An optional character',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which regular expression modifier is used in PHP to perform a case-insensitive match?',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'i',
            is_correct: true
          },
          {
            label: 'm',
            is_correct: false
          },
          {
            label: 's',
            is_correct: false
          },
          {
            label: 'x',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the quantifier "+" in a regular expression?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To match zero or one occurrence of the preceding character',
            is_correct: false
          },
          {
            label: 'To match zero or more occurrences of the preceding character',
            is_correct: false
          },
          {
            label: 'To match one or more occurrences of the preceding character',
            is_correct: true
          },
          {
            label: 'To match a specific number of occurrences of the preceding character',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the backslash () in a regular expression?',
        name: 'question6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To escape a special character',
            is_correct: true
          },
          {
            label: 'To represent a wildcard character',
            is_correct: false
          },
          {
            label: 'To indicate the end of a line',
            is_correct: false
          },
          {
            label: 'To define a character class',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which PHP function is used to replace text based on a regular expression?',
        name: 'question7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'preg_match()',
            is_correct: false
          },
          {
            label: 'preg_replace()',
            is_correct: true
          },
          {
            label: 'strpos()',
            is_correct: false
          },
          {
            label: 'str_replace()',
            is_correct: false
          }
        ]
      },
      {
        title: 'What does the metacharacter "." (dot) represent in a regular expression?',
        name: 'question8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Any character except a newline',
            is_correct: true
          },
          {
            label: 'A numeric digit',
            is_correct: false
          },
          {
            label: 'A whitespace character',
            is_correct: false
          },
          {
            label: 'The start of a line or string',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which PHP function is used to perform a global regular expression match?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'preg_match()',
            is_correct: false
          },
          {
            label: 'preg_replace()',
            is_correct: false
          },
          {
            label: 'preg_grep()',
            is_correct: false
          },
          {
            label: 'preg_match_all()',
            is_correct: true
          }
        ]
      },
      {
        title: 'What is a capture group in a regular expression?',
        name: 'question10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'A way to exclude characters from matching',
            is_correct: false
          },
          {
            label: 'A way to capture and remember a matched portion of the input',
            is_correct: true
          },
          {
            label: 'A way to specify a required character in the input',
            is_correct: false
          },
          {
            label: 'A way to match any character',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
