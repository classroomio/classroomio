import { writable, derived } from 'svelte/store';
import { dev, browser } from '$app/environment';
import { STEPS } from '../constants/quiz';
import type { Writable } from 'svelte/store';
import type { CurrentOrg, OrgTeamMember, OrgAudience } from '../types/org';
import { ROLE } from '$lib/utils/constants/roles';
import type { UserLessonDataType } from '$lib/utils/types';

export const defaultCurrentOrgState: CurrentOrg = {
  id: '',
  name: '',
  shortName: '',
  siteName: '',
  avatar_url: '',
  memberId: '',
  role_id: '',
  landingpage: {},
  theme: '',
  organization_plan: []
};

export const orgs = writable<CurrentOrg[]>([]);
export const currentOrg: Writable<CurrentOrg> = writable(defaultCurrentOrgState);
export const orgAudience = writable<OrgAudience[]>([]);
export const orgTeam = writable<OrgTeamMember[]>([]);
export const isOrgAdmin = derived(
  currentOrg,
  ($currentOrg) => parseInt($currentOrg.role_id) === ROLE.ADMIN
);
export const currentOrgPlan = derived(
  currentOrg,
  ($currentOrg) => $currentOrg.organization_plan.find(p => p.is_active)
)
export const currentOrgPath = derived(currentOrg, ($currentOrg) =>
  $currentOrg.siteName ? `/org/${$currentOrg.siteName}` : ''
);
export const currentOrgDomain = derived(currentOrg, ($currentOrg) => {
  const browserOrigin = dev && browser && window.location.origin;
  return browserOrigin
    ? browserOrigin
    : $currentOrg.siteName
      ? `https://${$currentOrg.siteName}.classroomio.com`
      : '';
});

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

export const userUpcomingData = writable<UserLessonDataType[]>([]);
