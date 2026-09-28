import type { JobsOptions } from 'bullmq';

import { JOB_NAMES, QUEUE_NAMES } from '../queues/names';
import { QUEUE_DEFAULTS } from '../queues/defaults';
import { getQueue } from '../queues/factories';
import type { TPathBulkEnrollPayload } from '../payloads/learning-path';

/**
 * Enqueue a learning-path member add too large for the request. Returns the
 * BullMQ job id so the dashboard can poll it.
 *
 * No stable jobId: each bulk add is a distinct decision by the admin, and
 * deduping two deliberate runs would silently drop the second.
 */
export async function enqueuePathBulkEnroll(
  payload: TPathBulkEnrollPayload,
  options: JobsOptions = {}
): Promise<string | undefined> {
  const job = await getQueue(QUEUE_NAMES.audience).add(JOB_NAMES.audience.pathBulkEnroll, payload, {
    ...QUEUE_DEFAULTS[QUEUE_NAMES.audience],
    ...options
  });

  return job.id;
}
