import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Git Staging Environment Quiz',
  description: 'Test your knowledge of Git Staging Environment',
  questionnaire: {
    questions: [
      {
        title: 'What does the "git status" command display in the staging environment?',
        name: 'question1',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Changes staged for commit', is_correct: false },
          { label: 'Changes not staged for commit', is_correct: false },
          { label: 'Both staged and unstaged changes', is_correct: true }
        ]
      },
      {
        title: 'What is the purpose of the Git staging area?',
        name: 'question2',
        points: 2,
        order: 2,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'To store all changes made in the repository', is_correct: false },
          { label: 'To review changes before committing', is_correct: true },
          { label: 'To create new branches', is_correct: false },
          { label: 'To push changes to a remote repository', is_correct: false }
        ]
      },
      {
        title: 'Explain the process of staging changes in Git in your own words.',
        name: 'question3',
        points: 2,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How do you stage specific files for a commit in Git?',
        name: 'question4',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Use "git add ." to stage all changes', is_correct: false },
          { label: 'Use "git add filename" to stage a specific file', is_correct: true },
          { label: 'Use "git stage filename"', is_correct: false }
        ]
      },
      {
        title: 'What is the purpose of the "git reset" command in the staging environment?',
        name: 'question5',
        points: 2,
        order: 5,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'To unstage changes', is_correct: true },
          { label: 'To discard all changes', is_correct: false },
          { label: 'To create a new branch', is_correct: false },
          { label: 'To view the commit history', is_correct: false }
        ]
      },
      {
        title: 'What does "git diff" show in the staging environment?',
        name: 'question6',
        points: 2,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is a Git stash?',
        name: 'question7',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A temporary storage area for changes', is_correct: true },
          { label: 'A remote Git repository', is_correct: false },
          { label: 'A Git branch', is_correct: false }
        ]
      },
      {
        title: 'How do you unstage changes in Git?',
        name: 'question8',
        points: 2,
        order: 8,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'Use "git stage filename"', is_correct: false },
          { label: 'Use "git unstage filename"', is_correct: true },
          { label: 'Use "git reset"', is_correct: true },
          { label: 'Use "git diff"', is_correct: false }
        ]
      },
      {
        title: 'Explain the Git stash operation in your own words.',
        name: 'question9',
        points: 2,
        order: 9,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the purpose of "git log" in the staging environment?',
        name: 'question10',
        points: 2,
        order: 10,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To view a list of available branches', is_correct: false },
          { label: 'To view the commit history', is_correct: true },
          { label: 'To create a new branch', is_correct: false }
        ]
      }
    ]
  }
};

export default template;
