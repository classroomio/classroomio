import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'PHP Variables Quiz',
  description: 'Test your knowledge of PHP variables.',
  questionnaire: {
    questions: [
      {
        title: 'What is a variable in PHP?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'A fixed value.',
            is_correct: false
          },
          {
            label: 'A container for storing data.',
            is_correct: true
          },
          {
            label: 'A PHP function.',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you declare a variable in PHP?',
        name: 'question2',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Using the keyword "let".',
            is_correct: false
          },
          {
            label: 'Using the keyword "var".',
            is_correct: false
          },
          {
            label: 'Using the dollar sign "$" followed by the variable name.',
            is_correct: true
          }
        ]
      },
      {
        title: 'Which of the following is a valid variable name in PHP?',
        name: 'question3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: '$my-variable',
            is_correct: false
          },
          {
            label: '$my_variable',
            is_correct: true
          },
          {
            label: '$1variable',
            is_correct: false
          },
          {
            label: '$variable123',
            is_correct: true
          }
        ]
      },
      {
        title: 'What is the purpose of concatenation in PHP?',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To perform mathematical operations.',
            is_correct: false
          },
          {
            label: 'To combine two or more strings or values.',
            is_correct: true
          },
          {
            label: 'To create a new variable.',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which operator is used for concatenation in PHP?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: '.',
            is_correct: true
          },
          {
            label: '+',
            is_correct: false
          },
          {
            label: '++',
            is_correct: false
          },
          {
            label: '-',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the scope of a global variable in PHP?',
        name: 'question6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'It is accessible only within a function.',
            is_correct: false
          },
          {
            label: 'It is accessible throughout the entire script.',
            is_correct: true
          },
          {
            label: 'It is accessible only within a loop.',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which of the following is a superglobal variable in PHP?',
        name: 'question7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: '$my_variable',
            is_correct: false
          },
          {
            label: '$_SESSION',
            is_correct: true
          },
          {
            label: '$_POST',
            is_correct: true
          },
          {
            label: '$_local',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "unset" function in PHP?',
        name: 'question8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To define a new variable.',
            is_correct: false
          },
          {
            label: 'To destroy a session variable.',
            is_correct: false
          },
          {
            label: 'To unset a variable or free its memory.',
            is_correct: true
          }
        ]
      },
      {
        title: 'Which function is used to check if a variable is empty in PHP?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How do you display the value of a variable in PHP?',
        name: 'question10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      }
    ]
  }
};

export default template;
