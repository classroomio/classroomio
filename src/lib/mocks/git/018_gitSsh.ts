import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'Git Security and SSH Quiz',
  description: 'Test your knowledge of Git security and SSH with practical questions.',
  questionnaire: {
    questions: [
      {
        title: 'What is the primary purpose of using SSH keys with Git?',
        name: 'q1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To securely authenticate and communicate with remote Git repositories',
            is_correct: true,
          },
          {
            label: 'To store sensitive information in Git repositories',
            is_correct: false,
          },
          {
            label: 'To track changes in SSH keys',
            is_correct: false,
          },
        ],
      },
      {
        title: 'How can you generate a new SSH key pair?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By using the "ssh-keygen" command',
            is_correct: true,
          },
          {
            label: 'By sending a request to the Git repository hosting service',
            is_correct: false,
          },
          {
            label: 'SSH keys cannot be generated manually',
            is_correct: false,
          },
        ],
      },
      {
        title: 'Explain the difference between a public SSH key and a private SSH key.',
        name: 'q3',
        points: 2,
        order: 2,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'What is the purpose of adding your SSH public key to your Git hosting service?',
        name: 'q4',
        points: 3,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'How can you configure Git to use an SSH key for authentication?',
        name: 'q5',
        points: 1,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By adding the SSH key to your SSH agent and configuring Git to use it',
            is_correct: true,
          },
          {
            label: 'By including the SSH key in your Git repository',
            is_correct: false,
          },
          {
            label: 'By manually entering the SSH key every time you push or pull',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What is the purpose of SSH key passphrase?',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To add an extra layer of security to your SSH key',
            is_correct: true,
          },
          {
            label: 'To store the SSH key on the Git hosting service',
            is_correct: false,
          },
          {
            label: 'To generate a new SSH key pair',
            is_correct: false,
          },
        ],
      },
      {
        title: 'What should you do if you lose your SSH private key?',
        name: 'q7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Generate a new SSH key pair and update your Git hosting service with the new public key',
            is_correct: true,
          },
          {
            label: 'There is no way to recover from a lost SSH private key',
            is_correct: false,
          },
          {
            label: 'Contact your Git hosting service to reset your password',
            is_correct: false,
          },
        ],
      },
      {
        title: 'Explain the concept of two-factor authentication (2FA) in SSH.',
        name: 'q8',
        points: 3,
        order: 7,
        question_type: QuestionTypes[2], // TEXTAREA
        options: [],
      },
      {
        title: 'What is the purpose of SSH key fingerprints?',
        name: 'q9',
        points: 1,
        order: 8,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To verify the authenticity of an SSH key',
            is_correct: true,
          },
          {
            label: 'To encrypt SSH key data',
            is_correct: false,
          },
          {
            label: 'To increase the length of an SSH key',
            is_correct: false,
          },
        ],
      },
      {
        title: 'How can you check if your SSH key is properly configured in Git?',
        name: 'q10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By using the "ssh -T" command to test authentication with your Git hosting service',
            is_correct: true,
          },
          {
            label: 'By checking the ".ssh" directory in your home directory',
            is_correct: false,
          },
          {
            label: 'There is no way to verify SSH key configuration in Git',
            is_correct: false,
          },
        ],
      },
    ],
  },
};

export default template;
