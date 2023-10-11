import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Git Reset Quiz',
  description: 'Test your knowledge of Git reset with practical questions.',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of the "git reset" command in Git?',
        name: 'q1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To create a new branch in the repository',
            is_correct: false,
          },
          {
            label: 'To remove changes from the staging area and uncommit them',
            is_correct: true,
          },
          {
            label: 'To delete a Git repository',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What are the different modes of "git reset"?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'How does "git reset" differ from "git revert"?',
        name: 'q3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'What is the purpose of the "git reset HEAD" command?',
        name: 'q4',
        points: 3,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'What happens to the commit history after a "git reset" operation?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'The commit history is preserved, but the branch pointer moves to a different commit',
            is_correct: true,
          },
          {
            label: 'The commit history is deleted',
            is_correct: false,
          },
          {
            label: 'A new branch is created',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the purpose of "git reset --hard"?',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To reset the branch, staging area, and working directory to a specific commit',
            is_correct: true,
          },
          {
            label: 'To create a new branch',
            is_correct: false,
          },
          {
            label: 'To uncommit changes without affecting the working directory',
            is_correct: false,
          },
        ],
      },
      {
        title: 'How can you unstage changes from the staging area using "git reset"?',
        name: 'q7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By running "git reset" with no additional arguments',
            is_correct: true,
          },
          {
            label: 'By specifying the commit hash with "git reset"',
            is_correct: false,
          },
          {
            label: 'It is not possible to unstage changes with "git reset"',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What does "soft," "mixed," and "hard" mean in the context of "git reset"?',
        name: 'q8',
        points: 3,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'How can you discard all changes in the working directory using "git reset"?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By using "git reset --hard HEAD"',
            is_correct: true,
          },
          {
            label: 'By using "git reset --soft HEAD"',
            is_correct: false,
          },
          {
            label: 'By using "git reset HEAD"',
            is_correct: false,
          },
        ],
      },
      {
        title: 'Explain the concept of the "reflog" in Git.',
        name: 'q10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
    ],
  },
};

export default template;
