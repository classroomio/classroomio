import { writable, get } from 'svelte/store';

export enum QuestionType {
  Checkboxes = 'checkboxes',
  ShortAnswer = 'shortAnswer',
  Paragraph = 'paragraph',
  MultipleChoice = 'multipleChoice',
  Dropdown = 'dropdown',
  FileUpload = 'fileUpload',
  LinearScale = 'linearScale',
  MultipleChoiceGrid = 'multipleChoiceGrid',
  CheckboxGrid = 'checkboxGrid',
  Date = 'date',
  Time = 'time',
}
interface Question {
  title: string;
  name: string;
  points: number;
  order: number;
  question_type: QuestionType;
  options: { label: string; value: boolean }[];
  image: string;
  video: string;
  isRequired: boolean;
}

interface Form {
  id: string;
  title: string;
  imgUrl: string;
  questions: Question[];
}

export const forms = writable<Form[]>(
  [
    {
      id: 'flsgklsf-355tecsg-fghdye-53t6fgdh-dghdghh',
      imgUrl:
        'https://ssl.gstatic.com/docs/templates/thumbnails/1xQF3s6EP0d58H-XJ7R440OpREKo4KqEapa0mkw43RPE_400_1.png',
      title: 'React',
      questions: [
        {
          title: 'What is an arrow function in ES6?',
          name: 'q1',
          points: 1,
          order: 0,
          question_type: QuestionType.MultipleChoice, // RADIO
          options: [
            { label: 'A traditional function', value: false },
            { label: 'A function expression', value: false },
            { label: 'A concise way to write functions', value: true },
          ],
          image: '',
          video: '',
          isRequired: false
        },
        {
          title: 'Which of the following statements about arrow functions is correct?',
          name: 'q2',
          points: 1,
          order: 1,
          question_type: QuestionType.MultipleChoice, // RADIO
          options: [
            { label: 'Arrow functions can have their own "this" value', value: false },
            { label: 'Arrow functions cannot have parameters', value: false },
            { label: 'Arrow functions do not have their own "this" value', value: true },
          ],
          image: '',
          video: '',
          isRequired: false
        },
        {
          title: 'How do you write a multi-line arrow function in JavaScript?',
          name: 'q3',
          points: 1,
          order: 2,
          question_type: QuestionType.MultipleChoice, // RADIO
          options: [
            { label: 'Using parentheses around the function body', value: false },
            { label: 'Using curly braces around the function body', value: true },
            { label: 'Using square brackets around the function body', value: false },
          ],
          image: '',
          video: '',
          isRequired: false
        },
        {
          title: 'What is the main advantage of using arrow functions in React components?',
          name: 'q4',
          points: 1,
          order: 3,
          question_type: QuestionType.MultipleChoice, // RADIO
          options: [
            { label: 'They have a shorter syntax', value: true },
            { label: 'They can be asynchronous', value: false },
            { label: 'They automatically bind "this"', value: false },
          ],
          image: '',
          video: '',
          isRequired: false
        },
        {
          title: 'When should you NOT use an arrow function for a class method in React?',
          name: 'q5',
          points: 1,
          order: 4,
          question_type: QuestionType.MultipleChoice, // RADIO
          options: [
            { label: 'When you want to access "this"', value: true },
            { label: 'When the method is static', value: false },
            { label: 'When the method is a constructor', value: false },
          ],
          image: '',
          video: '',
          isRequired: false
        },
        {
          title: 'Select all valid use cases for arrow functions in JavaScript.',
          name: 'q6',
          points: 1,
          order: 5,
          question_type: QuestionType.Checkboxes, // CHECKBOX
          options: [
            { label: 'Defining methods in a class', value: true },
            { label: 'Creating event handlers', value: true },
            { label: 'Defining constructors', value: false },
            { label: 'Using in a "for" loop', value: true },
          ],
          image: '',
          video: '',
          isRequired: false
        },
        {
          title: 'Write an example of a single-line arrow function in JavaScript.',
          name: 'q7',
          points: 1,
          order: 6,
          question_type: QuestionType.Paragraph, // TEXTAREA
          options: [],
          image: '',
          video: '',
          isRequired: false
        },
        {
          title: 'Explain the concept of lexical scoping in arrow functions.',
          name: 'q8',
          points: 1,
          order: 7,
          question_type: QuestionType.Paragraph, // TEXTAREA
          options: [],
          image: '',
          video: '',
          isRequired: false
        },
        {
          title: 'What is the difference between regular functions and arrow functions in terms of "this" binding?',
          name: 'q9',
          points: 1,
          order: 8,
          question_type: QuestionType.Paragraph, // TEXTAREA
          options: [],
          image: '',
          video: '',
          isRequired: false
        },
        {
          title: 'List some potential drawbacks of using arrow functions in certain situations.',
          name: 'q10',
          points: 1,
          order: 9,
          question_type: QuestionType.Paragraph, // TEXTAREA
          options: [],
          image: '',
          video: '',
          isRequired: false
        },
      ]
    },
  ],
);

export const readableForms = get(forms);

export const QuestionTypesArray = (Object.keys(QuestionType) as (keyof typeof QuestionType)[]).map((key) => ({
  label: key,
  value: QuestionType[key],
}));