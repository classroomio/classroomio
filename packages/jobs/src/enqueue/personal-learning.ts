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
  const queue = getQueue(QUEUE_NAMES.personalLearning);
  const jobId = options?.jobId ?? getPersonalLearningSessionJobId(payload.journeyId);
  const existingJob = await queue.getJob(jobId);

  if (existingJob) {
    const state = await existingJob.getState();
    if (state === 'failed' || state === 'completed') await existingJob.remove();
  }

  const job = await queue.add(JOB_NAMES.personalLearning.generateSession, payload, {
    ...QUEUE_DEFAULTS[QUEUE_NAMES.personalLearning],
    ...options,
    jobId
  });

  return job.id;
}
