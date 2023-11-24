import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Node.js Events Quiz',
  description: 'Test your knowledge of Node.js events and event handling.',
  questionnaire: {
    questions: [
      {
        title: 'What are events in Node.js?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Functions that are triggered when an HTTP request is received.',
            is_correct: false,
          },
          {
            label: 'Actions or occurrences that can be detected and responded to in Node.js.',
            is_correct: true,
          },
          {
            label: 'External JavaScript libraries for handling animations.',
            is_correct: false,
          },
        ],
      },
      {
        title: 'How do you create a custom event emitter in Node.js?',
        name: 'question2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By instantiating the "EventEmitter" class.',
            is_correct: true,
          },
          {
            label: 'By using the "event.create()" function.',
            is_correct: false,
          },
          {
            label: 'By defining a new function.',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the purpose of the "on" method in the EventEmitter class?',
        name: 'question3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'To add a listener for a specific event.',
            is_correct: true,
          },
          {
            label: 'To emit an event.',
            is_correct: false,
          },
          {
            label: 'To remove a listener for an event.',
            is_correct: false,
          },
        ],
      },
      {
        title: 'Explain the difference between "addListener" and "on" methods in the EventEmitter class.',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'How can you remove an event listener in Node.js?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Using the "removeListener" method.',
            is_correct: true,
          },
          {
            label: 'By setting the listener to "null".',
            is_correct: false,
          },
          {
            label: 'By calling the "off" method.',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the purpose of the "once" method in the EventEmitter class?',
        name: 'question6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To add a one-time listener for an event.',
            is_correct: true,
          },
          {
            label: 'To emit an event multiple times.',
            is_correct: false,
          },
          {
            label: 'To remove a listener for an event.',
            is_correct: false,
          },
        ],
      },
      {
        title: 'How do you emit an event in Node.js?',
        name: 'question7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'Using the "event.emit()" method.',
            is_correct: true,
          },
          {
            label: 'By calling the event as a function.',
            is_correct: false,
          },
          {
            label: 'Using the "event.trigger()" method.',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the purpose of the "removeAllListeners" method?',
        name: 'question8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'To remove all listeners for a specific event.',
            is_correct: true,
          },
          {
            label: 'To remove all listeners for all events.',
            is_correct: true,
          },
          {
            label: 'To add listeners for all events.',
            is_correct: false,
          },
        ],
      },
      {
        title: 'How can you use the "EventEmitter" class to implement a custom event in your Node.js application?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By importing the "event" module.',
            is_correct: false,
          },
          {
            label: 'By extending the "EventEmitter" class.',
            is_correct: true,
          },
          {
            label: 'By using the "EventEmitter.create()" method.',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the purpose of the "error" event in Node.js?',
        name: 'question10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To handle errors that occur in asynchronous operations.',
            is_correct: true,
          },
          {
            label: 'To emit errors in the application.',
            is_correct: false,
          },
          {
            label: 'To trigger HTTP requests.',
            is_correct: false,
          },
        ],
      },
    ],
  },
};


export default template;
