import type { JobsOptions } from 'bullmq';

import { JOB_NAMES, QUEUE_NAMES } from '../queues/names';
import { QUEUE_DEFAULTS } from '../queues/defaults';
import { getQueue } from '../queues/factories';
import type { TSendEmailPayload } from '../payloads/emails';

/**
 * BullMQ rejects `:` in custom job ids (it uses `:` as a separator in its
 * Redis key scheme). Callers tend to pass keys like `welcome:<userId>` for
 * readability, so we normalize the boundary here instead of forcing every
 * caller to remember.
 */
function toJobId(idempotencyKey: string): string {
  return `email-${idempotencyKey.replace(/:/g, '-')}`;
}

/**
 * Enqueue a single `emails:send` job. BullMQ deduplicates on `jobId`, so
 * pass an `idempotencyKey` (e.g. `welcome:<userId>`) when the same domain
 * action might fire more than once.
 */
export async function enqueueEmailSend(
  payload: TSendEmailPayload,
  options: { idempotencyKey?: string } & JobsOptions = {}
): Promise<string | undefined> {
  const { idempotencyKey, ...jobOptions } = options;

  const job = await getQueue(QUEUE_NAMES.emails).add(JOB_NAMES.emails.send, payload, {
    ...QUEUE_DEFAULTS[QUEUE_NAMES.emails],
    ...(idempotencyKey ? { jobId: toJobId(idempotencyKey) } : {}),
    ...jobOptions
  });

  return job.id;
}
