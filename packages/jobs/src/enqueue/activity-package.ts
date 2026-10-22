import { JOB_NAMES, QUEUE_NAMES } from '../queues/names';
import { QUEUE_DEFAULTS } from '../queues/defaults';
import { getQueue } from '../queues/factories';
import type { TActorContext } from '../payloads/media';

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
