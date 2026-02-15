import { browser, dev } from '$app/environment';
import { derived, writable } from 'svelte/store';

import type { AccountOrg } from '$features/app/types';
import type { OrgTeamMember } from '../types/org';
import { PLAN } from '@cio/utils/plans';
import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';
import { ROLE } from '@cio/utils/constants';
import { STEPS } from '../constants/quiz';
import type { Writable } from 'svelte/store';

export const orgs = writable<AccountOrg[]>([]);

export const currentOrg: Writable<AccountOrg> = writable({
  avatarUrl: '',
  createdAt: '',
  customCode: '',
  customDomain: '',
  customization: {
    apps: { poll: true, comments: true },
    course: { grading: true, newsfeed: true },
    dashboard: { exercise: true, community: true, bannerText: '', bannerImage: '' }
  },
  favicon: '',
  id: '',
  isCustomDomainVerified: false,
  isRestricted: false,
  landingpage: {},
  name: '',
  plans: [],
  roleId: 0,
  settings: {},
  siteName: '',
  theme: ''
});
export const orgTeam = writable<OrgTeamMember[]>([]);
export const isOrgAdmin = derived(currentOrg, ($currentOrg) => {
  if ($currentOrg.roleId === 0) return null;

  return $currentOrg.roleId === ROLE.ADMIN;
});
export const isOrgStudent = derived(currentOrg, ($currentOrg) => {
  if ($currentOrg.roleId === 0) return null;

  return $currentOrg.roleId === ROLE.STUDENT;
});

const getActivePlan = (org: AccountOrg) => {
  return org.plans.find((p) => p.isActive);
};

export const currentOrgPlan = derived(currentOrg, ($currentOrg) => getActivePlan($currentOrg));

export const currentOrgPath = derived(currentOrg, ($currentOrg) =>
  $currentOrg.siteName ? `/org/${$currentOrg.siteName}` : '#'
);

export const currentOrgDomain = derived(currentOrg, ($currentOrg) => {
  const browserOrigin = dev && browser && window.location.origin;

  // Get the root domain from window.location
  let rootDomain = '';
  if (browser && typeof window !== 'undefined') {
    const host = window.location.hostname;
    const parts = host.split('.');
    if (parts.length >= 2) {
      rootDomain = parts.slice(-2).join('.');
    } else {
      rootDomain = host;
    }
  }

  return browserOrigin
    ? browserOrigin
    : $currentOrg.customDomain && $currentOrg.isCustomDomainVerified
      ? `https://${$currentOrg.customDomain}`
      : $currentOrg.siteName
        ? `https://${$currentOrg.siteName}.${rootDomain}`
        : '';
});

export const isFreePlan = derived(currentOrg, ($currentOrg) => {
  if (!$currentOrg.id || PUBLIC_IS_SELFHOSTED === 'true') return false;

  const plan = getActivePlan($currentOrg);

  return !plan || plan.planName === PLAN.BASIC;
});

export const currentOrgMaxAudience = derived(currentOrgPlan, ($plan) =>
  !$plan
    ? 20
    : $plan.planName === PLAN.EARLY_ADOPTER
      ? 10000
      : $plan.planName === PLAN.ENTERPRISE
        ? Number.MAX_SAFE_INTEGER
        : 20
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

interface QuizOption {
  id: number;
  label: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: number;
  label: string;
  type: string;
  options: QuizOption[];
}

interface QuizStore {
  uuid: string;
  title: string;
  questions: QuizQuestion[];
  timelimit: string;
  theme: string;
  pin: string;
}

export const quizStore = writable<QuizStore>({
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
