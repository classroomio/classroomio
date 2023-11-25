import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Git Push to Remote Quiz',
  description: 'Test your knowledge of Git push operations to a remote repository',
  questionnaire: {
    questions: [
      {
        title: 'What is Git push used for?',
        name: 'question1',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To fetch changes from a remote repository', is_correct: false },
          { label: 'To send changes to a remote repository', is_correct: true },
          { label: 'To delete a remote repository', is_correct: false }
        ]
      },
      {
        title: 'How do you perform a Git push to a remote repository?',
        name: 'question2',
        points: 2,
        order: 2,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'git push origin branch-name', is_correct: true },
          { label: 'git pull origin branch-name', is_correct: false },
          { label: 'git fetch origin branch-name', is_correct: false },
          { label: 'git merge origin branch-name', is_correct: false }
        ]
      },
      {
        title: 'Explain the purpose of Git push in your own words.',
        name: 'question3',
        points: 2,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is a remote repository in Git?',
        name: 'question4',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A local copy of a repository', is_correct: false },
          { label: 'A repository hosted on a remote server', is_correct: true },
          { label: 'A repository with no internet connection', is_correct: false }
        ]
      },
      {
        title: 'How do you specify the remote repository and branch when pushing changes in Git?',
        name: 'question5',
        points: 2,
        order: 5,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'By using "git push origin branch-name"', is_correct: true },
          { label: 'By using "git push branch-name"', is_correct: false },
          { label: 'By using "git push remote-name branch-name"', is_correct: false },
          { label: 'By using "git push"', is_correct: false }
        ]
      },
      {
        title: 'What does "git pull" do?',
        name: 'question6',
        points: 2,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
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
          { label: 'A Git error message', is_correct: false }
        ]
      },
      {
        title: 'What is the purpose of "git log" in relation to Git push?',
        name: 'question8',
        points: 2,
        order: 8,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'To view the commit history of the remote repository', is_correct: false },
          { label: 'To view the commit history of the local repository', is_correct: true },
          { label: 'To delete the commit history', is_correct: false },
          { label: 'To create a new branch', is_correct: false }
        ]
      },
      {
        title: 'Explain the Git conflict resolution process.',
        name: 'question9',
        points: 2,
        order: 9,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is a Git push request?',
        name: 'question10',
        points: 2,
        order: 10,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A request to fetch changes from a remote repository', is_correct: false },
          { label: 'A request to send changes to a remote repository', is_correct: true },
          { label: 'A request for technical support', is_correct: false }
        ]
      }
    ]
  }
};

export default template;
