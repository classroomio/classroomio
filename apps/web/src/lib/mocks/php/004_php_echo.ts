import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'PHP Echo and Print Quiz',
  description: 'Test your knowledge of PHP echo and print functions.',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of the "echo" statement in PHP?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To display text or HTML content to the browser.',
            is_correct: true,
          },
          {
            label: 'To declare a new variable.',
            is_correct: false,
          },
          {
            label: 'To perform mathematical calculations.',
            is_correct: false,
          },
        ],
      },
      {
        title: 'Which of the following is the correct syntax for the "echo" statement in PHP?',
        name: 'question2',
        points: 2,
        order: 1,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'echo "Hello, World!";',
            is_correct: true,
          },
          {
            label: 'echo("Hello, World!");',
            is_correct: true,
          },
          {
            label: 'echo = "Hello, World!";',
            is_correct: false,
          },
          {
            label: 'echo("Hello, World!");',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the difference between "echo" and "print" in PHP?',
        name: 'question3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'There is no difference; "echo" and "print" are interchangeable.',
            is_correct: false,
          },
          {
            label: '"echo" can output multiple values at once, while "print" can output only one value at a time.',
            is_correct: true,
          },
          {
            label: '"echo" can only output text, while "print" can output both text and variables.',
            is_correct: false,
          },
        ],
      },
      {
        title: 'Which of the following is an example of using the "print" statement in PHP?',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'What is the output of the following PHP code?\n\n```php\n$variable = "Hello, World!";\necho $variable;\n```',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'Which of the following is a valid use of the "print_r" function in PHP?',
        name: 'question6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'Displaying the structure of an array.',
            is_correct: true,
          },
          {
            label: 'Performing mathematical calculations.',
            is_correct: false,
          },
          {
            label: 'Printing a text string.',
            is_correct: false,
          },
          {
            label: 'Checking the existence of a file.',
            is_correct: false,
          },
        ],
      },
      {
        title: 'Which of the following PHP statements can be used to output HTML content?',
        name: 'question7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'echo',
            is_correct: true,
          },
          {
            label: 'if',
            is_correct: false,
          },
          {
            label: 'for',
            is_correct: false,
          },
          {
            label: 'while',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the purpose of the "nl2br" function in PHP?',
        name: 'question8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To perform mathematical calculations.',
            is_correct: false,
          },
          {
            label: 'To convert newlines to HTML line breaks.',
            is_correct: true,
          },
          {
            label: 'To check the length of a string.',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the output of the following PHP code?\n\n```php\n$text = "Hello\nWorld!";\necho nl2br($text);\n```',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'In PHP, which function can be used to output the length of a string?',
        name: 'question10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
    ],
  },
};

export default template;
