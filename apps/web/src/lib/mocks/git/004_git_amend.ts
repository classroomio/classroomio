import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Git Amend Quiz',
  description: 'Test your knowledge of Git Amend',
  questionnaire: {
    questions: [
      {
        title: 'What does "git commit --amend" do?',
        name: 'question1',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Creates a new commit', is_correct: false },
          { label: 'Amends the last commit', is_correct: true },
          { label: 'Deletes the last commit', is_correct: false },
        ],
      },
      {
        title: 'What is the purpose of the Git amend operation?',
        name: 'question2',
        points: 2,
        order: 2,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'To add new files to the last commit', is_correct: false },
          { label: 'To modify the last commit message', is_correct: true },
          { label: 'To create a new branch', is_correct: false },
          { label: 'To revert to a previous commit', is_correct: false },
        ],
      },
      {
        title: 'Explain the command "git commit --amend" in your own words.',
        name: 'question3',
        points: 2,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'What is a Git stash?',
        name: 'question4',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A temporary storage area for changes', is_correct: true },
          { label: 'A remote Git repository', is_correct: false },
          { label: 'A Git branch', is_correct: false },
        ],
      },
      {
        title: 'How do you create a new branch in Git?',
        name: 'question5',
        points: 2,
        order: 5,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'git branch new-branch', is_correct: true },
          { label: 'git create-branch new-branch', is_correct: false },
          { label: 'git checkout -b new-branch', is_correct: true },
          { label: 'git new-branch', is_correct: false },
        ],
      },
      {
        title: 'What is a Git remote?',
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
        title: 'What is the purpose of "git pull"?',
        name: 'question8',
        points: 2,
        order: 8,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'To push changes to a remote repository', is_correct: false },
          { label: 'To update your local repository with changes from a remote repository', is_correct: true },
          { label: 'To create a new branch', is_correct: false },
          { label: 'To create a new commit', is_correct: false },
        ],
      },
      {
        title: 'Explain the Git stash operation.',
        name: 'question9',
        points: 2,
        order: 9,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'What is a Git tag?',
        name: 'question10',
        points: 2,
        order: 10,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A label or pointer to a specific commit', is_correct: true },
          { label: 'A branch in Git', is_correct: false },
          { label: 'A type of Git remote', is_correct: false },
        ],
      },
    ],
  },
};

export default template;
