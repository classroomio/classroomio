import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Git Remote Pull Request Quiz',
  description: 'Test your knowledge of sending pull requests with Git remote with practical questions.',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of sending a pull request in Git?',
        name: 'q1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To propose changes to a repository and request that they be merged',
            is_correct: true
          },
          {
            label: 'To create a new branch in the repository',
            is_correct: false
          },
          {
            label: 'To delete a Git repository',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you send a pull request to a remote repository?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By pushing your changes to a branch and creating a pull request on the repository platform',
            is_correct: true
          },
          {
            label: 'By sending an email to the repository owner',
            is_correct: false
          },
          {
            label: 'By using the "git send-request" command',
            is_correct: false
          }
        ]
      },
      {
        title: 'What information should be included in a pull request?',
        name: 'q3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'A description of the changes',
            is_correct: true
          },
          {
            label: 'The branch you want to merge into',
            is_correct: true
          },
          {
            label: 'Your email address',
            is_correct: false
          },
          {
            label: 'A screenshot of the code changes',
            is_correct: false
          }
        ]
      },
      {
        title: 'Explain the concept of a "base branch" in the context of a pull request.',
        name: 'q4',
        points: 3,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the purpose of reviewing and commenting on a pull request?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To provide feedback on the proposed changes',
            is_correct: true
          },
          {
            label: 'To create a new branch in the repository',
            is_correct: false
          },
          {
            label: 'To merge the changes immediately',
            is_correct: false
          }
        ]
      },
      {
        title: 'How can you indicate that you approve of a pull request?',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By leaving a comment with an approving message',
            is_correct: true
          },
          {
            label: 'By sending a direct message to the repository owner',
            is_correct: false
          },
          {
            label: 'By clicking a "Submit Approval" button',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of continuous integration (CI) checks in a pull request?',
        name: 'q7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To automatically test and verify the proposed changes',
            is_correct: true
          },
          {
            label: 'To display advertising on the pull request page',
            is_correct: false
          },
          {
            label: 'To increase the number of comments on the pull request',
            is_correct: false
          }
        ]
      },
      {
        title: 'What happens after a pull request is approved and passes all checks?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'The changes are merged into the base branch',
            is_correct: true
          },
          {
            label: 'The pull request is automatically closed',
            is_correct: false
          },
          {
            label: 'The changes are rejected',
            is_correct: false
          }
        ]
      },
      {
        title: 'Explain the concept of a "conflict" in the context of a pull request.',
        name: 'q9',
        points: 3,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you track the status of a pull request?',
        name: 'q10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By visiting the pull request page on the repository platform',
            is_correct: true
          },
          {
            label: 'By using the "git status" command',
            is_correct: false
          },
          {
            label: 'By sending an email to the repository owner',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
