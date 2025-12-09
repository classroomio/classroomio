import { QuestionTypes, ExerciseTemplate } from '../utils';

const template: ExerciseTemplate = {
  title: 'Git Clone Quiz',
  description: 'Test your knowledge of Git Clone with practical questions.',
  questionnaire: {
    questions: [
      {
        title: 'What is the purpose of the "git clone" command?',
        name: 'q1',
        points: 2,
        order: 0,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To create a copy of a remote repository on your local machine',
            is_correct: true
          },
          {
            label: 'To delete a Git repository',
            is_correct: false
          },
          {
            label: 'To merge branches',
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you clone a Git repository from a specific branch?',
        name: 'q2',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'git clone -b <branch_name> <repository_url>',
            is_correct: true
          },
          {
            label: 'git branch -t <branch_name> <repository_url>',
            is_correct: false
          },
          {
            label: 'git pull origin <branch_name>',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the default name of the directory where "git clone" creates a local copy of the repository?',
        name: 'q3',
        points: 1,
        order: 2,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'The same as the repository name',
            is_correct: true
          },
          {
            label: 'LocalGitRepo',
            is_correct: false
          },
          {
            label: 'CloneRepo',
            is_correct: false
          }
        ]
      },
      {
        title: 'Explain the concept of a "bare" Git repository.',
        name: 'q4',
        points: 3,
        order: 3,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the purpose of the "git clone --depth" option?',
        name: 'q5',
        points: 2,
        order: 4,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To limit the clone to a specified number of commits deep',
            is_correct: true
          },
          {
            label: 'To create a shallow clone of a repository',
            is_correct: false
          },
          {
            label: 'To clone only the latest commit',
            is_correct: false
          }
        ]
      },
      {
        title: 'How can you clone a Git repository without downloading the commit history?',
        name: 'q6',
        points: 1,
        order: 5,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'Using the "git clone --depth 1" command',
            is_correct: true
          },
          {
            label: 'It is not possible to clone without history',
            is_correct: false
          },
          {
            label: 'Using the "git clone --shallow" command',
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the "git clone --recurse-submodules" option?',
        name: 'q7',
        points: 2,
        order: 6,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'To clone and initialize submodules within the repository',
            is_correct: true
          },
          {
            label: 'To create a shallow clone of submodules',
            is_correct: false
          },
          {
            label: 'To clone only the parent repository, excluding submodules',
            is_correct: false
          }
        ]
      },
      {
        title: 'How can you clone a repository from a specific commit?',
        name: 'q8',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'By specifying the commit hash after the repository URL',
            is_correct: true
          },
          {
            label: 'By using the "git clone --commit" command',
            is_correct: false
          },
          {
            label: 'It is not possible to clone from a specific commit',
            is_correct: false
          }
        ]
      },
      {
        title: 'Explain the purpose of the "git submodule" command in a Git repository.',
        name: 'q9',
        points: 3,
        order: 8,
        question_type: QuestionTypes[2], // TEXTAREA
        options: []
      },
      {
        title: 'What is the main difference between "git clone" and "git pull"?',
        name: 'q10',
        points: 2,
        order: 9,
        question_type: QuestionTypes[0], // RADIO
        options: [
          {
            label: 'git clone creates a new copy, while git pull updates an existing copy',
            is_correct: true
          },
          {
            label:
              'git clone creates a copy of the entire repository history, while git pull only gets the latest changes',
            is_correct: false
          },
          {
            label: 'git clone is used for cloning remote repositories, while git pull is used for local repositories',
            is_correct: false
          }
        ]
      }
    ]
  }
};

export default template;
