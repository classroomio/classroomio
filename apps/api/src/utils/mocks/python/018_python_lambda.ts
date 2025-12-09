import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'Python Lambda Functions Quiz',
  description: 'Test your knowledge of Python lambda functions',
  questionnaire: {
    questions: [
      {
        title: 'What is a lambda function in Python?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A type of list', is_correct: false },
          { label: 'A small anonymous function', is_correct: true },
          { label: 'A Python keyword', is_correct: false }
        ]
      },
      {
        title: 'How do you define a lambda function in Python?',
        name: 'question2',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'def my_lambda:', is_correct: false },
          { label: 'lambda my_lambda:', is_correct: true },
          { label: 'function my_lambda():', is_correct: false }
        ]
      },
      {
        title: 'What is the primary use of lambda functions in Python?',
        name: 'question3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To create global variables', is_correct: false },
          { label: 'To define classes', is_correct: false },
          { label: 'To create small, anonymous functions', is_correct: true }
        ]
      },
      {
        title: 'Explain the concept of "anonymous functions" in Python.',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How are lambda functions typically used in Python?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To define classes', is_correct: false },
          { label: 'To create global variables', is_correct: false },
          { label: 'As arguments for higher-order functions', is_correct: true }
        ]
      },
      {
        title: 'What is the syntax of a lambda function in Python?',
        name: 'question6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'lambda: expression', is_correct: false },
          { label: 'function: expression', is_correct: false },
          { label: 'lambda parameters: expression', is_correct: true }
        ]
      },
      {
        title: 'Explain the concept of "higher-order functions" in Python.',
        name: 'question7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Can a lambda function have multiple expressions?',
        name: 'question8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Yes', is_correct: false },
          { label: 'No', is_correct: true }
        ]
      },
      {
        title: 'How do you call a lambda function in Python?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Use the call() method', is_correct: false },
          { label: 'Use the lambda keyword', is_correct: false },
          { label: 'Use the function name followed by arguments', is_correct: true }
        ]
      },
      {
        title: 'Explain an example use case for lambda functions in Python.',
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
