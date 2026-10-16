import { AppError, ErrorCodes } from '@cio/utils/errors';
import { createMediaJob, updateMediaJob } from '@cio/db/queries';
import { enqueueActivityPackageProcess, isRedisConfigured } from '@cio/jobs';

import { logRedisUnavailableOnce } from '../../utils/redis/redis';
import type { TMediaJob } from '@cio/db/types';

export interface StartActivityPackageJobInput {
  organizationId: string;
  assetId: string;
  packageVersionId: string;
  triggeredByProfileId: string | null;
}

/**
 * Creates a `media_job` row and enqueues `activity-package` processing for one
 * package version. Without Redis it keeps a persisted `queued` row so a worker
 * can pick it up later.
 */
export async function startActivityPackageJob(input: StartActivityPackageJobInput): Promise<TMediaJob> {
  const job = await createMediaJob({
    organizationId: input.organizationId,
    assetId: input.assetId,
    triggeredByProfileId: input.triggeredByProfileId,
    status: 'queued',
    stage: 'queued',
    progressPercent: 0
  });

  if (!isRedisConfigured()) {
    logRedisUnavailableOnce(
      'Redis not configured: activity package job created but no BullMQ job enqueued. ' +
        'Set REDIS_URL and run apps/jobs to process this job.'
    );
    return job;
  }

  try {
    const enqueueResult = await enqueueActivityPackageProcess({
      mediaJobId: job.id,
      assetId: input.assetId,
      packageVersionId: input.packageVersionId,
      actorContext: {
        userId: input.triggeredByProfileId,
        organizationId: input.organizationId
      }
    });

    const updated = await updateMediaJob(job.id, {
      rootJobId: enqueueResult.jobId,
      jobIds: { 'process-package': enqueueResult.jobId }
    });

    return updated ?? job;
  } catch (error) {
    console.error('startActivityPackageJob enqueue failed:', error);
    await updateMediaJob(job.id, {
      status: 'failed',
      stage: 'failed',
      error: {
        code: 'ENQUEUE_FAILED',
        message: error instanceof Error ? error.message : 'Failed to enqueue activity package job'
      }
    });

    throw new AppError(
      error instanceof Error ? error : 'Failed to enqueue activity package job',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}
