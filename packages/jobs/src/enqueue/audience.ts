import type { JobsOptions } from 'bullmq';

import { JOB_NAMES, QUEUE_NAMES } from '../queues/names';
import { QUEUE_DEFAULTS } from '../queues/defaults';
import { getQueue } from '../queues/factories';
import type { TAudienceBulkActionPayload } from '../payloads/audience';

/**
 * Enqueue a bulk lifecycle change. Returns the BullMQ job id so the dashboard
 * can poll it.
 *
 * No stable jobId: each apply is a distinct decision by the admin, and
 * deduping two deliberate runs would silently drop the second.
 */
export async function enqueueAudienceBulkAction(
  payload: TAudienceBulkActionPayload,
  options: JobsOptions = {}
): Promise<string | undefined> {
  const job = await getQueue(QUEUE_NAMES.audience).add(JOB_NAMES.audience.bulkAction, payload, {
    ...QUEUE_DEFAULTS[QUEUE_NAMES.audience],
    ...options
  });

  return job.id;
}
