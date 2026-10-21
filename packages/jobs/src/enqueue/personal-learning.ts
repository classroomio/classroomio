import type { JobsOptions } from 'bullmq';

import { JOB_NAMES, QUEUE_NAMES } from '../queues/names';
import { QUEUE_DEFAULTS } from '../queues/defaults';
import { getQueue } from '../queues/factories';
import type { TPersonalLearningSessionPayload } from '../payloads/personal-learning';

export function getPersonalLearningSessionJobId(journeyId: string, attempt = 0) {
  return attempt > 0 ? `personal-session-${journeyId}-1-retry-${attempt}` : `personal-session-${journeyId}-1`;
}

export async function enqueuePersonalLearningSession(
  payload: TPersonalLearningSessionPayload,
  options?: JobsOptions
): Promise<string | undefined> {
  const job = await getQueue(QUEUE_NAMES.personalLearning).add(JOB_NAMES.personalLearning.generateSession, payload, {
    ...QUEUE_DEFAULTS[QUEUE_NAMES.personalLearning],
    jobId: getPersonalLearningSessionJobId(payload.journeyId),
    ...options
  });

  return job.id;
}
