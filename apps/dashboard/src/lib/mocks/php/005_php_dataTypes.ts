import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'PHP Data Types Quiz',
  description: 'Test your knowledge of PHP data types.',
  questionnaire: {
    questions: [
      {
        title: 'What is the data type of the value 42 in PHP?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'String',
            is_correct: false
          },
          {
            label: 'Integer',
            is_correct: true
          },
          {
            label: 'Boolean',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which of the following is NOT a valid PHP data type?',
        name: 'question2',
        points: 2,
        order: 1,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'Array',
            is_correct: false
          },
          {
            label: 'Object',
            is_correct: false
          },
          {
            label: 'Float',
            is_correct: false
          },
          {
            label: 'Character',
            is_correct: true
          }
        ]
      },
      {
        title: 'How do you declare a floating-point number in PHP?',
        name: 'question3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: '$x = 5;',
            is_correct: false
          },
          {
            label: '$x = "5";',
            is_correct: false
          },
          {
            label: '$x = 5.0;',
            is_correct: true
          },
          {
            label: '$x = true;',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which data type is used to store a sequence of characters in PHP?',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Boolean',
            is_correct: false
          },
          {
            label: 'Integer',
            is_correct: false
          },
          {
            label: 'String',
            is_correct: true
          },
          {
            label: 'Array',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the data type of the value "true" in PHP?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'String',
            is_correct: false
          },
          {
            label: 'Integer',
            is_correct: false
          },
          {
            label: 'Boolean',
            is_correct: true
          },
          {
            label: 'Float',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which data type is used to store a list of values in PHP?',
        name: 'question6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Array',
            is_correct: true
          },
          {
            label: 'String',
            is_correct: false
          },
          {
            label: 'Object',
            is_correct: false
          },
          {
            label: 'Float',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you declare a constant in PHP?',
        name: 'question7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Which data type is used to represent a date and time in PHP?',
        name: 'question8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'String',
            is_correct: false
          },
          {
            label: 'Integer',
            is_correct: false
          },
          {
            label: 'Date',
            is_correct: false
          },
          {
            label: 'DateTime',
            is_correct: true
          }
        ]
      },
      {
        title: 'How do you check the data type of a variable in PHP?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Which data type is used to store a single character in PHP?',
        name: 'question10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'String',
            is_correct: true
          },
          {
            label: 'Character',
            is_correct: false
          },
          {
            label: 'Integer',
            is_correct: false
          },
          {
            label: 'Boolean',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
