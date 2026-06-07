import { AppError, ErrorCodes } from '@api/utils/errors';
import { JOB_STATUS, type JobEnvelope, type JobStatus, suggestNextPollMs } from '@cio/jobs/status';
import {
  createMediaJob,
  getMediaJobById,
  listJobStepsByRun,
  listLatestMediaJobsByAsset,
  listMediaJobsByIds,
  requestMediaJobCancel,
  updateMediaJob,
  hasActiveMediaJobForAsset
} from '@cio/db/queries';
import { getAssetById } from '@cio/db/queries/assets';
import {
  enqueueGenerateThumbnailOnly,
  enqueueLessonVideoPipeline,
  enqueueTranscriptionOnly,
  isRedisConfigured
} from '@cio/jobs';

import { logRedisUnavailableOnce } from '@cio/core/utils/redis/redis';
import type { TMediaJob } from '@db/types';

export interface StartTranscriptionOnlyMediaJobInput {
  organizationId: string;
  assetId: string;
  triggeredByProfileId: string | null;
}

/**
 * Manual transcription: new `media_job` + extract-audio → transcribe-audio only.
 * Requires OpenAI key, upload video asset, and no other active media_job for the asset.
 */
export async function startTranscriptionOnlyMediaJob(input: StartTranscriptionOnlyMediaJobInput): Promise<TMediaJob> {
  if (!process.env.OPENAI_API_KEY) {
    throw new AppError('Transcription not configured', ErrorCodes.OPENAI_KEY_MISSING, 503);
  }

  const asset = await getAssetById(input.assetId);
  if (!asset || asset.organizationId !== input.organizationId) {
    throw new AppError('Asset not found', ErrorCodes.NOT_FOUND, 404);
  }

  // HLS uploads carry their pre-extracted audio in `hls_audio_key` and leave
  // `storage_key` null. Raw MP4 uploads keep using `storage_key`.
  const transcriptionSourceKey = asset.hlsAudioKey ?? asset.storageKey;

  if (asset.kind !== 'video' || asset.provider !== 'upload' || !transcriptionSourceKey) {
    throw new AppError('Asset cannot be transcribed', ErrorCodes.ASSET_NOT_TRANSCRIBABLE, 400);
  }

  const hasActive = await hasActiveMediaJobForAsset(input.assetId, input.organizationId);
  if (hasActive) {
    throw new AppError('A media job is already running for this asset', ErrorCodes.CONFLICT, 409);
  }

  const job = await createMediaJob({
    organizationId: input.organizationId,
    assetId: input.assetId,
    triggeredByProfileId: input.triggeredByProfileId,
    status: 'queued',
    stage: 'transcribing',
    progressPercent: 0
  });

  if (!isRedisConfigured()) {
    logRedisUnavailableOnce(
      'Redis not configured: transcription media job created but no BullMQ flow enqueued. ' +
        'Set REDIS_URL and run apps/jobs to process this job.'
    );
    return job;
  }

  try {
    const enqueueResult = await enqueueTranscriptionOnly({
      mediaJobId: job.id,
      assetId: input.assetId,
      storageKey: transcriptionSourceKey,
      actorContext: {
        userId: input.triggeredByProfileId,
        organizationId: input.organizationId
      }
    });

    const updated = await updateMediaJob(job.id, {
      rootJobId: enqueueResult.rootJobId,
      jobIds: enqueueResult.jobIds
    });

    return updated ?? job;
  } catch (error) {
    console.error('startTranscriptionOnlyMediaJob enqueue failed:', error);
    await updateMediaJob(job.id, {
      status: 'failed',
      stage: 'failed',
      error: {
        code: 'ENQUEUE_FAILED',
        message: error instanceof Error ? error.message : 'Failed to enqueue transcription job'
      }
    });

    throw new AppError(
      error instanceof Error ? error : 'Failed to enqueue transcription job',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

export interface StartThumbnailRegenInput {
  organizationId: string;
  assetId: string;
  triggeredByProfileId: string | null;
}

/**
 * Manual thumbnail regeneration: create a new `media_job` row and enqueue only
 * the `generate-thumbnail` step. Rejects when the asset has no usable storage
 * key or when another media job is already running for it.
 */
export async function startThumbnailRegenJob(input: StartThumbnailRegenInput): Promise<TMediaJob> {
  const asset = await getAssetById(input.assetId);
  if (!asset || asset.organizationId !== input.organizationId) {
    throw new AppError('Asset not found', ErrorCodes.NOT_FOUND, 404);
  }

  if (asset.kind !== 'video' || asset.provider !== 'upload' || !asset.storageKey) {
    throw new AppError('Asset cannot be thumbnailed', ErrorCodes.ASSET_NOT_TRANSCRIBABLE, 400);
  }

  const hasActive = await hasActiveMediaJobForAsset(input.assetId, input.organizationId);
  if (hasActive) {
    throw new AppError('A media job is already running for this asset', ErrorCodes.CONFLICT, 409);
  }

  const job = await createMediaJob({
    organizationId: input.organizationId,
    assetId: input.assetId,
    triggeredByProfileId: input.triggeredByProfileId,
    status: 'queued',
    stage: 'thumbnailing',
    progressPercent: 0
  });

  if (!isRedisConfigured()) {
    logRedisUnavailableOnce(
      'Redis not configured: thumbnail regen media job created but no BullMQ flow enqueued. ' +
        'Set REDIS_URL and run apps/jobs to process this job.'
    );
    return job;
  }

  try {
    const enqueueResult = await enqueueGenerateThumbnailOnly({
      mediaJobId: job.id,
      assetId: input.assetId,
      storageKey: asset.storageKey,
      actorContext: {
        userId: input.triggeredByProfileId,
        organizationId: input.organizationId
      }
    });

    const updated = await updateMediaJob(job.id, {
      rootJobId: enqueueResult.rootJobId,
      jobIds: enqueueResult.jobIds
    });

    return updated ?? job;
  } catch (error) {
    console.error('startThumbnailRegenJob enqueue failed:', error);
    await updateMediaJob(job.id, {
      status: 'failed',
      stage: 'failed',
      error: {
        code: 'ENQUEUE_FAILED',
        message: error instanceof Error ? error.message : 'Failed to enqueue thumbnail job'
      }
    });

    throw new AppError(
      error instanceof Error ? error : 'Failed to enqueue thumbnail job',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

export interface StartMediaJobInput {
  organizationId: string;
  assetId: string;
  storageKey: string;
  triggeredByProfileId: string | null;
  /** Set to false for assets without an OpenAI key (skip transcribe leg). */
  withTranscription?: boolean;
}

/**
 * Create a `media_job` row and enqueue the BullMQ flow. Falls back to a
 * persisted `queued` row with no BullMQ job id when Redis is unavailable so
 * the API returns a stable status envelope and a follow-up `start` worker
 * can pick it up later. The enqueue itself fails loudly (the DB row stays
 * around so an operator can replay it).
 */
export async function startMediaJob(input: StartMediaJobInput): Promise<TMediaJob> {
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
      'Redis not configured: media job created but no BullMQ flow enqueued. ' +
        'Set REDIS_URL and run apps/jobs to process this job.'
    );
    return job;
  }

  try {
    const enqueueResult = await enqueueLessonVideoPipeline({
      mediaJobId: job.id,
      assetId: input.assetId,
      storageKey: input.storageKey,
      actorContext: {
        userId: input.triggeredByProfileId,
        organizationId: input.organizationId
      },
      withTranscription: input.withTranscription
    });

    const updated = await updateMediaJob(job.id, {
      rootJobId: enqueueResult.rootJobId,
      jobIds: enqueueResult.jobIds
    });

    return updated ?? job;
  } catch (error) {
    console.error('startMediaJob enqueue failed:', error);
    await updateMediaJob(job.id, {
      status: 'failed',
      stage: 'failed',
      error: {
        code: 'ENQUEUE_FAILED',
        message: error instanceof Error ? error.message : 'Failed to enqueue media job'
      }
    });

    throw new AppError(error instanceof Error ? error : 'Failed to enqueue media job', ErrorCodes.INTERNAL_ERROR, 500);
  }
}

export interface GetMediaJobEnvelopeOptions {
  pollCount?: number;
}

function toEnvelope(job: TMediaJob, options: GetMediaJobEnvelopeOptions = {}): JobEnvelope {
  const status = job.status as JobStatus;
  const pollCount = options.pollCount ?? 0;

  return {
    job: {
      id: job.id,
      domain: 'media',
      status,
      stage: job.stage,
      progressPercent: job.progressPercent,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      result: job.result ?? null,
      error: job.error ?? null,
      warnings: job.warnings ?? [],
      cancelRequestedAt: job.cancelRequestedAt,
      attempt: job.attempt,
      maxAttempts: job.maxAttempts
    },
    events: [],
    nextPollMs: suggestNextPollMs(status, pollCount)
  };
}

export async function getMediaJobEnvelope(
  jobId: string,
  orgId: string,
  options: GetMediaJobEnvelopeOptions = {}
): Promise<JobEnvelope> {
  const job = await getMediaJobById(jobId, orgId);
  if (!job) {
    throw new AppError('Media job not found', ErrorCodes.NOT_FOUND, 404);
  }

  return toEnvelope(job, options);
}

export async function listMediaJobEnvelopes(jobIds: string[], orgId: string): Promise<Record<string, JobEnvelope>> {
  if (jobIds.length === 0) return {};

  const rows = await listMediaJobsByIds(jobIds, orgId);
  const map: Record<string, JobEnvelope> = {};
  for (const row of rows) {
    map[row.id] = toEnvelope(row);
  }

  return map;
}

export async function listMediaJobsForAssetEnvelopes(assetId: string, orgId: string): Promise<JobEnvelope[]> {
  const rows = await listLatestMediaJobsByAsset(assetId, orgId);
  return rows.map((row) => toEnvelope(row));
}

export async function cancelMediaJob(jobId: string, orgId: string): Promise<JobEnvelope> {
  const job = await getMediaJobById(jobId, orgId);
  if (!job) {
    throw new AppError('Media job not found', ErrorCodes.NOT_FOUND, 404);
  }

  if (job.status === JOB_STATUS.completed || job.status === JOB_STATUS.failed || job.status === JOB_STATUS.canceled) {
    return toEnvelope(job);
  }

  const updated = await requestMediaJobCancel(jobId, orgId);
  return toEnvelope(updated ?? job);
}

export async function getMediaJobSteps(jobId: string, orgId: string) {
  const job = await getMediaJobById(jobId, orgId);
  if (!job) {
    throw new AppError('Media job not found', ErrorCodes.NOT_FOUND, 404);
  }

  return listJobStepsByRun('media', jobId);
}
