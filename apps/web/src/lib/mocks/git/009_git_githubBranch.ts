import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Git Remote Branch Quiz',
  description: 'Test your knowledge of Git remote branches',
  questionnaire: {
    questions: [
      {
        title: 'What is a Git remote branch?',
        name: 'question1',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A branch on your local machine', is_correct: false },
          { label: 'A branch on a remote repository', is_correct: true },
          { label: 'A branch with no commits', is_correct: false },
        ],
      },
      {
        title: 'How do you list remote branches in Git?',
        name: 'question2',
        points: 2,
        order: 2,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'git branch', is_correct: false },
          { label: 'git remote show origin', is_correct: false },
          { label: 'git branch -r', is_correct: true },
          { label: 'git remote -v', is_correct: false },
        ],
      },
      {
        title: 'Explain the purpose of Git remote branches in your own words.',
        name: 'question3',
        points: 2,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'How do you create a new remote branch in Git?',
        name: 'question4',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'git branch new-branch', is_correct: false },
          { label: 'git checkout -b new-branch', is_correct: false },
          { label: 'git push origin new-branch', is_correct: true },
        ],
      },
      {
        title: 'How do you switch to a remote branch in Git?',
        name: 'question5',
        points: 2,
        order: 5,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'git checkout branch-name', is_correct: false },
          { label: 'git checkout -b branch-name', is_correct: false },
          { label: 'git checkout origin/branch-name', is_correct: true },
          { label: 'git switch branch-name', is_correct: false },
        ],
      },
      {
        title: 'What does "git push" do?',
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
        title: 'How do you delete a remote branch in Git?',
        name: 'question8',
        points: 2,
        order: 8,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'git delete remote branch-name', is_correct: false },
          { label: 'git push origin --delete branch-name', is_correct: true },
          { label: 'git remove remote branch-name', is_correct: false },
          { label: 'git branch -d branch-name', is_correct: false },
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
        title: 'What is a Git pull request?',
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
