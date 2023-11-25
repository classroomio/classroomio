import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Git Revert Quiz',
  description: 'Test your knowledge of Git revert with practical questions.',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of the "git revert" command in Git?',
        name: 'q1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To create a new branch in the repository',
            is_correct: false
          },
          {
            label: 'To undo a previous commit by creating a new commit',
            is_correct: true
          },
          {
            label: 'To delete a Git repository',
            is_correct: false
          }
        ]
      },
      {
        title: 'How can you revert a specific commit in Git?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By using the "git revert" command followed by the commit hash',
            is_correct: true
          },
          {
            label: 'By deleting the commit from the commit history',
            is_correct: false
          },
          {
            label: 'By creating a new branch and manually reverting changes',
            is_correct: false
          }
        ]
      },
      {
        title: 'Explain the difference between "git revert" and "git reset" commands.',
        name: 'q3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is a potential drawback of using "git revert" to undo commits?',
        name: 'q4',
        points: 3,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How can you revert multiple consecutive commits in Git?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By running "git revert" multiple times for each commit',
            is_correct: true
          },
          {
            label: 'By creating a new branch and deleting the unwanted commits',
            is_correct: false
          },
          {
            label: 'It is not possible to revert multiple commits at once',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is a "revert commit" in Git?',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'A new commit that undoes the changes introduced by a previous commit',
            is_correct: true
          },
          {
            label: 'A commit that creates a new branch',
            is_correct: false
          },
          {
            label: 'A commit with no changes',
            is_correct: false
          }
        ]
      },
      {
        title: 'How can you preview the changes that will be made by a "git revert" operation?',
        name: 'q7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By using the "git diff" command with the commit hash',
            is_correct: true
          },
          {
            label: 'By using the "git show" command with the commit hash',
            is_correct: false
          },
          {
            label: 'It is not possible to preview changes before reverting',
            is_correct: false
          }
        ]
      },
      {
        title: 'What happens to the commit history after a "git revert" operation?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'A new commit is added to undo the changes, preserving the commit history',
            is_correct: true
          },
          {
            label: 'The commit history is deleted',
            is_correct: false
          },
          {
            label: 'The commit is marked as "reverted" without adding a new commit',
            is_correct: false
          }
        ]
      },
      {
        title: 'Explain the concept of a "conflict" when reverting changes in Git.',
        name: 'q9',
        points: 3,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the purpose of the "git revert -n" command?',
        name: 'q10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To revert a commit without creating a new commit',
            is_correct: true
          },
          {
            label: 'To revert a commit and delete the commit history',
            is_correct: false
          },
          {
            label: 'To revert a commit and force push it to the remote repository',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
