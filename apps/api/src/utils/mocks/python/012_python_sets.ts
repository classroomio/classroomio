import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'Python Sets Quiz',
  description: 'Test your knowledge of Python sets',
  questionnaire: {
    questions: [
      {
        title: 'What is a Python set?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'An ordered collection of elements', is_correct: false },
          { label: 'An unordered collection of unique elements', is_correct: true },
          { label: 'A list with duplicate elements', is_correct: false }
        ]
      },
      {
        title: 'How do you declare a Python set?',
        name: 'question2',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'set x = {1, 2, 3}', is_correct: false },
          { label: 'x = {1, 2, 3}', is_correct: true },
          { label: 'x = set(1, 2, 3)', is_correct: false }
        ]
      },
      {
        title: 'Which of the following is a valid set declaration in Python?',
        name: 'question3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'myset = {1, 2, 3}', is_correct: true },
          { label: 'myset = [1, 2, 3]', is_correct: false },
          { label: "myset = ('apple', 'banana', 'cherry')", is_correct: false }
        ]
      },
      {
        title: 'Explain the concept of uniqueness in sets in Python.',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How do you add an item to a set in Python?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'add()', is_correct: true },
          { label: 'append()', is_correct: false },
          { label: 'insert()', is_correct: false }
        ]
      },
      {
        title: 'What is the result of {1, 2, 3} | {3, 4, 5} in Python?',
        name: 'question6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '{1, 2, 3, 4, 5}', is_correct: true },
          { label: '12, 345', is_correct: false },
          { label: '{3}', is_correct: false }
        ]
      },
      {
        title: 'Explain the concept of set methods in Python.',
        name: 'question7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How do you remove an item from a set in Python?',
        name: 'question8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'remove()', is_correct: true },
          { label: 'delete()', is_correct: false },
          { label: 'pop()', is_correct: false }
        ]
      },
      {
        title: 'What is the result of {1, 2, 3, 4, 5}.difference({3, 4, 5}) in Python?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '{1, 2}', is_correct: true },
          { label: '{3, 4, 5}', is_correct: false },
          { label: '{}', is_correct: false }
        ]
      },
      {
        title: 'Explain the concept of set comprehension in Python.',
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
