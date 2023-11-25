import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'JavaScript Events Quiz',
  description: 'Test your knowledge of JavaScript events.',
  questionnaire: {
    questions: [
      {
        title: 'What is an event in JavaScript?',
        name: 'q1',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'A function that performs a mathematical operation',
            is_correct: false
          },
          {
            label: 'A user action or occurrence that triggers a response in a web page',
            is_correct: true
          },
          {
            label: 'A data structure in JavaScript',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which of the following is not an example of a JavaScript event?',
        name: 'q2',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Clicking a button',
            is_correct: false
          },
          {
            label: 'Pressing a key',
            is_correct: false
          },
          {
            label: 'Declaring a variable',
            is_correct: true
          }
        ]
      },
      {
        title: 'How can you attach an event handler to an HTML element?',
        name: 'q3',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'Using the "setEventHandler" method',
            is_correct: false
          },
          {
            label: 'Using the "addEventListener" method',
            is_correct: true
          },
          {
            label: 'Using the "handleEvent" attribute',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "event.preventDefault()" method in JavaScript?',
        name: 'q4',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'To stop the event from occurring',
            is_correct: false
          },
          {
            label: 'To prevent the default behavior of an event',
            is_correct: true
          },
          {
            label: 'To trigger an event manually',
            is_correct: false
          }
        ]
      },
      {
        title:
          'Which HTML attribute is used to specify the JavaScript code to run when an event occurs?',
        name: 'q5',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'onclick',
            is_correct: true
          },
          {
            label: 'js-code',
            is_correct: false
          },
          {
            label: 'event-handler',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is event propagation in JavaScript?',
        name: 'q6',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'The process of handling multiple events simultaneously',
            is_correct: false
          },
          {
            label: 'The flow of events from the target element to the root element and back',
            is_correct: true
          },
          {
            label: 'The process of attaching event handlers to elements',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which method is used to remove an event listener from an element in JavaScript?',
        name: 'q7',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'removeEventListener()',
            is_correct: true
          },
          {
            label: 'detachEventListener()',
            is_correct: false
          },
          {
            label: 'unbindEvent()',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is event delegation in JavaScript?',
        name: 'q8',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'The process of creating new events',
            is_correct: false
          },
          {
            label: 'The process of handling events using delegation',
            is_correct: false
          },
          {
            label: 'The process of handling events on a parent element for child elements',
            is_correct: true
          }
        ]
      },
      {
        title: 'Which of the following is NOT a valid event type in JavaScript?',
        name: 'q9',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'click',
            is_correct: false
          },
          {
            label: 'hover',
            is_correct: true
          },
          {
            label: 'keydown',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "event.stopPropagation()" method in JavaScript?',
        name: 'q10',
        points: 1,
        order: 10,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'To start event propagation',
            is_correct: false
          },
          {
            label: 'To prevent the default behavior of an event',
            is_correct: false
          },
          {
            label: 'To stop the event from propagating to parent elements',
            is_correct: true
          }
        ]
      }
    ]
  }
};

export default template;
