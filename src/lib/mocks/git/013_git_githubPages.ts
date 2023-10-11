import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'GitHub Pages Quiz',
  description: 'Test your knowledge of GitHub Pages with practical questions.',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of GitHub Pages?',
        name: 'q1',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To host and publish static web content',
            is_correct: true,
          },
          {
            label: 'To manage Git repositories',
            is_correct: false,
          },
          {
            label: 'To create mobile apps',
            is_correct: false,
          },
        ],
      },
      {
        title: 'How can you enable GitHub Pages for a repository?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'In the repository settings, under "GitHub Pages"',
            is_correct: true,
          },
          {
            label: 'By creating a new branch',
            is_correct: false,
          },
          {
            label: 'By merging a pull request',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the default URL for a GitHub Pages site?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'https://username.github.io/repository-name/',
            is_correct: true,
          },
          {
            label: 'https://github.com/username/repository-name/',
            is_correct: false,
          },
          {
            label: 'https://repository-name.github.io/username/',
            is_correct: false,
          },
        ],
      },
      {
        title: 'Explain the concept of a "custom domain" for GitHub Pages.',
        name: 'q4',
        points: 3,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'How do you configure a custom domain for a GitHub Pages site?',
        name: 'q5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'Update DNS records with your domain registrar',
            is_correct: true,
          },
          {
            label: 'Add a CNAME file to your repository',
            is_correct: true,
          },
          {
            label: 'Modify the GitHub Pages settings in your repository',
            is_correct: true,
          },
        ],
      },
      {
        title: 'What is the purpose of a "404.html" file in a GitHub Pages repository?',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To customize the error page for "Page Not Found"',
            is_correct: true,
          },
          {
            label: 'To store images and assets',
            is_correct: false,
          },
          {
            label: 'To create a new branch',
            is_correct: false,
          },
        ],
      },
      {
        title: 'How can you enforce HTTPS on a GitHub Pages site?',
        name: 'q7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[1], // CHECKBOX
        options: [
          {
            label: 'Enable the "Enforce HTTPS" option in repository settings',
            is_correct: true,
          },
          {
            label: 'Use a custom SSL certificate',
            is_correct: true,
          },
          {
            label: 'Install a GitHub Pages plugin',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the purpose of a "gh-pages" branch in a GitHub repository?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To host the GitHub Pages site content',
            is_correct: true,
          },
          {
            label: 'To store code backups',
            is_correct: false,
          },
          {
            label: 'To track issues and pull requests',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is Jekyll in the context of GitHub Pages?',
        name: 'q9',
        points: 2,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'How can you access the GitHub Pages deployment history?',
        name: 'q10',
        points: 1,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'In the GitHub Actions tab of the repository',
            is_correct: true,
          },
          {
            label: 'By running a Git command',
            is_correct: false,
          },
          {
            label: 'In the repository settings',
            is_correct: false,
          },
        ],
      },
    ],
  },
};

export default template;
