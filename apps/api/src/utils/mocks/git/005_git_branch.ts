import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'Git Branch Quiz',
  description: 'Test your knowledge of Git branches',
  questionnaire: {
    questions: [
      {
        title: 'What is a Git branch?',
        name: 'question1',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'A snapshot of your code at a specific point in time', is_correct: false },
          { label: 'A separate line of development', is_correct: true },
          { label: 'A Git commit message', is_correct: false }
        ]
      },
      {
        title: 'How do you create a new branch in Git?',
        name: 'question2',
        points: 2,
        order: 2,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'git branch new-branch', is_correct: false },
          { label: 'git create-branch new-branch', is_correct: false },
          { label: 'git checkout -b new-branch', is_correct: true },
          { label: 'git new-branch', is_correct: false }
        ]
      },
      {
        title: 'Explain the purpose of Git branches in your own words.',
        name: 'question3',
        points: 2,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'How do you switch between Git branches?',
        name: 'question4',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'git checkout branch-name', is_correct: true },
          { label: 'git switch branch-name', is_correct: false },
          { label: 'git change-branch branch-name', is_correct: false }
        ]
      },
      {
        title: 'What is the purpose of the "git merge" command?',
        name: 'question5',
        points: 2,
        order: 5,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'To create a new branch', is_correct: false },
          { label: 'To merge changes from one branch into another', is_correct: true },
          { label: 'To view the commit history', is_correct: false },
          { label: 'To delete a branch', is_correct: false }
        ]
      },
      {
        title: 'What does "git branch" show you?',
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
        title: 'How do you delete a Git branch?',
        name: 'question8',
        points: 2,
        order: 8,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'git delete branch-name', is_correct: false },
          { label: 'git remove branch-name', is_correct: false },
          { label: 'git branch -d branch-name', is_correct: true },
          { label: 'git checkout branch-name', is_correct: false }
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
        title: 'What is the purpose of "git log" in relation to branches?',
        name: 'question10',
        points: 2,
        order: 10,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To view a list of available branches', is_correct: false },
          { label: 'To view the commit history of a branch', is_correct: true },
          { label: 'To create a new branch', is_correct: false }
        ]
      }
    ]
  }
};

export default template;
