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
}

interface Form {
  id: string;
  imgUrl: string;
  name: string;
  questions: Question[];
}

export const forms = writable<Form[]>(
  [
    {
      id: 'flsgklsf-355tecsg-fghdye-53t6fgdh-dghdghh',
      imgUrl:
        'https://ssl.gstatic.com/docs/templates/thumbnails/1xQF3s6EP0d58H-XJ7R440OpREKo4KqEapa0mkw43RPE_400_1.png',
      name: 'React',
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
        },
        {
          title: 'Write an example of a single-line arrow function in JavaScript.',
          name: 'q7',
          points: 1,
          order: 6,
          question_type: QuestionType.Paragraph, // TEXTAREA
          options: [],
        },
        {
          title: 'Explain the concept of lexical scoping in arrow functions.',
          name: 'q8',
          points: 1,
          order: 7,
          question_type: QuestionType.Paragraph, // TEXTAREA
          options: [],
        },
        {
          title: 'What is the difference between regular functions and arrow functions in terms of "this" binding?',
          name: 'q9',
          points: 1,
          order: 8,
          question_type: QuestionType.Paragraph, // TEXTAREA
          options: [],
        },
        {
          title: 'List some potential drawbacks of using arrow functions in certain situations.',
          name: 'q10',
          points: 1,
          order: 9,
          question_type: QuestionType.Paragraph, // TEXTAREA
          options: [],
        },
      ]
    },
    {
      id: '355tecsg-fghdye-flsgklsf-53t6fgdh-dghdghh',
      imgUrl:
        'https://ssl.gstatic.com/docs/templates/thumbnails/1kkUjv3G7-PgOEUPMTiKvKResxGxS7MTsy5Amj4b0Trw_400_1.png',
      name: 'Node Js',
      questions: [
        {
          title: 'What is the purpose of creating tables in a MySQL database?',
          name: 'question1',
          points: 2,
          order: 0,
          question_type: QuestionType.MultipleChoice, // RADIO
          options: [
            {
              label: 'To store and organize data in a structured format.',
              value: true,
            },
            {
              label: 'To display images on the website.',
              value: false,
            },
            {
              label: 'To create HTML documents for the web.',
              value: false,
            },
          ],
        },
        {
          title: 'Which SQL statement is used to create a new table in a MySQL database?',
          name: 'question2',
          points: 1,
          order: 1,
          question_type: QuestionType.MultipleChoice, // RADIO
          options: [
            {
              label: 'INSERT TABLE',
              value: false,
            },
            {
              label: 'CREATE TABLE',
              value: true,
            },
            {
              label: 'ADD TABLE',
              value: false,
            },
          ],
        },
        {
          title: 'What is the purpose of the "AUTO_INCREMENT" attribute in a MySQL table?',
          name: 'question3',
          points: 1,
          order: 2,
          question_type: QuestionType.Checkboxes, // CHECKBOX
          options: [
            {
              label: 'To automatically insert data into the table.',
              value: false,
            },
            {
              label: 'To generate unique values for a column when inserting data.',
              value: true,
            },
            {
              label: 'To sort data in the table in ascending order.',
              value: false,
            },
          ],
        },
        {
          title: 'Explain the purpose of primary keys in MySQL tables.',
          name: 'question4',
          points: 2,
          order: 3,
          question_type: QuestionType.Paragraph, // TEXTAREA
          options: [],
        },
        {
          title: 'What is the purpose of the "FOREIGN KEY" constraint in MySQL tables?',
          name: 'question5',
          points: 2,
          order: 4,
          question_type: QuestionType.MultipleChoice, // RADIO
          options: [
            {
              label: 'To restrict access to the table.',
              value: false,
            },
            {
              label: 'To enforce referential integrity between tables.',
              value: true,
            },
            {
              label: 'To define the primary key of the table.',
              value: false,
            },
          ],
        },
        {
          title: 'How do you add a new column to an existing MySQL table?',
          name: 'question6',
          points: 1,
          order: 5,
          question_type: QuestionType.MultipleChoice, // RADIO
          options: [
            {
              label: 'By using the "ALTER TABLE" statement.',
              value: true,
            },
            {
              label: 'By creating a new table and copying the data.',
              value: false,
            },
            {
              label: 'By deleting and recreating the table.',
              value: false,
            },
          ],
        },
        {
          title: 'What is the purpose of the "UNIQUE" constraint in MySQL columns?',
          name: 'question7',
          points: 1,
          order: 6,
          question_type: QuestionType.Checkboxes, // CHECKBOX
          options: [
            {
              label: 'To ensure that the column contains only unique values.',
              value: true,
            },
            {
              label: 'To set the default value for the column.',
              value: false,
            },
            {
              label: 'To specify the data type of the column.',
              value: false,
            },
          ],
        },
        {
          title: 'What is the purpose of the "DROP TABLE" statement in MySQL?',
          name: 'question8',
          points: 1,
          order: 7,
          question_type: QuestionType.Checkboxes, // CHECKBOX
          options: [
            {
              label: 'To create a new table.',
              value: false,
            },
            {
              label: 'To delete an existing table and its data.',
              value: true,
            },
            {
              label: 'To modify the structure of an existing table.',
              value: false,
            },
          ],
        },
        {
          title: 'How can you add a foreign key constraint to a MySQL table column?',
          name: 'question9',
          points: 2,
          order: 8,
          question_type: QuestionType.MultipleChoice, // RADIO
          options: [
            {
              label: 'By using the "ADD FOREIGN KEY" statement.',
              value: false,
            },
            {
              label: 'By specifying the foreign key constraint when creating the table.',
              value: true,
            },
            {
              label: 'By renaming the column to match the primary key of another table.',
              value: false,
            },
          ],
        },
        {
          title: 'What is the purpose of indexing columns in MySQL tables?',
          name: 'question10',
          points: 2,
          order: 9,
          question_type: QuestionType.MultipleChoice, // RADIO
          options: [
            {
              label: 'To add graphical icons to the table.',
              value: false,
            },
            {
              label: 'To improve query performance by speeding up data retrieval.',
              value: true,
            },
            {
              label: 'To create a backup of the table.',
              value: false,
            },
          ],
        },
      ]
    },
    {
      id: 'fghdye-dghdghh-355tecsg-flsgklsf-53t6fgdh',
      imgUrl:
        'https://ssl.gstatic.com/docs/templates/thumbnails/134dbGrMBrHFEfdPk5UpsZWEBZb7xJrOKRdESE58Fvcg_400_1.png',
      name: 'Typescript',
      questions: [
        {
          title: 'What is a TypeScript tuple?',
          name: 'q1',
          points: 1,
          order: 1,
          question_type: QuestionType.MultipleChoice, // RADIO type
          options: [
            {
              label: 'A data structure that stores a fixed-size collection of elements of mixed types.',
              value: true
            },
            {
              label: 'A data structure that stores an unlimited number of elements of the same type.',
              value: false
            },
            {
              label: 'A data structure that stores elements of the same type and size.',
              value: false
            },
            {
              label: 'A data structure that stores elements of mixed types without size restrictions.',
              value: false
            }
          ]
        },
        {
          title: 'How do you define a tuple type in TypeScript?',
          name: 'q2',
          points: 1,
          order: 2,
          question_type: QuestionType.MultipleChoice, // RADIO type
          options: [
            {
              label: 'Using the `Tuple` keyword',
              value: false
            },
            {
              label: 'Using the `tuple` keyword',
              value: true
            },
            {
              label: 'Using the `array` keyword',
              value: false
            },
            {
              label: 'Using the `list` keyword',
              value: false
            }
          ]
        },
        {
          title: 'How can you access elements of a TypeScript tuple?',
          name: 'q3',
          points: 1,
          order: 3,
          question_type: QuestionType.MultipleChoice, // RADIO type
          options: [
            {
              label: 'By using the dot notation (e.g., `tuple.0`)',
              value: false
            },
            {
              label: 'By using square brackets (e.g., `tuple[0]`)',
              value: true
            },
            {
              label: 'By using parentheses (e.g., `tuple(0)`)',
              value: false
            },
            {
              label: 'By using the `get` method (e.g., `tuple.get(0)`)',
              value: false
            }
          ]
        },
        {
          title: 'Which of the following statements is true about TypeScript tuples?',
          name: 'q4',
          points: 1,
          order: 4,
          question_type: QuestionType.MultipleChoice, // RADIO type
          options: [
            {
              label: 'Tuples allow elements to be added or removed dynamically.',
              value: false
            },
            {
              label: 'Tuples can contain elements of different types but must be of fixed size.',
              value: true
            },
            {
              label: 'Tuples are resizable arrays with dynamic types.',
              value: false
            },
            {
              label: 'Tuples can only contain elements of the same type.',
              value: false
            }
          ]
        },
        {
          title: 'What is the correct way to initialize a TypeScript tuple?',
          name: 'q5',
          points: 1,
          order: 5,
          question_type: QuestionType.MultipleChoice, // RADIO type
          options: [
            {
              label: 'const myTuple: tuple = [1, "two", 3]',
              value: false
            },
            {
              label: 'const myTuple: [number, string, number] = [1, "two", 3]',
              value: true
            },
            {
              label: 'const myTuple: (number, string, number) = [1, "two", 3]',
              value: false
            },
            {
              label: 'const myTuple: tuple<number, string, number> = [1, "two", 3]',
              value: false
            }
          ]
        },
        {
          title: 'In a TypeScript tuple, what does the number in the tuple type represent?',
          name: 'q6',
          points: 1,
          order: 6,
          question_type: QuestionType.MultipleChoice, // RADIO type
          options: [
            {
              label: 'The maximum number of elements that the tuple can hold.',
              value: true
            },
            {
              label: 'The index of the first element in the tuple.',
              value: false
            },
            {
              label: 'The type of the elements in the tuple.',
              value: false
            },
            {
              label: 'The size of the tuple in memory.',
              value: false
            }
          ]
        },
        {
          title: 'How do you update a value in a TypeScript tuple?',
          name: 'q7',
          points: 1,
          order: 7,
          question_type: QuestionType.MultipleChoice, // RADIO type
          options: [
            {
              label: 'You cannot update values in a tuple; tuples are immutable.',
              value: true
            },
            {
              label: 'By using the `update` method on the tuple.',
              value: false
            },
            {
              label: 'By directly assigning a new value to the tuple element.',
              value: false
            },
            {
              label: 'By using the `set` method on the tuple.',
              value: false
            }
          ]
        },
        {
          title: 'What is the advantage of using TypeScript tuples over arrays?',
          name: 'q8',
          points: 1,
          order: 8,
          question_type: QuestionType.MultipleChoice, // RADIO type
          options: [
            {
              label: 'Tuples have a dynamic size, making them more flexible.',
              value: false
            },
            {
              label: 'Tuples allow you to store elements of different types.',
              value: true
            },
            {
              label: 'Tuples have better performance for iteration.',
              value: false
            },
            {
              label: 'Tuples provide built-in sorting methods.',
              value: false
            }
          ]
        },
        {
          title: 'Can TypeScript tuples be used to represent key-value pairs?',
          name: 'q9',
          points: 1,
          order: 9,
          question_type: QuestionType.MultipleChoice, // RADIO type
          options: [
            {
              label: 'Yes, by using the `key` and `value` properties of a tuple element.',
              value: false
            },
            {
              label: 'Yes, by using tuples with two elements where the first element is the key and the second element is the value.',
              value: true
            },
            {
              label: 'No, tuples are not suitable for representing key-value pairs.',
              value: false
            },
            {
              label: 'No, TypeScript does not support key-value pairs in tuples.',
              value: false
            }
          ]
        },
        {
          title: 'Which TypeScript version introduced tuple types?',
          name: 'q10',
          points: 1,
          order: 10,
          question_type: QuestionType.MultipleChoice, // RADIO type
          options: [
            {
              label: 'TypeScript has always had tuple types.',
              value: false
            },
            {
              label: 'TypeScript 2.0',
              value: true
            },
            {
              label: 'TypeScript 3.0',
              value: false
            },
            {
              label: 'TypeScript 4.0',
              value: false
            }
          ]
        }
      ]
    },
    {
      id: 'dghdghh-53t6fgdh-fghdye-355tecsg-flsgklsf',
      imgUrl:
        'https://ssl.gstatic.com/docs/templates/thumbnails/1m0UYQl1LSGxl3sGsh9_xjim4hUYQ8BO_zbvcFXv1Qug_400_1.png',
      name: 'Python',
      questions: [
        {
          title: 'What is the purpose of comments in Python?',
          name: 'question1',
          points: 2,
          order: 0,
          question_type: QuestionType.MultipleChoice, // RADIO type
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
          question_type: QuestionType.MultipleChoice, // RADIO type
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
          question_type: QuestionType.MultipleChoice, // RADIO type
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
          question_type: QuestionType.Checkboxes, // CHECKBOX
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
          question_type: QuestionType.Paragraph, // TEXTAREA
          options: [],
        },
        {
          title: 'What is the main purpose of writing comments in your code?',
          name: 'question6',
          points: 2,
          order: 5,
          question_type: QuestionType.MultipleChoice, // RADIO
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
          question_type: QuestionType.Checkboxes, // CHECKBOX
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
          question_type: QuestionType.MultipleChoice, // RADIO
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
          question_type: QuestionType.ShortAnswer, // TEXTAREA
          options: [],
        },
        {
          title: 'Which type of comment is used for documenting functions, classes, and modules in Python?',
          name: 'question10',
          points: 2,
          order: 9,
          question_type: QuestionType.MultipleChoice, // RADIO
          options: [
            { label: 'Single-line comments', value: false },
            { label: 'Multi-line comments', value: false },
            { label: 'Docstrings', value: true },
          ],
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