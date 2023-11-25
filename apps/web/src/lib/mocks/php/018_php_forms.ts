import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'PHP Forms Quiz',
  description: 'Test your knowledge of working with forms in PHP.',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of an HTML form in PHP?',
        name: 'question1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To display text on a webpage',
            is_correct: false
          },
          {
            label: 'To store data in a database',
            is_correct: false
          },
          {
            label: 'To collect user input and send it to a server',
            is_correct: true
          },
          {
            label: 'To create links between web pages',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which HTML tag is used to create a form in PHP?',
        name: 'question2',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: '<form>',
            is_correct: true
          },
          {
            label: '<input>',
            is_correct: false
          },
          {
            label: '<button>',
            is_correct: false
          },
          {
            label: '<div>',
            is_correct: false
          }
        ]
      },
      {
        title: 'What attribute is used to specify the HTTP method for submitting a form in PHP?',
        name: 'question3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'action',
            is_correct: false
          },
          {
            label: 'method',
            is_correct: true
          },
          {
            label: 'target',
            is_correct: false
          },
          {
            label: 'enctype',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which HTTP method is used to send form data to the server in PHP?',
        name: 'question4',
        points: 2,
        order: 3,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'GET',
            is_correct: true
          },
          {
            label: 'POST',
            is_correct: false
          },
          {
            label: 'PUT',
            is_correct: false
          },
          {
            label: 'DELETE',
            is_correct: false
          }
        ]
      },
      {
        title: 'In PHP, which superglobal array is used to collect form data?',
        name: 'question5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: '$_GET',
            is_correct: false
          },
          {
            label: '$_POST',
            is_correct: true
          },
          {
            label: '$_REQUEST',
            is_correct: false
          },
          {
            label: '$_SESSION',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which HTML input element is used to create a text field in a form?',
        name: 'question6',
        points: 2,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: '<input type="text">',
            is_correct: true
          },
          {
            label: '<input type="checkbox">',
            is_correct: false
          },
          {
            label: '<input type="radio">',
            is_correct: false
          },
          {
            label: '<input type="password">',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which PHP function is used to validate and sanitize user input from a form?',
        name: 'question7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'htmlspecialchars()',
            is_correct: false
          },
          {
            label: 'mysqli_query()',
            is_correct: false
          },
          {
            label: 'filter_var()',
            is_correct: true
          },
          {
            label: 'json_encode()',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the enctype attribute in a form element?',
        name: 'question8',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To specify the form action',
            is_correct: false
          },
          {
            label: 'To define the form method',
            is_correct: false
          },
          {
            label: 'To specify the character encoding of form data',
            is_correct: true
          },
          {
            label: 'To define the form target',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the <button> element in a form?',
        name: 'question9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To create a clickable link',
            is_correct: false
          },
          {
            label: 'To submit the form data',
            is_correct: false
          },
          {
            label: 'To define a form field',
            is_correct: false
          },
          {
            label: 'To create a clickable button',
            is_correct: true
          }
        ]
      },
      {
        title: 'In PHP, how can you access the value of a submitted form field named "username"?',
        name: 'question10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: '$_POST["username"]',
            is_correct: true
          },
          {
            label: '$_GET["username"]',
            is_correct: false
          },
          {
            label: '$_REQUEST["username"]',
            is_correct: false
          },
          {
            label: '$_SESSION["username"]',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
