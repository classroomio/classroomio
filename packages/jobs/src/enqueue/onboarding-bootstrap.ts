import type { JobsOptions } from 'bullmq';

import { JOB_NAMES, QUEUE_NAMES } from '../queues/names';
import { QUEUE_DEFAULTS } from '../queues/defaults';
import { getQueue } from '../queues/factories';
import type { TOnboardingStarterPayload } from '../payloads/onboarding-bootstrap';

export async function enqueueOnboardingStarterJob(
  payload: TOnboardingStarterPayload,
  options: JobsOptions = {}
): Promise<string | undefined> {
  const job = await getQueue(QUEUE_NAMES.onboardingBootstrap).add(JOB_NAMES.onboardingBootstrap.runStarter, payload, {
    ...QUEUE_DEFAULTS[QUEUE_NAMES.onboardingBootstrap],
    jobId: `onboarding-starter-${payload.jobId}`,
    ...options
  });

  return job.id;
}
