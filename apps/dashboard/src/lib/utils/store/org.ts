import { browser, dev } from '$app/environment';
import { derived, writable } from 'svelte/store';
import merge from 'lodash/merge';

import type { AccountOrg } from '$features/app/types';
import type { OrgTeamMember } from '../types/org';
import { canUsePublicApi, isOrgOnFreePlan, PLAN } from '@cio/utils/plans';
import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';
import { ROLE, TENANT_ROOT_DOMAIN } from '@cio/utils/constants';
import { STEPS } from '../constants/quiz';
import type { Writable } from 'svelte/store';

/** Deep-merge with this when hydrating an org from the API so nested `customization` keys stay stable. */
export const DEFAULT_ORG_CUSTOMIZATION = {
  apps: { poll: true, comments: true },
  course: { grading: true, newsfeed: true },
  dashboard: { exercise: true, community: true, bannerText: '', bannerImage: '' },
  auth: { backgroundImage: '' }
} as NonNullable<AccountOrg['customization']>;

export function mergeAccountOrgFromServer(org: AccountOrg): AccountOrg {
  return {
    ...org,
    customization: merge({}, DEFAULT_ORG_CUSTOMIZATION, org.customization ?? {}) as AccountOrg['customization']
  };
}

export const orgs = writable<AccountOrg[]>([]);

export const currentOrg: Writable<AccountOrg> = writable({
  avatarUrl: '',
  createdAt: '',
  customCode: '',
  customDomain: '',
  customization: {
    ...DEFAULT_ORG_CUSTOMIZATION
  },
  disableEmailPassword: false,
  disableGoogleAuth: false,
  disableSignup: false,
  disableSignupMessage: '',
  favicon: '',
  id: '',
  isCustomDomainVerified: false,
  isRestricted: false,
  landingpage: {},
  name: '',
  parentOrganizationId: null,
  plans: [],
  readOnlyUntil: null,
  memberId: 0,
  roleId: 0,
  settings: {},
  siteName: '',
  theme: ''
});

export const isSecondaryWorkspace = derived(currentOrg, ($currentOrg) => Boolean($currentOrg.parentOrganizationId));

export const isPrimaryWorkspace = derived(
  currentOrg,
  ($currentOrg) => Boolean($currentOrg.id) && !$currentOrg.parentOrganizationId
);
export const orgTeam = writable<OrgTeamMember[]>([]);
export const isOrgAdmin = derived(currentOrg, ($currentOrg) => {
  if ($currentOrg.roleId === 0) return null;

  return $currentOrg.roleId === ROLE.ADMIN;
});
const getActivePlan = (org: AccountOrg) => {
  return org.plans.find((p) => p.isActive);
};

export const currentOrgPlan = derived(currentOrg, ($currentOrg) => getActivePlan($currentOrg));

export const currentOrgPath = derived(currentOrg, ($currentOrg) =>
  $currentOrg.siteName ? `/org/${$currentOrg.siteName}` : '#'
);

type OrgPublicOrigin = Pick<AccountOrg, 'customDomain' | 'isCustomDomainVerified' | 'siteName'>;

/**
 * Public origin for an org's tenant site (student LMS, public course pages, login-link handoff).
 * Self-hosted uses the current deployment URL. On cloud, verified custom domains win over the
 * admin host so `app.classroomio.com` still hands off to the org's `example.com` tenant site.
 */
export function getOrgPublicOrigin(org: OrgPublicOrigin): string {
  if (PUBLIC_IS_SELFHOSTED === 'true') {
    return browser ? window.location.origin : '';
  }

  if (org.customDomain && org.isCustomDomainVerified) {
    return `https://${org.customDomain}`;
  }

  if (dev && browser) {
    return window.location.origin;
  }

  if (org.siteName) {
    return `https://${org.siteName}.${TENANT_ROOT_DOMAIN}`;
  }

  return browser ? window.location.origin : '';
}

/** Absolute URL on an org's public tenant site (e.g. `/lms`, `/course/{slug}`). Client-only. */
export function getOrgPublicUrl(org: OrgPublicOrigin, pathname = '/'): string {
  if (!browser) {
    return pathname;
  }

  const origin = getOrgPublicOrigin(org);
  if (!origin) {
    return pathname;
  }

  const url = new URL(pathname, origin);

  if (window.location.host.includes('localhost') && org.siteName) {
    url.searchParams.set('org', org.siteName);
  }

  return url.toString();
}

export const currentOrgDomain = derived(currentOrg, ($currentOrg) => getOrgPublicOrigin($currentOrg));

export const isFreePlan = derived(currentOrg, ($currentOrg) =>
  isOrgOnFreePlan({
    plans: $currentOrg.plans,
    isSelfHosted: PUBLIC_IS_SELFHOSTED === 'true',
    orgId: $currentOrg.id
  })
);

export const isEnterprisePlan = derived(currentOrg, ($currentOrg) => {
  if (PUBLIC_IS_SELFHOSTED === 'true') return true;

  const plan = getActivePlan($currentOrg);

  return plan?.planName === PLAN.ENTERPRISE;
});

export const hasPublicApiAccess = derived(currentOrg, ($currentOrg) => {
  const plan = getActivePlan($currentOrg);

  return canUsePublicApi(plan?.planName, PUBLIC_IS_SELFHOSTED === 'true');
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
