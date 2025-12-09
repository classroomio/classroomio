import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'Git New Files Quiz',
  description: 'Test your knowledge of adding new files in Git',
  questionnaire: {
    questions: [
      {
        title: 'What command is used to stage all new files for a commit in Git?',
        name: 'question1',
        points: 2,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'git add .', is_correct: true },
          { label: 'git commit -m', is_correct: false },
          { label: 'git push origin', is_correct: false }
        ]
      },
      {
        title: 'What does "git status" show for new files?',
        name: 'question2',
        points: 2,
        order: 2,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'Untracked files', is_correct: true },
          { label: 'Staged files', is_correct: false },
          { label: 'Committed files', is_correct: false },
          { label: 'Modified files', is_correct: false }
        ]
      },
      {
        title: 'Explain the purpose of "git add" in your own words.',
        name: 'question3',
        points: 2,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the recommended way to unstage a file in Git?',
        name: 'question4',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'git unstage', is_correct: false },
          { label: 'git reset HEAD', is_correct: true },
          { label: 'git checkout', is_correct: false }
        ]
      },
      {
        title: 'How can you commit only specific new files in Git?',
        name: 'question5',
        points: 2,
        order: 5,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'Use "git commit -a"', is_correct: false },
          { label: 'Add the specific files with "git add" and then commit', is_correct: true },
          { label: 'Use "git commit --all"', is_correct: false },
          { label: 'Use "git commit -m"', is_correct: false }
        ]
      },
      {
        title: 'What is the purpose of "git diff" for new files?',
        name: 'question6',
        points: 2,
        order: 6,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What does "git stash" do?',
        name: 'question7',
        points: 2,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'Deletes all your changes', is_correct: false },
          { label: 'Temporarily saves your changes', is_correct: true },
          { label: 'Creates a new branch', is_correct: false }
        ]
      },
      {
        title: 'What is the purpose of "git commit -m"?',
        name: 'question8',
        points: 2,
        order: 8,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          { label: 'To stage new files', is_correct: false },
          { label: 'To commit changes with a specified message', is_correct: true },
          { label: 'To push changes to a remote repository', is_correct: false },
          { label: 'To create a new branch', is_correct: false }
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
        title: 'What is the purpose of "git log"?',
        name: 'question10',
        points: 2,
        order: 10,
        question_type: QuestionTypes[0], // RADIO
        options: [
          { label: 'To view a list of available branches', is_correct: false },
          { label: 'To view the commit history', is_correct: true },
          { label: 'To merge branches', is_correct: false }
        ]
      }
    ]
  }
};

export default template;
