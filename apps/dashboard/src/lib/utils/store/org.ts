import { browser, dev } from '$app/environment';
import { derived, writable } from 'svelte/store';
import merge from 'lodash/merge';

import type { AccountOrg, PublicOrg } from '$features/app/types';
import type { OrgTeamMember } from '../types/org';
import {
  canUseBasicAuthSettings,
  canUsePublicApi,
  getActiveOrgPlan,
  getPaymentBlockDate,
  getStudentLimit,
  isOrgOnFreePlan,
  isResourceLimitReached,
  PLAN
} from '@cio/utils/plans';
import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';
import {
  BRAND_ROOT_DOMAIN,
  DEFAULT_ORG_CUSTOMIZATION as SHARED_DEFAULT_ORG_CUSTOMIZATION,
  ROLE,
  TENANT_ROOT_DOMAIN
} from '@cio/utils/constants';
import { isLocalOrPrivateHost } from '@cio/utils/functions';
import type { Writable } from 'svelte/store';

/** Deep-merge with this when hydrating an org from the API so nested `customization` keys stay stable. */
export const DEFAULT_ORG_CUSTOMIZATION = SHARED_DEFAULT_ORG_CUSTOMIZATION as NonNullable<AccountOrg['customization']>;

export function mergeAccountOrgFromServer(org: AccountOrg | PublicOrg): AccountOrg {
  const plans = org.plans.map((plan) => ({
    provider: null,
    subscriptionId: null,
    customerId: null,
    ...plan
  }));

  return {
    ...org,
    plans,
    customization: merge({}, DEFAULT_ORG_CUSTOMIZATION, org.customization ?? {}) as AccountOrg['customization']
  } as AccountOrg;
}

const MAX_TIMEOUT_MS = 2 ** 31 - 1;

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
  studentHomePath: null,
  studentHomeCourseId: null,
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

/** True when the user can manage an org (admin dashboard), not a student-only member. */
export function isOrgManagerRole(roleId: number): boolean {
  return roleId === ROLE.ADMIN || roleId === ROLE.TUTOR;
}

/** Orgs where the user is ADMIN or TUTOR — eligible for the admin org switcher. */
export const managedOrgs = derived(orgs, ($orgs) => $orgs.filter((org) => isOrgManagerRole(org.roleId)));

export const isOrgTeamMember = derived(currentOrg, ($currentOrg) => {
  if ($currentOrg.roleId === 0) return null;

  return isOrgManagerRole($currentOrg.roleId);
});

export const currentOrgPlan = derived(currentOrg, ($currentOrg) => getActiveOrgPlan($currentOrg.plans));

export const currentOrgPath = derived(currentOrg, ($currentOrg) =>
  $currentOrg.siteName ? `/org/${$currentOrg.siteName}` : '#'
);

type OrgPublicOrigin = Pick<AccountOrg, 'customDomain' | 'isCustomDomainVerified' | 'siteName'>;

/**
 * Admin dashboard origin (`app.classroomio.com` in cloud). Use for team invite links
 * and other admin-only URLs — not student-facing tenant pages.
 */
export function getAppOrigin(): string {
  if (PUBLIC_IS_SELFHOSTED === 'true' || dev) {
    return browser ? window.location.origin : '';
  }

  return `https://app.${BRAND_ROOT_DOMAIN}`;
}

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

  if ((window.location.host.includes('localhost') || isLocalOrPrivateHost(window.location.hostname)) && org.siteName) {
    url.searchParams.set('org', org.siteName);
  }

  return url.toString();
}

export const currentOrgDomain = derived(currentOrg, ($currentOrg) => getOrgPublicOrigin($currentOrg));

export const orgPaymentBlockDate = derived(currentOrg, ($currentOrg) =>
  getPaymentBlockDate({ isActive: true, paymentFailedAt: $currentOrg.paymentFailedAt })
);

export const isOrgPaymentPastDue = derived(orgPaymentBlockDate, ($blockDate) => $blockDate !== null);

export const isOrgPaymentBlocked = derived(orgPaymentBlockDate, ($blockDate, set) => {
  if (!$blockDate) {
    set(false);

    return;
  }

  const millisecondsUntilBlock = $blockDate.getTime() - Date.now();

  set(millisecondsUntilBlock <= 0);

  if (millisecondsUntilBlock <= 0) {
    return;
  }

  const timer = setTimeout(() => set(true), Math.min(millisecondsUntilBlock, MAX_TIMEOUT_MS));

  return () => clearTimeout(timer);
});

export const isFreePlan = derived(currentOrg, ($currentOrg) =>
  isOrgOnFreePlan({
    plans: $currentOrg.plans,
    isSelfHosted: PUBLIC_IS_SELFHOSTED === 'true',
    orgId: $currentOrg.id
  })
);

export const isEnterprisePlan = derived(currentOrg, ($currentOrg) => {
  if (PUBLIC_IS_SELFHOSTED === 'true') return true;

  const plan = getActiveOrgPlan($currentOrg.plans);

  return plan?.planName === PLAN.ENTERPRISE;
});

export const hasPublicApiAccess = derived(currentOrg, ($currentOrg) => {
  const plan = getActiveOrgPlan($currentOrg.plans);

  return canUsePublicApi(plan?.planName, PUBLIC_IS_SELFHOSTED === 'true');
});

export const hasBasicAuthSettingsAccess = derived(currentOrg, ($currentOrg) => {
  const plan = getActiveOrgPlan($currentOrg.plans);

  return canUseBasicAuthSettings(plan?.planName, PUBLIC_IS_SELFHOSTED === 'true');
});

export const currentOrgMaxAudience = derived(currentOrgPlan, ($plan) => {
  const limit = getStudentLimit($plan?.planName);
  return Number.isFinite(limit) ? limit : Number.MAX_SAFE_INTEGER;
});

/**
 * Per-resource org usage + limits delivered by `/account` (admin/tutor only).
 * `studentUsage`/`isStudentLimitReached` are convenience selectors; generic
 * consumers can read `$currentOrgLimits.<resource>` with `isResourceLimitReached`.
 */
export const currentOrgLimits = derived(currentOrg, ($currentOrg) => $currentOrg.limits ?? {});

export const studentUsage = derived(currentOrg, ($currentOrg) => $currentOrg.limits?.students);

export const isStudentLimitReached = derived(currentOrg, ($currentOrg) =>
  isResourceLimitReached($currentOrg.limits?.students)
);
