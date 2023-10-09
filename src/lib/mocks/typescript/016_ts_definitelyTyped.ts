import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'TypeScript Definitely Typed Quiz',
  description: 'Test your knowledge of TypeScript Definitely Typed!',
  questionnaire: {
    questions: [
      {
        title: 'What is TypeScript Definitely Typed?',
        name: 'q1',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A built-in TypeScript feature', is_correct: false },
          { label: 'A website that hosts TypeScript libraries with type definitions', is_correct: true },
          { label: 'A TypeScript compiler option', is_correct: false },
        ],
      },
      {
        title: 'What is the purpose of Definitely Typed in TypeScript?',
        name: 'q2',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To create new TypeScript language features', is_correct: false },
          { label: 'To provide type definitions for JavaScript libraries', is_correct: true },
          { label: 'To optimize TypeScript code for performance', is_correct: false },
        ],
      },
      {
        title: 'How do you install type definitions for a library using Definitely Typed?',
        name: 'q3',
        points: 2,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'By running "npm install @types/library-name"', is_correct: true },
          { label: 'By manually copying and pasting type definitions into your project', is_correct: false },
          { label: 'By using the "tsc" command with a special flag', is_correct: false },
        ],
      },
      {
        title: 'Which TypeScript compiler option is used to automatically download type definitions for a library?',
        name: 'q4',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '--download-types', is_correct: false },
          { label: '--include-types', is_correct: false },
          { label: '--types', is_correct: true },
        ],
      },
      {
        title: 'What is the file extension for Definitely Typed type definition files?',
        name: 'q5',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: '.d.ts', is_correct: true },
          { label: '.ts', is_correct: false },
          { label: '.def', is_correct: false },
        ],
      },
      {
        title: 'In a Definitely Typed type definition file, what does the "declare" keyword indicate?',
        name: 'q6',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'That the type definition is private and cannot be accessed', is_correct: false },
          { label: 'That the type definition is for external code and not part of the current project', is_correct: true },
          { label: 'That the type definition is for internal code and should not be used externally', is_correct: false },
        ],
      },
      {
        title: 'What is the primary benefit of using Definitely Typed in TypeScript projects?',
        name: 'q7',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'It reduces the size of the compiled JavaScript files', is_correct: false },
          { label: 'It ensures that all code is written in TypeScript', is_correct: false },
          { label: 'It provides type safety and auto-completion for JavaScript libraries', is_correct: true },
        ],
      },
      {
        title: 'Which command is used to search for type definitions on Definitely Typed?',
        name: 'q8',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'npm search @types', is_correct: false },
          { label: 'npm install @types', is_correct: false },
          { label: 'npx search-definitely-typed', is_correct: true },
        ],
      },
      {
        title: 'What should you do if there is no available Definitely Typed type definition for a library?',
        name: 'q9',
        points: 2,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Manually create your own type definition file', is_correct: true },
          { label: 'Abandon the use of the library in your project', is_correct: false },
          { label: 'Use the "any" type to bypass type checking', is_correct: false },
        ],
      },
      {
        title: 'How can you contribute to Definitely Typed by providing type definitions for a library?',
        name: 'q10',
        points: 2,
        order: 10,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Submit a pull request to the Definitely Typed repository with your type definitions', is_correct: true },
          { label: 'Send an email to the Definitely Typed maintainers', is_correct: false },
          { label: 'Post the type definitions on a personal blog', is_correct: false },
        ],
      },
    ],
  },
};

export default template;
