import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'JavaScript Data Types Quiz',
  description: 'Test your knowledge of JavaScript data types.',
  questionnaire: {
    questions: [
      {
        title: 'What is the data type of the value "Hello, World!"?',
        name: 'q1',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'String',
            is_correct: true
          },
          {
            label: 'Number',
            is_correct: false
          },
          {
            label: 'Boolean',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you declare a variable in JavaScript?',
        name: 'q2',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'var variableName;',
            is_correct: true
          },
          {
            label: 'variable variableName;',
            is_correct: false
          },
          {
            label: 'let variableName;',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the data type of the value 42?',
        name: 'q3',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'String',
            is_correct: false
          },
          {
            label: 'Number',
            is_correct: true
          },
          {
            label: 'Boolean',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which operator is used to concatenate strings in JavaScript?',
        name: 'q4',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: '+',
            is_correct: true
          },
          {
            label: '&',
            is_correct: false
          },
          {
            label: '|',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the data type of the value true?',
        name: 'q5',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'String',
            is_correct: false
          },
          {
            label: 'Number',
            is_correct: false
          },
          {
            label: 'Boolean',
            is_correct: true
          }
        ]
      },
      {
        title: 'How do you declare a constant variable in JavaScript?',
        name: 'q6',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'const variableName;',
            is_correct: true
          },
          {
            label: 'let variableName;',
            is_correct: false
          },
          {
            label: 'var variableName;',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the data type of the value null?',
        name: 'q7',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'String',
            is_correct: false
          },
          {
            label: 'Number',
            is_correct: false
          },
          {
            label: 'Object',
            is_correct: true
          }
        ]
      },
      {
        title: 'What is the data type of the value undefined?',
        name: 'q8',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'String',
            is_correct: false
          },
          {
            label: 'Number',
            is_correct: false
          },
          {
            label: 'Undefined',
            is_correct: true
          }
        ]
      },
      {
        title: 'What is the data type of the value [1, 2, 3]?',
        name: 'q9',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'String',
            is_correct: false
          },
          {
            label: 'Array',
            is_correct: true
          },
          {
            label: 'Object',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you comment a single line in JavaScript?',
        name: 'q10',
        points: 1,
        order: 10,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: '// This is a comment',
            is_correct: true
          },
          {
            label: '/* This is a comment */',
            is_correct: false
          },
          {
            label: '# This is a comment',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
