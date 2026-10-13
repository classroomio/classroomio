import type { JobsOptions } from 'bullmq';

import { JOB_NAMES, QUEUE_NAMES } from '../queues/names';
import { QUEUE_DEFAULTS } from '../queues/defaults';
import { getQueue } from '../queues/factories';
import type { TDeliverWebhookPayload } from '../payloads/webhooks';

/**
 * Enqueue a `webhooks:deliver` job that drains every due delivery for one endpoint.
 * The worker is idempotent, so the job id only needs to be unique per scheduled run.
 */
export async function enqueueWebhookDelivery(
  payload: TDeliverWebhookPayload,
  options: { delayMs?: number } & JobsOptions = {}
): Promise<string | undefined> {
  const { delayMs = 0, ...jobOptions } = options;
  const runAt = Date.now() + delayMs;

  const job = await getQueue(QUEUE_NAMES.webhooks).add(JOB_NAMES.webhooks.deliver, payload, {
    ...QUEUE_DEFAULTS[QUEUE_NAMES.webhooks],
    jobId: `webhook-${payload.webhookId}-${runAt}`,
    delay: delayMs,
    ...jobOptions
  });

  return job.id;
}
