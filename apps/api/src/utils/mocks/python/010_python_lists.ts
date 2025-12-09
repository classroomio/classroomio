import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'Python Lists Quiz',
  description: 'Test your knowledge of Python lists',
  questionnaire: {
    questions: [
      {
        title: 'What is a Python list?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A data structure that stores elements of the same type', is_correct: false },
          {
            label: 'An ordered collection of elements, which can be of any type',
            is_correct: true
          },
          { label: 'A string with comma-separated values', is_correct: false }
        ]
      },
      {
        title: 'How do you declare an empty list in Python?',
        name: 'question2',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'list x = []', is_correct: false },
          { label: 'x = list()', is_correct: true },
          { label: 'list x', is_correct: false }
        ]
      },
      {
        title: 'Which of the following is a valid list declaration in Python?',
        name: 'question3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'mylist = [1, 2, 3]', is_correct: true },
          { label: 'mylist = (1, 2, 3)', is_correct: false },
          { label: 'mylist = 1, 2, 3', is_correct: false },
          { label: "mylist = ['apple', 'banana', 'cherry']", is_correct: true }
        ]
      },
      {
        title: 'Explain the concept of list indexing in Python.',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How do you add an item to the end of a list in Python?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'add()', is_correct: false },
          { label: 'append()', is_correct: true },
          { label: 'insert()', is_correct: false }
        ]
      },
      {
        title: 'What is the result of ["apple", "banana"] + ["cherry", "date"] in Python?',
        name: 'question6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: "['apple', 'banana', 'cherry', 'date']", is_correct: true },
          { label: "['apple', 'banana'] ['cherry', 'date']", is_correct: false },
          { label: "['apple', 'banana', ['cherry', 'date']]", is_correct: false }
        ]
      },
      {
        title: 'Explain the concept of list methods in Python.',
        name: 'question7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the result of [1, 2, 3, 4, 5][1:4] in Python?',
        name: 'question8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '[2, 3, 4]', is_correct: true },
          { label: '[1, 2, 3]', is_correct: false },
          { label: '[1, 2, 3, 4, 5]', is_correct: false }
        ]
      },
      {
        title: 'How do you remove an item from a list in Python?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'remove()', is_correct: false },
          { label: 'delete()', is_correct: false },
          { label: 'pop()', is_correct: true }
        ]
      },
      {
        title: 'Explain the concept of list comprehension in Python.',
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
