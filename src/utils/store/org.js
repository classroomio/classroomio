import cloneDeep from 'lodash/cloneDeep';
import { writable, derived } from 'svelte/store';
import { allOptions, STEPS, booleanOptions } from '../constants/quiz';

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
});

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
