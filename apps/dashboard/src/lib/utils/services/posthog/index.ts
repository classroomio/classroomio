import { dev } from '$app/environment';
import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';
import { licenseApi } from '$features/license/api/license.svelte';
import type { AccountOrg } from '$features/app/types';
import { currentOrg } from '$lib/utils/store/org';
import { ROLE } from '@cio/utils/constants';
import { getActiveOrgPlan, PLAN } from '@cio/utils/plans';
import posthog from 'posthog-js';

const ROLE_NAMES: Record<number, string> = {
  [ROLE.ADMIN]: 'admin',
  [ROLE.TUTOR]: 'tutor',
  [ROLE.STUDENT]: 'student'
};

const hasNoTracking = () => {
  const noTracking = licenseApi.hasAccess('no-tracking');
  console.log('license_no_tracking', noTracking);
  return noTracking;
};

const isTrackingOff = () => dev || PUBLIC_IS_SELFHOSTED === 'true' || hasNoTracking();

export const capturePosthogEvent = (event: string, properties?: Record<string, unknown>): void => {
  if (isTrackingOff()) return;

  posthog.capture(event, properties);
};

export const identifyPosthogUser = (id: string, properties?: Record<string, unknown>): void => {
  if (isTrackingOff()) return;

  posthog.identify(id, properties);
};

/** Links the user to the org group and records their role in that org. */
const setPosthogOrg = (org: AccountOrg): void => {
  if (!org.id || isTrackingOff()) return;

  const plan = getActiveOrgPlan(org.plans)?.planName ?? PLAN.BASIC;

  posthog.group('organization', org.id, { name: org.name, site_name: org.siteName, plan });

  const role = org.roleId ? ROLE_NAMES[org.roleId] : undefined;
  if (role) posthog.setPersonProperties({ role });
};

export type PosthogBootstrapUser = {
  id: string;
  email?: string | null;
  name?: string | null;
};

/**
 * When `user` is supplied, PostHog initializes as the identified user from its
 * very first event. Without bootstrap the first pageview / autocapture frames /
 * session-replay attribute to a fresh anonymous UUID and the later `identify`
 * call only aliases — session replays and initial events stay on the anon person.
 * The follow-up `setPersonProperties` attaches email/name in the same tick so
 * autocapture events fire with the user's properties already on the person.
 */
export const initPosthog = (user?: PosthogBootstrapUser): void => {
  if (isTrackingOff()) return;

  posthog.init('phc_JfdHOZ6v0cVlGELBYx1Tmoen2nxNOrAzvgvrPA6Ksov', {
    // Route PostHog through our own domain via the tenant-router Worker so the
    // cookie is first-party and doesn't trigger the Lighthouse "third-party cookie" deduction.
    api_host: `${window.location.origin}/ingest`,
    ui_host: 'https://eu.posthog.com',
    ...(user && {
      bootstrap: { distinctID: user.id, isIdentifiedID: true }
    })
  });

  if (user) {
    posthog.setPersonProperties({
      ...(user.email && { email: user.email }),
      ...(user.name && { name: user.name })
    });
  }

  currentOrg.subscribe(setPosthogOrg);
};
