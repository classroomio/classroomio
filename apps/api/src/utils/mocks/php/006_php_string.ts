import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'PHP Strings Quiz',
  description: 'Test your knowledge of PHP string manipulation.',
  questionnaire: {
    questions: [
      {
        title: 'What function is used to find the length of a string in PHP?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'strlen()',
            is_correct: true
          },
          {
            label: 'strlength()',
            is_correct: false
          },
          {
            label: 'length()',
            is_correct: false
          },
          {
            label: 'count()',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which PHP function is used to replace a specified text within a string?',
        name: 'question2',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'str_replace()',
            is_correct: true
          },
          {
            label: 'replace()',
            is_correct: false
          },
          {
            label: 'replaceText()',
            is_correct: false
          },
          {
            label: 'substr_replace()',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the output of the following PHP code: `echo strpos("Hello World", "World");`?',
        name: 'question3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Hello World',
            is_correct: false
          },
          {
            label: 'World',
            is_correct: false
          },
          {
            label: '0',
            is_correct: true
          },
          {
            label: '-1',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which PHP function is used to concatenate two strings?',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'concat()',
            is_correct: false
          },
          {
            label: 'join()',
            is_correct: false
          },
          {
            label: 'implode()',
            is_correct: false
          },
          {
            label: ' . (dot)',
            is_correct: true
          }
        ]
      },
      {
        title: 'How do you get the substring "World" from the string "Hello World" using PHP?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'substr("Hello World", 6, 5)',
            is_correct: true
          },
          {
            label: 'substring("Hello World", 6, 5)',
            is_correct: false
          },
          {
            label: 'substring("Hello World", 0, 5)',
            is_correct: false
          },
          {
            label: 'slice("Hello World", 6, 5)',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which PHP function is used to convert a string to all lowercase letters?',
        name: 'question6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'tolowercase()',
            is_correct: false
          },
          {
            label: 'strtolower()',
            is_correct: true
          },
          {
            label: 'caseToLower()',
            is_correct: false
          },
          {
            label: 'stringToLowerCase()',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you remove white spaces from the beginning and end of a string in PHP?',
        name: 'question7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'trim()',
            is_correct: true
          },
          {
            label: 'removeWhitespace()',
            is_correct: false
          },
          {
            label: 'clean()',
            is_correct: false
          },
          {
            label: 'strip()',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the output of the following PHP code: `echo strtoupper("hello");`?',
        name: 'question8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Hello',
            is_correct: false
          },
          {
            label: 'hello',
            is_correct: false
          },
          {
            label: 'HELLO',
            is_correct: true
          },
          {
            label: 'hELLO',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which PHP function is used to split a string into an array of substrings?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'split()',
            is_correct: false
          },
          {
            label: 'explode()',
            is_correct: true
          },
          {
            label: 'splitString()',
            is_correct: false
          },
          {
            label: 'substring()',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the correct way to escape a single quote (apostrophe) within a string in PHP?',
        name: 'question10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: '"Hello \'World\'"',
            is_correct: false
          },
          {
            label: '"Hello "World""',
            is_correct: false
          },
          {
            label: '"Hello \\\'World\\\'"',
            is_correct: true
          },
          {
            label: '"Hello "World""',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
