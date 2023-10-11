import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Git Commit Quiz',
  description: 'Test your knowledge of Git commits',
  questionnaire: {
    questions: [
      {
        title: 'What is a Git commit?',
        name: 'question1',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A snapshot of your code at a specific point in time', is_correct: true },
          { label: 'A type of Git branch', is_correct: false },
          { label: 'A remote repository', is_correct: false },
        ],
      },
      {
        title: 'What does the "git commit" command do?',
        name: 'question2',
        points: 2,
        order: 2,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'Creates a new branch', is_correct: false },
          { label: 'Records changes to the repository', is_correct: true },
          { label: 'Deletes the current branch', is_correct: false },
          { label: 'Pushes changes to a remote repository', is_correct: false },
        ],
      },
      {
        title: 'Explain the purpose of "git commit" in your own words.',
        name: 'question3',
        points: 2,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'What is a Git commit message?',
        name: 'question4',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A comment about the weather', is_correct: false },
          { label: 'A brief description of the changes made in the commit', is_correct: true },
          { label: 'A list of all the files in the repository', is_correct: false },
        ],
      },
      {
        title: 'How do you commit changes with a message in Git?',
        name: 'question5',
        points: 2,
        order: 5,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'Use "git commit -m"', is_correct: true },
          { label: 'Use "git push"', is_correct: false },
          { label: 'Use "git checkout"', is_correct: false },
          { label: 'Use "git add"', is_correct: false },
        ],
      },
      {
        title: 'What is the purpose of "git log"?',
        name: 'question6',
        points: 2,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'What is a Git branch?',
        name: 'question7',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A snapshot of your code at a specific point in time', is_correct: false },
          { label: 'A separate line of development', is_correct: true },
          { label: 'A Git commit message', is_correct: false },
        ],
      },
      {
        title: 'What is the purpose of "git reset" in relation to commits?',
        name: 'question8',
        points: 2,
        order: 8,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'To undo the last commit and reset the staging area', is_correct: true },
          { label: 'To create a new branch', is_correct: false },
          { label: 'To push changes to a remote repository', is_correct: false },
          { label: 'To view the commit history', is_correct: false },
        ],
      },
      {
        title: 'Explain the purpose of "git log" in your own words.',
        name: 'question9',
        points: 2,
        order: 9,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'What is a Git merge?',
        name: 'question10',
        points: 2,
        order: 10,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A conflict resolution process', is_correct: false },
          { label: 'Combining changes from one branch into another', is_correct: true },
          { label: 'A Git repository backup', is_correct: false },
        ],
      },
    ],
  },
};

export default template;
