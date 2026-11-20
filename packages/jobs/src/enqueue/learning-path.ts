import { createHash } from 'node:crypto';
import type { JobsOptions } from 'bullmq';

import { JOB_NAMES, QUEUE_NAMES } from '../queues/names';
import { QUEUE_DEFAULTS } from '../queues/defaults';
import { getQueue } from '../queues/factories';
import type { TLearningPathProgressSyncPayload, TPathBulkEnrollPayload } from '../payloads/learning-path';

/**
 * Builds the deterministic jobId for a bulk enroll payload. Sorted member
 * keys keep the id stable regardless of input order, and `enqueuedAt`
 * scopes it to one admin decision. A fixed jobId stops BullMQ's automatic
 * resend from creating a duplicate job while offline.
 *
 * BullMQ rejects custom ids containing `:` (outside its legacy 3-part
 * repeatable format), so parts are joined with `_` and `enqueuedAt` is
 * folded into the hash rather than embedded as an ISO string.
 */
export function buildPathBulkEnrollJobId(payload: TPathBulkEnrollPayload): string {
  const keys = payload.members.map((member) => member.profileId ?? member.email ?? '').sort();
  const hash = createHash('sha256')
    .update(`${payload.enqueuedAt ?? ''}\n${keys.join('\n')}`)
    .digest('hex');

  return `path-bulk-enroll_${payload.pathId}_${hash}`;
}

/**
 * Enqueue a learning-path member add too large for the request. Returns the
 * BullMQ job id so the dashboard can poll it.
 *
 * Uses a deterministic jobId so BullMQ's auto-resend while offline does not
 * create a duplicate job.
 */
export async function enqueuePathBulkEnroll(
  payload: TPathBulkEnrollPayload,
  options: JobsOptions = {}
): Promise<string | undefined> {
  const jobId = buildPathBulkEnrollJobId(payload);
  const job = await getQueue(QUEUE_NAMES.audience).add(JOB_NAMES.audience.pathBulkEnroll, payload, {
    ...QUEUE_DEFAULTS[QUEUE_NAMES.audience],
    ...options,
    jobId: options.jobId ?? jobId
  });

  return job.id;
}

/**
 * Enqueue a learning-path progress sync. Idempotent to run twice: each run
 * re-derives the cache from lesson completions and submissions.
 */
export async function enqueueLearningPathProgressSync(payload: TLearningPathProgressSyncPayload): Promise<string> {
  const job = await getQueue(QUEUE_NAMES.maintenance).add(
    JOB_NAMES.maintenance.learningPathProgressSync,
    payload,
    QUEUE_DEFAULTS[QUEUE_NAMES.maintenance]
  );

  return job.id ?? '';
}
