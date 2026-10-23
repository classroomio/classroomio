import { getInstanceUsageCounts, getOrCreateInstance, markInstanceFirstReported } from '@cio/db/queries/instance';
import { LICENSE_FEATURE } from '@cio/utils';

import { env } from '../config/env';
import { getLicenseStatus } from './license';
import { POSTHOG_CAPTURE_URL, POSTHOG_PROJECT_KEY, POSTHOG_TIMEOUT_MS } from './posthog';

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
  if (hasLicenseKey) {
    const license = await getLicenseStatus();
    if (!license.valid) return { sent: false, reason: 'license-unverified' };
    if (license.features.includes(LICENSE_FEATURE.NO_TRACKING)) return { sent: false, reason: 'no-tracking-license' };
  }

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
    active_student_count: counts.activeStudentCount
  };

  const response = await fetch(POSTHOG_CAPTURE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(POSTHOG_TIMEOUT_MS),
    body: JSON.stringify({
      api_key: POSTHOG_PROJECT_KEY,
      event: 'instance_started',
      distinct_id: instance.id,
      properties
    })
  });

  if (!response.ok) {
    throw new Error(`PostHog capture failed with status ${response.status}`);
  }

  if (trigger === 'first_start') {
    try {
      await markInstanceFirstReported(instance.id);
    } catch (error) {
      console.error('markInstanceFirstReported failed after the event was sent:', error);
    }
  }

  return { sent: true, trigger };
}
