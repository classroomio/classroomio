import { AppError, ErrorCodes } from '@cio/utils/errors';
import { createMediaJob, updateMediaJob, updatePackageVersion } from '@cio/db/queries';
import { enqueueActivityPackageProcess, isRedisConfigured } from '@cio/jobs';

import { logRedisUnavailableOnce } from '../../utils/redis/redis';
import type { TMediaJob } from '@cio/db/types';

export interface StartActivityPackageJobInput {
  organizationId: string;
  assetId: string;
  packageVersionId: string;
  triggeredByProfileId: string | null;
}

async function resetPackageVersionForRetry(packageVersionId: string, error: unknown): Promise<void> {
  const message = error instanceof Error ? error.message : 'Failed to enqueue activity package job';
  try {
    await updatePackageVersion(packageVersionId, {
      status: 'uploading',
      error: { code: 'ENQUEUE_FAILED', message },
      processedAt: null
    });
  } catch (updateError) {
    console.error('Failed to reset package version after enqueue failure:', updateError);
  }
}

/**
 * Creates a `media_job` row and enqueues `activity-package` processing for one
 * package version. Without Redis it keeps a persisted `queued` row so a worker
 * can pick it up later. A definite pre-acceptance failure resets the version to
 * `uploading`; once BullMQ accepts the job the version stays `processing` even
 * if the media-job bookkeeping fails, so a reconcile can still find the job.
 */
export async function startActivityPackageJob(input: StartActivityPackageJobInput): Promise<TMediaJob> {
  let job: TMediaJob;
  try {
    job = await createMediaJob({
      organizationId: input.organizationId,
      assetId: input.assetId,
      triggeredByProfileId: input.triggeredByProfileId,
      status: 'queued',
      stage: 'queued',
      progressPercent: 0
    });
  } catch (error) {
    await resetPackageVersionForRetry(input.packageVersionId, error);
    throw new AppError(
      error instanceof Error ? error : 'Failed to enqueue activity package job',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }

  if (!isRedisConfigured()) {
    logRedisUnavailableOnce(
      'Redis not configured: activity package job created but no BullMQ job enqueued. ' +
        'Set REDIS_URL and run apps/jobs to process this job.'
    );
    return job;
  }

  let enqueueResult: { jobId: string };
  try {
    enqueueResult = await enqueueActivityPackageProcess({
      mediaJobId: job.id,
      assetId: input.assetId,
      packageVersionId: input.packageVersionId,
      actorContext: {
        userId: input.triggeredByProfileId,
        organizationId: input.organizationId
      }
    });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : 'Failed to enqueue activity package job';
    console.error('startActivityPackageJob enqueue failed:', error);
    await updateMediaJob(job.id, {
      status: 'failed',
      stage: 'failed',
      error: {
        code: 'ENQUEUE_FAILED',
        message: errMessage
      }
    });
    await resetPackageVersionForRetry(input.packageVersionId, error);

    throw new AppError(
      error instanceof Error ? error : 'Failed to enqueue activity package job',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }

  try {
    const updated = await updateMediaJob(job.id, {
      rootJobId: enqueueResult.jobId,
      jobIds: { 'process-package': enqueueResult.jobId }
    });

    return updated ?? job;
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : 'Failed to record activity package job';
    console.error('startActivityPackageJob accepted the job but media-job update failed:', {
      mediaJobId: job.id,
      message: errMessage
    });

    throw new AppError(
      'The package job was accepted but its status could not be recorded. Processing may still complete.',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}
