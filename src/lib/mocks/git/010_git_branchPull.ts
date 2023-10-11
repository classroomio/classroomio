import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Git Branch Pull from Remote Quiz',
  description: 'Test your knowledge of Git branch pull operations from a remote repository',
  questionnaire: {
    questions: [
      {
        title: 'What is Git branch pull used for?',
        name: 'question1',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To push changes to a remote branch', is_correct: false },
          { label: 'To fetch changes from a remote branch and merge them into the current branch', is_correct: true },
          { label: 'To delete a remote branch', is_correct: false },
        ],
      },
      {
        title: 'How do you perform a Git branch pull from a remote repository?',
        name: 'question2',
        points: 2,
        order: 2,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'git pull origin branch-name', is_correct: true },
          { label: 'git push origin branch-name', is_correct: false },
          { label: 'git fetch origin branch-name', is_correct: false },
          { label: 'git merge origin branch-name', is_correct: false },
        ],
      },
      {
        title: 'Explain the purpose of Git branch pull in your own words.',
        name: 'question3',
        points: 2,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'What is a remote branch in Git?',
        name: 'question4',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A branch on your local machine', is_correct: false },
          { label: 'A branch on a remote repository', is_correct: true },
          { label: 'A branch with no commits', is_correct: false },
        ],
      },
      {
        title: 'How do you specify the remote repository and branch when pulling changes in Git?',
        name: 'question5',
        points: 2,
        order: 5,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'By using "git pull origin branch-name"', is_correct: true },
          { label: 'By using "git pull branch-name"', is_correct: false },
          { label: 'By using "git pull remote-name branch-name"', is_correct: false },
          { label: 'By using "git pull"', is_correct: false },
        ],
      },
      {
        title: 'What does "git fetch" do?',
        name: 'question6',
        points: 2,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'What is a Git conflict?',
        name: 'question7',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A disagreement between team members', is_correct: false },
          { label: 'A merge conflict when merging branches', is_correct: true },
          { label: 'A Git error message', is_correct: false },
        ],
      },
      {
        title: 'What is the purpose of "git log" in relation to Git branch pull?',
        name: 'question8',
        points: 2,
        order: 8,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'To view the commit history of the remote branch', is_correct: false },
          { label: 'To view the commit history of the local branch', is_correct: true },
          { label: 'To delete the commit history', is_correct: false },
          { label: 'To create a new branch', is_correct: false },
        ],
      },
      {
        title: 'Explain the Git conflict resolution process.',
        name: 'question9',
        points: 2,
        order: 9,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'What is a Git branch pull request?',
        name: 'question10',
        points: 2,
        order: 10,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A request to delete a branch', is_correct: false },
          { label: 'A request to merge changes into a branch', is_correct: true },
          { label: 'A request for technical support', is_correct: false },
        ],
      },
    ],
  },
};

export default template;
