import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'JavaScript Functions Quiz',
  description: 'Test your knowledge of JavaScript functions.',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of a JavaScript function?',
        name: 'q1',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'To declare variables',
            is_correct: false
          },
          {
            label: 'To define classes',
            is_correct: false
          },
          {
            label: 'To group code into reusable blocks',
            is_correct: true
          }
        ]
      },
      {
        title: 'How do you declare a named JavaScript function?',
        name: 'q2',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'function myFunction() {}',
            is_correct: true
          },
          {
            label: 'const myFunction = () => {}',
            is_correct: false
          },
          {
            label: 'const myFunction = function() {}',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which keyword is used to call a JavaScript function?',
        name: 'q3',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'return',
            is_correct: false
          },
          {
            label: 'function',
            is_correct: false
          },
          {
            label: 'call',
            is_correct: false
          },
          {
            label: 'invoke',
            is_correct: true
          }
        ]
      },
      {
        title: 'What is the syntax for defining an anonymous function in JavaScript?',
        name: 'q4',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'function() {}',
            is_correct: true
          },
          {
            label: 'const myFunction = () => {}',
            is_correct: false
          },
          {
            label: 'const myFunction = function() {}',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is a function parameter in JavaScript?',
        name: 'q5',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'A variable defined within a function',
            is_correct: false
          },
          {
            label: 'A value passed into a function when it is called',
            is_correct: true
          },
          {
            label: 'A function declared inside another function',
            is_correct: false
          }
        ]
      },
      {
        title: 'What does the "return" statement do in a JavaScript function?',
        name: 'q6',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'It ends the function execution',
            is_correct: false
          },
          {
            label: 'It defines a variable',
            is_correct: false
          },
          {
            label: 'It specifies the value to be returned from the function',
            is_correct: true
          }
        ]
      },
      {
        title: 'What is the scope of a variable declared with "var" inside a function?',
        name: 'q7',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Function scope (local)',
            is_correct: true
          },
          {
            label: 'Global scope',
            is_correct: false
          },
          {
            label: 'Block scope',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which keyword is used to define a function in JavaScript?',
        name: 'q8',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'function',
            is_correct: true
          },
          {
            label: 'declare',
            is_correct: false
          },
          {
            label: 'method',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is a callback function in JavaScript?',
        name: 'q9',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'A function that is called automatically',
            is_correct: false
          },
          {
            label: 'A function passed as an argument to another function',
            is_correct: true
          },
          {
            label: 'A function used for mathematical calculations',
            is_correct: false
          }
        ]
      },
      {
        title: 'How can you call a function named "myFunction" in JavaScript?',
        name: 'q10',
        points: 1,
        order: 10,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'myFunction()',
            is_correct: true
          },
          {
            label: 'call myFunction()',
            is_correct: false
          },
          {
            label: 'invoke myFunction()',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
