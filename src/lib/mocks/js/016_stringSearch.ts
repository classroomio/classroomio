import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'JavaScript String Search Quiz',
  description: 'Test your knowledge of JavaScript string search methods.',
  questionnaire: {
    questions: [
      {
        title: 'Which JavaScript method is used to search for a specified value in a string?',
        name: 'q1',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'search()',
            is_correct: true
          },
          {
            label: 'find()',
            is_correct: false
          },
          {
            label: 'locate()',
            is_correct: false
          }
        ]
      },
      {
        title: 'What does the `search()` method return when it finds a match in the string?',
        name: 'q2',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'The index of the first occurrence of the match',
            is_correct: true
          },
          {
            label: 'A boolean value (true or false)',
            is_correct: false
          },
          {
            label: 'The matched substring',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which parameter of the `search()` method specifies the regular expression pattern to be searched for?',
        name: 'q3',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'The regular expression pattern',
            is_correct: true
          },
          {
            label: 'The search string',
            is_correct: false
          },
          {
            label: 'The start position of the search',
            is_correct: false
          }
        ]
      },
      {
        title: 'What does the `search()` method return if the specified value is not found in the string?',
        name: 'q4',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: '-1',
            is_correct: true
          },
          {
            label: '0',
            is_correct: false
          },
          {
            label: 'null',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which of the following is a valid example of using the `search()` method with a regular expression pattern?',
        name: 'q5',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: '/pattern/.search("text")',
            is_correct: true
          },
          {
            label: 'search("pattern", /text/)',
            is_correct: false
          },
          {
            label: '"text".search(/pattern/)',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which JavaScript method is used to search for a specified value in a string and replace it with another value?',
        name: 'q6',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'replace()',
            is_correct: true
          },
          {
            label: 'searchAndReplace()',
            is_correct: false
          },
          {
            label: 'findAndReplace()',
            is_correct: false
          }
        ]
      },
      {
        title: 'What does the `replace()` method return after replacing the specified value in a string?',
        name: 'q7',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'A new string with the replacements',
            is_correct: true
          },
          {
            label: 'The index of the replaced value',
            is_correct: false
          },
          {
            label: 'A boolean value (true or false)',
            is_correct: false
          }
        ]
      },
      {
        title: 'How can you perform a global search and replacement using the `replace()` method?',
        name: 'q8',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'By using a regular expression with the global flag (e.g., /pattern/g)',
            is_correct: true
          },
          {
            label: 'By specifying the index of the occurrence to replace',
            is_correct: false
          },
          {
            label: 'By using the `replaceAll()` method instead',
            is_correct: false
          }
        ]
      },
      {
        title: 'What does the `replace()` method do if the specified value is not found in the string?',
        name: 'q9',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Leaves the string unchanged',
            is_correct: true
          },
          {
            label: 'Throws an error',
            is_correct: false
          },
          {
            label: 'Replaces the value with null',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which JavaScript method is used to perform a case-insensitive search and replacement?',
        name: 'q10',
        points: 1,
        order: 10,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'By using a regular expression with the "i" flag (e.g., /pattern/i)',
            is_correct: true
          },
          {
            label: 'By converting the string to lowercase before using the `replace()` method',
            is_correct: false
          },
          {
            label: 'By using the `caseInsensitiveReplace()` method',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
