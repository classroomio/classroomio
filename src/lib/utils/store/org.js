import { writable, derived } from 'svelte/store';
import { STEPS } from '../constants/quiz';

export const orgs = writable([]);
export const currentOrg = writable({
  id: '',
  name: '',
  shortName: '',
  siteName: '',
  avatar_url: '',
  memberId: '',
  landingpage: {},
  theme: ''
});
export const orgAudience = writable([]);
export const orgTeam = writable([]);
export const currentOrgPath = derived(currentOrg, ($currentOrg) =>
  $currentOrg.siteName ? `/org/${$currentOrg.siteName}` : ''
);

// Quiz
export const createQuizModal = writable({
  open: false,
  openEdit: false,
  title: '',
  id: null
});

export const deleteModal = writable({
  id: null,
  open: false,
  isQuestion: false
});

export const quizesStore = writable([]);

export const quizStore = writable({
  uuid: '',
  title: '',
  questions: [],
  timelimit: '10s',
  theme: 'standard',
  pin: ''
});

export const playQuizStore = writable({
  step: STEPS.CONNECT_TO_PLAY
});
