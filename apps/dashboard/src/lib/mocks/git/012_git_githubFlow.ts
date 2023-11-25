import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Git/GitHub Flow Quiz',
  description: 'Test your knowledge of Git and GitHub Flow with practical questions.',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of a "Pull Request" in GitHub Flow?',
        name: 'q1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To propose and discuss changes before merging them',
            is_correct: true
          },
          {
            label: 'To create a new branch',
            is_correct: false
          },
          {
            label: 'To submit a bug report',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you create a new branch in Git?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'git checkout -b <branch_name>',
            is_correct: true
          },
          {
            label: 'git commit -m "New branch"',
            is_correct: false
          },
          {
            label: 'git merge <branch_name>',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "git merge" command?',
        name: 'q3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To combine changes from one branch into another',
            is_correct: true
          },
          {
            label: 'To delete a branch',
            is_correct: false
          },
          {
            label: 'To create a new branch',
            is_correct: false
          }
        ]
      },
      {
        title: 'Explain the concept of "Forking" a repository in GitHub.',
        name: 'q4',
        points: 3,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How do you resolve a merge conflict in Git?',
        name: 'q5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By manually editing the conflicting files and committing the changes',
            is_correct: true
          },
          {
            label: 'By deleting the conflicting branch',
            is_correct: false
          },
          {
            label: 'By rolling back to the previous commit',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which Git command is used to view the commit history?',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'git log',
            is_correct: true
          },
          {
            label: 'git branch',
            is_correct: false
          },
          {
            label: 'git pull',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of a "Gitignore" file?',
        name: 'q7',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To specify files and directories that should be ignored by Git',
            is_correct: true
          },
          {
            label: 'To track all files in the repository',
            is_correct: false
          },
          {
            label: 'To create a new branch',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which Git command is used to push changes to a remote repository?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'git push origin master',
            is_correct: true
          },
          {
            label: 'git commit -m "Push changes"',
            is_correct: false
          },
          {
            label: 'git fetch origin',
            is_correct: true
          }
        ]
      },
      {
        title: 'What is a "Git branch"?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'A separate line of development in a Git repository',
            is_correct: true
          },
          {
            label: 'A software development framework',
            is_correct: false
          },
          {
            label: 'A Git commit message',
            is_correct: false
          }
        ]
      },
      {
        title: 'Explain the difference between "git pull" and "git fetch".',
        name: 'q10',
        points: 3,
        order: 9,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      }
    ]
  }
};

export default template;
