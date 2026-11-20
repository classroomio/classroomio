import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { LICENSE_FEATURE } from '@cio/utils';
import { PLAN } from '@cio/utils/plans';

import { env } from '../config/env';
import { getLicenseStatus } from './license';

export const POSTHOG_PROJECT_KEY = 'phc_JfdHOZ6v0cVlGELBYx1Tmoen2nxNOrAzvgvrPA6Ksov';
export const POSTHOG_CAPTURE_URL = 'https://eu.i.posthog.com/capture/';
export const POSTHOG_TIMEOUT_MS = 10_000;
const POSTHOG_BATCH_URL = 'https://eu.i.posthog.com/batch/';
const POSTHOG_BATCH_SIZE = 500;

export type TEventSource =
  | 'dashboard'
  | 'public_api'
  | 'mcp'
  | 'import'
  | 'clone'
  | 'template'
  | 'agent'
  | 'onboarding'
  | 'add_org'
  | 'workspace';

export type TServerEvent = {
  event: string;
  distinctId?: string | null;
  orgId?: string | null;
  properties?: Record<string, unknown>;
};

export function isServerEventsEnabled(): boolean {
  return env.NODE_ENV === 'production';
}

/** Only a self-hosted license can turn tracking off; a key that can't be verified also stops it. */
async function isBlockedByLicense(): Promise<boolean> {
  if (env.PUBLIC_IS_SELFHOSTED !== 'true' || !env.LICENSE_KEY?.trim()) return false;

  const license = await getLicenseStatus();

  return !license.valid || license.features.includes(LICENSE_FEATURE.NO_TRACKING);
}

function toPosthogEvent({ event, distinctId, orgId, properties }: TServerEvent) {
  const timestamp = new Date().toISOString();
  const deployment = env.PUBLIC_IS_SELFHOSTED === 'true' ? 'self_hosted' : 'cloud';

  return {
    event,
    distinct_id: distinctId || `org_${orgId}`,
    timestamp,
    properties: {
      ...properties,
      deployment,
      ...(orgId && { $groups: { organization: orgId } }),
      ...(!distinctId && { $process_person_profile: false })
    }
  };
}

/**
 * Sends events to PostHog and resolves once they are sent. Never throws.
 * An event without a user is attributed to the org and creates no person.
 */
export async function recordServerEvents(inputs: TServerEvent[]): Promise<void> {
  if (!isServerEventsEnabled()) return;

  try {
    if (await isBlockedByLicense()) return;
  } catch (error) {
    console.error('PostHog license check error:', error);
    return;
  }

  const events = inputs.filter((input) => input.distinctId || input.orgId).map(toPosthogEvent);

  for (let start = 0; start < events.length; start += POSTHOG_BATCH_SIZE) {
    const batch = events.slice(start, start + POSTHOG_BATCH_SIZE);

    try {
      const response = await fetch(POSTHOG_BATCH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(POSTHOG_TIMEOUT_MS),
        body: JSON.stringify({ api_key: POSTHOG_PROJECT_KEY, batch })
      });

      if (!response.ok) {
        console.error('PostHog batch failed:', { event: batch[0].event, status: response.status });
      }
    } catch (error) {
      console.error('PostHog batch error:', { event: batch[0].event, error });
    }
  }
}

export function captureServerEvents(inputs: TServerEvent[]): void {
  if (!isServerEventsEnabled() || inputs.length === 0) return;

  void recordServerEvents(inputs);
}

export function captureServerEvent(input: TServerEvent): void {
  captureServerEvents([input]);
}

/** Same as `captureServerEvent`, resolving the organization from the course in the background. */
export function captureCourseEvent(courseId: string, input: Omit<TServerEvent, 'orgId'>): void {
  if (!isServerEventsEnabled()) return;

  void (async () => {
    try {
      const orgId = await getCourseOrganizationId(courseId);
      await recordServerEvents([{ ...input, orgId, properties: { course_id: courseId, ...input.properties } }]);
    } catch (error) {
      console.error('PostHog course event error:', { event: input.event, courseId, error });
    }
  })();
}

export function identifyOrganizationGroup(orgId: string, properties: Record<string, unknown>): void {
  captureServerEvent({
    event: '$groupidentify',
    orgId,
    properties: { $group_type: 'organization', $group_key: orgId, $group_set: properties }
  });
}

export type TPlanLimitType = 'students' | 'templates' | 'ai_tokens' | 'workspaces' | 'automation_keys';

export function capturePlanLimitReached(input: {
  orgId: string;
  profileId?: string | null;
  limitType: TPlanLimitType;
  plan?: string | null;
  limit: number;
  current: number;
  blocked: boolean;
}): void {
  captureServerEvent({
    event: 'plan_limit_reached',
    distinctId: input.profileId,
    orgId: input.orgId,
    properties: {
      limit_type: input.limitType,
      plan: input.plan ?? PLAN.BASIC,
      limit: input.limit,
      current: input.current,
      blocked: input.blocked
    }
  });
}
