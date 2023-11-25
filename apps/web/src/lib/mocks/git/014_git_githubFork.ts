import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Git Remote and Forking Quiz',
  description: 'Test your knowledge of Git Remote and Forking with practical questions.',
  questionnaire: {
    questions: [
      {
        title: 'What does it mean to "fork" a GitHub repository?',
        name: 'q1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: "To create a personal copy of someone else's repository",
            is_correct: true
          },
          {
            label: 'To merge multiple branches',
            is_correct: false
          },
          {
            label: 'To delete a repository',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you create a fork of a GitHub repository?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Click the "Fork" button on the repository page',
            is_correct: true
          },
          {
            label: 'Use the "git fork" command',
            is_correct: false
          },
          {
            label: 'Ask the repository owner to send you a copy',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of a "remote" in Git?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To represent a connection to a remote repository',
            is_correct: true
          },
          {
            label: 'To manage local branches',
            is_correct: false
          },
          {
            label: 'To store code backups',
            is_correct: false
          }
        ]
      },
      {
        title: 'Explain the concept of a "pull request" in the context of forking a repository.',
        name: 'q4',
        points: 3,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title:
          'How do you keep a forked repository up to date with changes from the original repository?',
        name: 'q5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By creating a pull request',
            is_correct: false
          },
          {
            label: 'By configuring a remote named "upstream" and fetching updates',
            is_correct: true
          },
          {
            label: 'By deleting the fork and re-forking the repository',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is a "merge conflict" in Git?',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'A situation where Git cannot automatically merge changes',
            is_correct: true
          },
          {
            label: 'A conflict between team members',
            is_correct: false
          },
          {
            label: 'A bug in the Git software',
            is_correct: false
          }
        ]
      },
      {
        title: 'How can you resolve a merge conflict in Git?',
        name: 'q7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'Manually edit the conflicting files and commit the changes',
            is_correct: true
          },
          {
            label: 'Choose one version and discard the other',
            is_correct: true
          },
          {
            label: 'Ask the repository owner to resolve it',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "git remote -v" command?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To view the URLs of remote repositories',
            is_correct: true
          },
          {
            label: 'To create a new remote repository',
            is_correct: false
          },
          {
            label: 'To list local branches',
            is_correct: false
          }
        ]
      },
      {
        title: 'Explain the concept of a "forking workflow" in Git.',
        name: 'q9',
        points: 3,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title:
          'How do you contribute changes from a forked repository back to the original repository?',
        name: 'q10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By creating a pull request from your fork to the original repository',
            is_correct: true
          },
          {
            label: 'By copying and pasting the code into the original repository',
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
