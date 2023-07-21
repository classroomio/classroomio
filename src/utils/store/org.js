import cloneDeep from 'lodash/cloneDeep';
import { writable, derived } from 'svelte/store';
import { allOptions, STEPS, STUDENTS_PLAY_STEPS } from '../constants/quiz';

export const orgs = writable([]);
export const currentOrg = writable({
  id: '',
  name: '',
  shortName: '',
  siteName: '',
  avatar_url: '',
});
export const orgAudience = writable([]);
export const orgTeam = writable([]);
export const currentOrgPath = derived(
  currentOrg,
  ($currentOrg) => `/org/${$currentOrg.siteName}`
);

// Quiz
export const createQuizModal = writable({
  open: false,
  openEdit: false,
  title: '',
  id: null,
});

export const deleteModal = writable({
  id: null,
  open: false,
  isQuestion: false,
});

export const quizesStore = writable([]);

export const playQuizStore = writable({
  step: STEPS.CONNECT_TO_PLAY,
  studentStep: STUDENTS_PLAY_STEPS.PODIUM,
});

export const mockData = {
  title: 'Spaceflight history and its impact',
  questions: [
    {
      id: 1,
      label: 'Who launched the first satellite into orbit?',
      type: 'multichoice',
      options: [
        {
          id: 'circle',
          label: 'Fritz von Opel',
          isCorrect: false,
        },
        {
          id: 'triangle',
          label: 'Max Valier',
          isCorrect: false,
        },
        {
          id: 'spade',
          label: 'Wernher von Braun',
          isCorrect: false,
        },
        {
          id: 'square',
          label: 'The Soviet Union',
          isCorrect: true,
        },
      ],
    },
    {
      id: 2,
      label: 'Did the US land the first man on the moon?',
      type: 'boolean',
      options: [
        {
          id: 'triangle',
          label: 'True',
          isCorrect: true,
        },
        {
          id: 'square',
          label: 'False',
          isCorrect: false,
        },
      ],
    },
    {
      id: 3,
      label:
        'Which company became the first commercial operator to launch a crewed mission to the International Space Station in 2020?',
      type: 'multichoice',
      options: [
        {
          id: 'circle',
          label: 'SpaceX',
          isCorrect: true,
        },
        {
          id: 'triangle',
          label: 'NASA',
          isCorrect: false,
        },
        {
          id: 'spade',
          label: 'Roscosmos',
          isCorrect: false,
        },
        {
          id: 'square',
          label: 'ESA',
          isCorrect: false,
        },
      ],
    },
  ],
  timelimit: '20s',
  theme: 'standard',
};

export const quizStore = writable({
  title: '',
  questions: [
    {
      id: 1,
      label: '',
      type: 'multichoice',
      options: cloneDeep(allOptions).slice(0, 2),
    },
  ],
  timelimit: '10s',
  theme: 'standard',
});
