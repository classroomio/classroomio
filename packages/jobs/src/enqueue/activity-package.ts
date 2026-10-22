import type { JobsOptions } from 'bullmq';

import { JOB_NAMES, QUEUE_NAMES } from '../queues/names';
import { QUEUE_DEFAULTS } from '../queues/defaults';
import { getQueue } from '../queues/factories';
import type { TActorContext } from '../payloads/media';
import type { TActivityPackageStorageCleanupPayload } from '../payloads/activity-package';

export interface EnqueueActivityPackageInput {
  mediaJobId: string;
  assetId: string;
  packageVersionId: string;
  actorContext: TActorContext;
}

/**
 * Enqueues package processing for one content package version. The worker
 * re-reads the version row, so the payload carries ids only.
 */
export async function enqueueActivityPackageProcess(input: EnqueueActivityPackageInput): Promise<{ jobId: string }> {
  const job = await getQueue(QUEUE_NAMES.activityPackage).add(
    JOB_NAMES.activityPackage.processPackage,
    input,
    QUEUE_DEFAULTS[QUEUE_NAMES.activityPackage]
  );

  return { jobId: job.id ?? '' };
}

const STORAGE_CLEANUP_JOB_OPTIONS: JobsOptions = {
  ...QUEUE_DEFAULTS[QUEUE_NAMES.activityPackage],
  attempts: 8,
  backoff: { type: 'exponential', delay: 60_000 }
};

/**
 * Enqueues a retried removal of a version's extracted files. Deletion is
 * idempotent, so a duplicate job for the same version is harmless.
 */
export async function enqueueActivityPackageStorageCleanup(
  input: TActivityPackageStorageCleanupPayload
): Promise<{ jobId: string }> {
  const job = await getQueue(QUEUE_NAMES.activityPackage).add(
    JOB_NAMES.activityPackage.cleanupStorage,
    input,
    STORAGE_CLEANUP_JOB_OPTIONS
  );

  return { jobId: job.id ?? '' };
}
