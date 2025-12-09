import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'TypeScript Generics Quiz',
  description: 'Test your knowledge of TypeScript generics!',
  questionnaire: {
    questions: [
      {
        title: 'What are generics in TypeScript?',
        name: 'q1',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A type of fruit', is_correct: false },
          { label: 'A way to make functions and classes more reusable', is_correct: true },
          { label: 'A type of loop', is_correct: false }
        ]
      },
      {
        title: 'How do you declare a generic type parameter in TypeScript?',
        name: 'q2',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '<T>', is_correct: true },
          { label: '[T]', is_correct: false },
          { label: '{T}', is_correct: false }
        ]
      },
      {
        title: 'What is the purpose of generics in TypeScript?',
        name: 'q3',
        points: 2,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To specify the return type of a function', is_correct: false },
          {
            label: 'To create reusable functions and classes that work with different types',
            is_correct: true
          },
          { label: 'To define the structure of an object', is_correct: false }
        ]
      },
      {
        title: 'How do you use a generic type parameter in a function in TypeScript?',
        name: 'q4',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'By enclosing it in square brackets like [T]', is_correct: false },
          { label: 'By enclosing it in angle brackets like <T>', is_correct: true },
          { label: 'By using curly braces like {T}', is_correct: false }
        ]
      },
      {
        title: 'What is the purpose of specifying a generic type constraint in TypeScript?',
        name: 'q5',
        points: 2,
        order: 5,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'To limit the types that can be used with the generic', is_correct: true },
          { label: 'To allow any type to be used with the generic', is_correct: false },
          { label: 'To specify the default type for the generic', is_correct: false }
        ]
      },
      {
        title: 'How do you declare a generic class in TypeScript?',
        name: 'q6',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'class MyClass<T> {}', is_correct: true },
          { label: 'interface MyClass<T> {}', is_correct: false },
          { label: 'type MyClass<T> = {};', is_correct: false }
        ]
      },
      {
        title: 'What is the purpose of the "extends" keyword in a generic type constraint?',
        name: 'q7',
        points: 2,
        order: 7,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'To specify a type that the generic type parameter must extend',
            is_correct: true
          },
          {
            label: 'To specify a type that the generic type parameter must be equal to',
            is_correct: false
          },
          {
            label: 'To specify a type that the generic type parameter must not extend',
            is_correct: false
          }
        ]
      },
      {
        title: 'Can you use generics with TypeScript arrays?',
        name: 'q8',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'No, generics can only be used with classes', is_correct: false },
          { label: 'Yes, you can create generic arrays', is_correct: true }
        ]
      },
      {
        title: 'What is the benefit of using generics with TypeScript arrays?',
        name: 'q9',
        points: 2,
        order: 9,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'Allows you to specify the type of elements in the array', is_correct: true },
          { label: 'Makes arrays faster', is_correct: false },
          { label: 'Prevents you from using arrays', is_correct: false }
        ]
      },
      {
        title: 'What is the syntax for using generics with TypeScript functions?',
        name: 'q10',
        points: 2,
        order: 10,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'function myFunction<T>() {}', is_correct: true },
          { label: 'function myFunction: <T>() => {}', is_correct: false },
          { label: 'function myFunction => <T>() {}', is_correct: false }
        ]
      }
    ]
  }
};

export default template;
