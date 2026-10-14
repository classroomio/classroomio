import { getInstanceUsageCounts, getOrCreateInstance, markInstanceFirstReported } from '@cio/db/queries/instance';
import { LICENSE_FEATURE } from '@cio/utils';

import { env } from '../config/env';
import { isFeatureLicensed } from './license';

const POSTHOG_CAPTURE_URL = 'https://eu.i.posthog.com/capture/';
const POSTHOG_KEY = 'phc_JfdHOZ6v0cVlGELBYx1Tmoen2nxNOrAzvgvrPA6Ksov';
const POSTHOG_TIMEOUT_MS = 10_000;

export type InstanceTelemetryResult =
  | { sent: false; reason: string }
  | { sent: true; trigger: 'first_start' | 'weekly' };

function getDeploymentMethod(): string {
  if (env.CIO_DEPLOYMENT_METHOD) return env.CIO_DEPLOYMENT_METHOD;
  if (process.env.RAILWAY_ENVIRONMENT_ID) return 'railway';

  return 'other';
}

export async function sendInstanceTelemetry(): Promise<InstanceTelemetryResult> {
  if (env.PUBLIC_IS_SELFHOSTED !== 'true') return { sent: false, reason: 'not-selfhosted' };
  if (env.CIO_TELEMETRY_DISABLED === 'true') return { sent: false, reason: 'disabled' };

  const hasLicenseKey = !!env.LICENSE_KEY?.trim();
  const noTracking = hasLicenseKey && (await isFeatureLicensed(LICENSE_FEATURE.NO_TRACKING));
  if (noTracking) return { sent: false, reason: 'no-tracking-license' };

  const instance = await getOrCreateInstance();
  const counts = await getInstanceUsageCounts();
  const trigger = instance.firstReportedAt ? 'weekly' : 'first_start';
  const deploymentMethod = getDeploymentMethod();
  const properties = {
    instance_id: instance.id,
    trigger,
    deployment_method: deploymentMethod,
    version: env.CIO_VERSION || 'dev',
    org_count: counts.orgCount,
    student_count: counts.studentCount,
    published_course_count: counts.publishedCourseCount,
    active_learner_count: counts.activeLearnerCount
  };

  const response = await fetch(POSTHOG_CAPTURE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(POSTHOG_TIMEOUT_MS),
    body: JSON.stringify({
      api_key: POSTHOG_KEY,
      event: 'instance_started',
      distinct_id: instance.id,
      properties
    })
  });

  if (!response.ok) {
    throw new Error(`PostHog capture failed with status ${response.status}`);
  }

  if (trigger === 'first_start') {
    await markInstanceFirstReported(instance.id);
  }

  return { sent: true, trigger };
}
