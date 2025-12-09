import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'Python Booleans Quiz',
  description: 'Test your knowledge of Python booleans',
  questionnaire: {
    questions: [
      {
        title: 'What is a boolean in Python?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A data type for representing true and false values', is_correct: true },
          { label: 'A numeric data type', is_correct: false },
          { label: 'A string data type', is_correct: false }
        ]
      },
      {
        title: 'Which of the following values is a valid boolean value in Python?',
        name: 'question2',
        points: 2,
        order: 1,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: '0', is_correct: false },
          { label: 'True', is_correct: true },
          { label: 'False', is_correct: true },
          { label: '1', is_correct: false }
        ]
      },
      {
        title: 'What is the result of the expression "10 > 5" in Python?',
        name: 'question3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'True', is_correct: true },
          { label: 'False', is_correct: false }
        ]
      },
      {
        title: 'Explain the concept of boolean operators in Python.',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'Which operator is used for logical AND in Python?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '&&', is_correct: false },
          { label: 'and', is_correct: true },
          { label: '||', is_correct: false }
        ]
      },
      {
        title: 'What is the result of "True and False" in Python?',
        name: 'question6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'True', is_correct: false },
          { label: 'False', is_correct: true }
        ]
      },
      {
        title: 'Which operator is used for logical OR in Python?',
        name: 'question7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '||', is_correct: false },
          { label: 'or', is_correct: true },
          { label: '&&', is_correct: false }
        ]
      },
      {
        title: 'Explain the concept of truthy and falsy values in Python.',
        name: 'question8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the result of "not True" in Python?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'True', is_correct: false },
          { label: 'False', is_correct: true }
        ]
      },
      {
        title: 'Which operator is used for logical NOT in Python?',
        name: 'question10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'not', is_correct: true },
          { label: '!', is_correct: false },
          { label: 'and', is_correct: false }
        ]
      }
    ]
  }
};

export default template;
