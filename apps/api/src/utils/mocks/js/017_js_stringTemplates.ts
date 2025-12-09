import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'JavaScript String Templates Quiz',
  description: 'Test your knowledge of JavaScript string templates.',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of JavaScript string templates (template literals)?',
        name: 'q1',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'To create strings with embedded expressions',
            is_correct: true
          },
          {
            label: 'To create multiline strings',
            is_correct: false
          },
          {
            label: 'To create string arrays',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which syntax is used to create a JavaScript string template (template literal)?',
        name: 'q2',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Backticks (` `)',
            is_correct: true
          },
          {
            label: "Single quotes (' ')",
            is_correct: false
          },
          {
            label: 'Double quotes (" ")',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the syntax for embedding an expression inside a JavaScript string template?',
        name: 'q3',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: '${expression}',
            is_correct: true
          },
          {
            label: '{{expression}}',
            is_correct: false
          },
          {
            label: '%%expression%%',
            is_correct: false
          }
        ]
      },
      {
        title: 'In a JavaScript string template, can you embed multiple expressions within a single template?',
        name: 'q4',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Yes, you can embed multiple expressions within a single template.',
            is_correct: true
          },
          {
            label: 'No, only one expression is allowed per template.',
            is_correct: false
          },
          {
            label: 'Yes, but expressions must be enclosed in double braces {{ }}.',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which of the following is a valid example of a JavaScript string template with an embedded expression?',
        name: 'q5',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'const name = "Alice";\nconst greeting = `Hello, ${name}!`;',
            is_correct: true
          },
          {
            label: 'const name = "Alice";\nconst greeting = "Hello, ${name}!";',
            is_correct: false
          },
          {
            label: 'const name = "Alice";\nconst greeting = "Hello, ${name}!";',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the advantage of using JavaScript string templates over traditional string concatenation?',
        name: 'q6',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Easier to read and maintain',
            is_correct: true
          },
          {
            label: 'Faster performance',
            is_correct: false
          },
          {
            label: 'Supports more data types',
            is_correct: false
          }
        ]
      },
      {
        title:
          'In a JavaScript string template, can you include line breaks (multiline text) without escaping characters?',
        name: 'q7',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Yes, you can include line breaks without escaping characters.',
            is_correct: true
          },
          {
            label: 'No, line breaks must be escaped with \\n.',
            is_correct: false
          },
          {
            label: 'Yes, but line breaks must be enclosed in double braces {{ }}.',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which character is used for escaping within a JavaScript string template?',
        name: 'q8',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: '\\',
            is_correct: true
          },
          {
            label: '/',
            is_correct: false
          },
          {
            label: '^',
            is_correct: false
          }
        ]
      },
      {
        title:
          'What is the result of evaluating the following JavaScript string template?\n\n```\nconst x = 5;\nconst result = `The value of x is ${x * 2}`;\n```',
        name: 'q9',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'The value of result is "The value of x is 10".',
            is_correct: true
          },
          {
            label: 'An error occurs because expressions cannot be used in string templates.',
            is_correct: false
          },
          {
            label: 'The value of result is "The value of x is 5 * 2".',
            is_correct: false
          }
        ]
      },
      {
        title:
          'Which method is used to trim whitespace from the beginning and end of a string within a JavaScript string template?',
        name: 'q10',
        points: 1,
        order: 10,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'trim()',
            is_correct: true
          },
          {
            label: 'trimEnd()',
            is_correct: false
          },
          {
            label: 'trimStart()',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
