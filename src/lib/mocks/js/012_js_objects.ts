import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'JavaScript Objects Quiz',
  description: 'Test your knowledge of JavaScript objects.',
  questionnaire: {
    questions: [
      {
        title: 'What is an object in JavaScript?',
        name: 'q1',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'A data type that holds a single value',
            is_correct: false
          },
          {
            label: 'A collection of key-value pairs',
            is_correct: true
          },
          {
            label: 'A loop in JavaScript',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you create an empty object in JavaScript?',
        name: 'q2',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'object()',
            is_correct: false
          },
          {
            label: '{}',
            is_correct: true
          },
          {
            label: 'new Object()',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the syntax for accessing an object property?',
        name: 'q3',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'object.property',
            is_correct: true
          },
          {
            label: 'object->property',
            is_correct: false
          },
          {
            label: 'object[property]',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you add a new property to an existing object in JavaScript?',
        name: 'q4',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'object.newProperty = value;',
            is_correct: true
          },
          {
            label: 'object.addProperty(value);',
            is_correct: false
          },
          {
            label: 'object[propertyName] = value;',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which of the following is a valid way to remove a property from an object?',
        name: 'q5',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'delete object.propertyName;',
            is_correct: true
          },
          {
            label: 'object.removeProperty(propertyName);',
            is_correct: false
          },
          {
            label: 'object.propertyName = null;',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is a JavaScript constructor function used for?',
        name: 'q6',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'To define methods for an object',
            is_correct: false
          },
          {
            label: 'To create multiple objects with the same structure',
            is_correct: true
          },
          {
            label: 'To perform mathematical calculations',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you access the number of properties in an object?',
        name: 'q7',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'object.length',
            is_correct: false
          },
          {
            label: 'object.size()',
            is_correct: false
          },
          {
            label: 'Object.keys(object).length',
            is_correct: true
          }
        ]
      },
      {
        title: 'What is the purpose of the "this" keyword in an object method?',
        name: 'q8',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'To refer to the next object in the chain',
            is_correct: false
          },
          {
            label: 'To refer to the current object that the method belongs to',
            is_correct: true
          },
          {
            label: 'To access global variables',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which of the following is a valid way to create an object method?',
        name: 'q9',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'function myMethod() {}',
            is_correct: false
          },
          {
            label: 'const myMethod = function() {};',
            is_correct: true
          },
          {
            label: 'myMethod: function() {}',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you access the value of a nested object property?',
        name: 'q10',
        points: 1,
        order: 10,
        question_type: QuestionTypes[0], // RADIO type
        options: [
          {
            label: 'object.nestedProperty',
            is_correct: true
          },
          {
            label: 'object->nestedProperty',
            is_correct: false
          },
          {
            label: 'object[nestedProperty]',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
