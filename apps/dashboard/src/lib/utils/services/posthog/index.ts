import { dev } from '$app/environment';
import { licenseApi } from '$features/license/api/license.svelte';
import posthog from 'posthog-js';

const hasNoTracking = () => {
  const noTracking = licenseApi.hasAccess('no-tracking');
  console.log('license_no_tracking', noTracking);
  return noTracking;
};

export const capturePosthogEvent = (event: string, properties?: Record<string, unknown>): void => {
  if (dev || hasNoTracking()) return;

  posthog.capture(event, properties);
};

export const identifyPosthogUser = (id: string, properties?: Record<string, unknown>): void => {
  if (dev || hasNoTracking()) return;

  posthog.identify(id, properties);
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
  if (dev || hasNoTracking()) return;

  posthog.init('phc_JfdHOZ6v0cVlGELBYx1Tmoen2nxNOrAzvgvrPA6Ksov', {
    api_host: 'https://eu.posthog.com',
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
};
