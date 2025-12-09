import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'Git Branch Push to Remote Quiz',
  description: 'Test your knowledge of Git branch pushing to remote repositories.',
  questionnaire: {
    questions: [
      {
        title: 'How do you push a new branch to a remote repository in Git?',
        name: 'q1',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0],
        options: [
          {
            label: 'git push origin new-branch',
            is_correct: true
          },
          {
            label: 'git branch -b new-branch',
            is_correct: false
          },
          {
            label: 'git pull origin new-branch',
            is_correct: false
          }
        ]
      },
      {
        title: 'What does "git push --force" do?',
        name: 'q2',
        points: 2,
        order: 2,
        question_type: QuestionTypes[1],
        options: [
          {
            label: 'Force pushes all local branches',
            is_correct: false
          },
          {
            label: 'Force pushes the current branch to remote',
            is_correct: true
          },
          {
            label: 'Deletes the remote repository',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of "origin" in "git push origin"?',
        name: 'q3',
        points: 2,
        order: 3,
        question_type: QuestionTypes[2],
        options: [
          {
            label: 'It specifies the local branch',
            is_correct: false
          },
          {
            label: 'It refers to the remote repository',
            is_correct: true
          },
          {
            label: 'It is not required in "git push"',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you check the status of your Git repository?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'git status',
            is_correct: true
          },
          {
            label: 'git log',
            is_correct: false
          },
          {
            label: 'git commit',
            is_correct: false
          }
        ]
      },
      {
        title: 'What command is used to create a new branch in Git?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'git branch <branch_name>',
            is_correct: true
          },
          {
            label: 'git checkout -b <branch_name>',
            is_correct: false
          },
          {
            label: 'git create <branch_name>',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you stage changes for a commit in Git?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'git add <file>',
            is_correct: true
          },
          {
            label: 'git commit -m "Message"',
            is_correct: false
          },
          {
            label: 'git push',
            is_correct: false
          }
        ]
      },
      {
        title: 'Which command is used to remove a file from the staging area in Git?',
        name: 'q4',
        points: 1,
        order: 3,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'git reset',
            is_correct: true
          },
          {
            label: 'git rm',
            is_correct: true
          },
          {
            label: 'git commit',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you create a Git tag for a specific commit?',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'git tag -a <tag_name> <commit_sha>',
            is_correct: true
          },
          {
            label: 'git branch -t <tag_name> <commit_sha>',
            is_correct: false
          },
          {
            label: 'git commit -m "Tag: <tag_name>"',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you discard changes in your working directory in Git?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'git reset --hard',
            is_correct: true
          },
          {
            label: 'git checkout -- <file>',
            is_correct: true
          },
          {
            label: 'git commit -m "Discard changes"',
            is_correct: false
          }
        ]
      },

      {
        title: 'Explain the difference between "git merge" and "git rebase".',
        name: 'q10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      }
    ]
  }
};

export default template;
