// templateData.ts
import { writable, get } from 'svelte/store';

interface Form {
  id: string;
  imgUrl: string;
  templateName: string;
}

interface Question {
  title: string;
  name: string;
  points: number;
  order: number;
  question_type: 'multipleChoice' | 'checkboxes' | 'paragraph';
  options: { label: string; value: boolean }[];
}

// Use the TypeScript interface when initializing the store
export const forms = writable<Form[]>(
  [
    {
      id: 'flsgklsf-355tecsg-fghdye-53t6fgdh-dghdghh',
      imgUrl:
        'https://ssl.gstatic.com/docs/templates/thumbnails/1xQF3s6EP0d58H-XJ7R440OpREKo4KqEapa0mkw43RPE_400_1.png',
      templateName: 'Template 1',
    },
    {
      id: '355tecsg-fghdye-flsgklsf-53t6fgdh-dghdghh',
      imgUrl:
        'https://ssl.gstatic.com/docs/templates/thumbnails/1kkUjv3G7-PgOEUPMTiKvKResxGxS7MTsy5Amj4b0Trw_400_1.png',
      templateName: 'Template 2',
    },
    {
      id: 'fghdye-dghdghh-355tecsg-flsgklsf-53t6fgdh',
      imgUrl:
        'https://ssl.gstatic.com/docs/templates/thumbnails/134dbGrMBrHFEfdPk5UpsZWEBZb7xJrOKRdESE58Fvcg_400_1.png',
      templateName: 'Template 3',
    },
    {
      id: 'dghdghh-53t6fgdh-fghdye-355tecsg-flsgklsf',
      imgUrl:
        'https://ssl.gstatic.com/docs/templates/thumbnails/1m0UYQl1LSGxl3sGsh9_xjim4hUYQ8BO_zbvcFXv1Qug_400_1.png',
      templateName: 'Template 4',
    },
  ],
);

export const mockQuestions = writable<Question[]>([
  {
    title: 'What is the purpose of comments in Python?',
    name: 'question1',
    points: 2,
    order: 0,
    question_type: 'multipleChoice', // RADIO
    options: [
      { label: 'To add color to your code', value: false },
      { label: 'To explain the code and make it more readable', value: true },
      { label: 'To hide code from others', value: false },
    ],
  },
  {
    title: 'Which symbol is used to start a single-line comment in Python?',
    name: 'question2',
    points: 2,
    order: 1,
    question_type: 'multipleChoice', // RADIO
    options: [
      { label: '//', value: false },
      { label: '/*', value: false },
      { label: '#', value: true },
    ],
  },
  {
    title: 'How do you write a multi-line comment in Python?',
    name: 'question3',
    points: 2,
    order: 2,
    question_type: 'multipleChoice', // RADIO
    options: [
      { label: '/* This is a comment */', value: false },
      { label: '// This is a comment //', value: false },
      { label: '""" This is a comment """', value: true },
    ],
  },
  {
    title: 'What is the correct way to comment out a single line of code in Python?',
    name: 'question4',
    points: 2,
    order: 3,
    question_type: 'checkboxes', // CHECKBOX
    options: [
      { label: 'Using a hash symbol (#)', value: true },
      { label: 'Using double slashes (//)', value: false },
      { label: 'Using triple quotes (\'\'\')', value: false },
    ],
  },
  {
    title: 'Explain the purpose of docstrings in Python.',
    name: 'question5',
    points: 2,
    order: 4,
    question_type: 'paragraph', // TEXTAREA
    options: [],
  },
  {
    title: 'What is the main purpose of writing comments in your code?',
    name: 'question6',
    points: 2,
    order: 5,
    question_type: 'multipleChoice', // RADIO
    options: [
      { label: 'To increase the size of your code', value: false },
      { label: 'To make your code look more colorful', value: false },
      { label: 'To make the code understandable for you and others', value: true },
    ],
  },
  {
    title: 'How can you comment out multiple lines of code in Python?',
    name: 'question7',
    points: 2,
    order: 6,
    question_type: 'checkboxes', // CHECKBOX
    options: [
      { label: 'Using a hash symbol (#)', value: false },
      { label: 'Using triple quotes (\'\'\')', value: true },
      { label: 'Using double slashes (//)', value: false },
    ],
  },
  {
    title: 'What is the purpose of triple-quoted strings in Python?',
    name: 'question8',
    points: 2,
    order: 7,
    question_type: 'multipleChoice', // RADIO
    options: [
      { label: 'To define a string that spans multiple lines', value: true },
      { label: 'To make your code more colorful', value: false },
      { label: 'To indicate the end of a Python program', value: false },
    ],
  },
  {
    title: 'Explain the purpose of inline comments in Python.',
    name: 'question9',
    points: 2,
    order: 8,
    question_type: 'paragraph', // TEXTAREA
    options: [],
  },
  {
    title: 'Which type of comment is used for documenting functions, classes, and modules in Python?',
    name: 'question10',
    points: 2,
    order: 9,
    question_type: 'multipleChoice', // RADIO
    options: [
      { label: 'Single-line comments', value: false },
      { label: 'Multi-line comments', value: false },
      { label: 'Docstrings', value: true },
    ],
  },
])

export const readableForms = get(forms);
