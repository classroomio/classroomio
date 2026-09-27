import type { TPublicApiLessonVideo } from '@cio/utils/validation/public-api';

import { getAssetById, markAssetUploadComplete, setAssetHlsStatus } from '@cio/db/queries/assets';
import { enqueueHlsEncode, isRedisConfigured } from '@cio/jobs';
import { headVideoObject } from '@cio/core/utils/s3';
import { startMediaJob } from '@cio/core/services/jobs/media-jobs';
import { AppError, ErrorCodes } from '@api/utils/errors';

/** Shape persisted on `lesson.videos`, which the internal readers already expect. */
export interface ResolvedLessonVideo {
  type: 'upload' | 'youtube' | 'vimeo' | 'generic';
  link: string;
  key?: string;
  assetId?: string;
}

/**
 * Turns the public `videos[]` into the stored shape, and completes any upload it
 * references.
 *
 * This is where an upload stops being a reservation: the object is confirmed to
 * exist, its key is persisted, and both the media pipeline and the HLS encode
 * are queued. Doing it here rather than in a separate `complete` call keeps the
 * caller at three requests, and means an asset can never be attached without
 * the pipeline that makes it playable.
 */
export async function resolveLessonVideos(
  orgId: string,
  actorId: string,
  videos: TPublicApiLessonVideo[]
): Promise<ResolvedLessonVideo[]> {
  const resolved: ResolvedLessonVideo[] = [];

  for (const video of videos) {
    if (video.type !== 'upload') {
      resolved.push({ type: video.type, link: video.link });
      continue;
    }

    resolved.push(await completeUploadedVideo(orgId, actorId, video.assetId));
  }

  return resolved;
}

async function completeUploadedVideo(orgId: string, actorId: string, assetId: string): Promise<ResolvedLessonVideo> {
  const asset = await getAssetById(assetId, orgId);
  if (!asset) {
    throw new AppError('Asset not found', ErrorCodes.NOT_FOUND, 404);
  }

  if (asset.kind !== 'video' || asset.provider !== 'upload') {
    throw new AppError('Asset is not an uploaded video', ErrorCodes.VALIDATION_ERROR, 400);
  }

  // Already completed by an earlier attach; reuse it rather than re-queueing.
  if (asset.storageKey) {
    return { type: 'upload', link: '', key: asset.storageKey, assetId };
  }

  const storageKey = await findUploadedObjectKey(assetId);
  if (!storageKey) {
    throw new AppError(
      'No uploaded file found for this asset. Send the bytes to its uploadUrl before attaching it.',
      ErrorCodes.VALIDATION_ERROR,
      409
    );
  }

  const completed = await markAssetUploadComplete(assetId, orgId, storageKey);
  if (!completed) {
    throw new AppError('Asset upload was already completed', ErrorCodes.CONFLICT, 409);
  }

  await queuePostUploadWork(orgId, actorId, assetId, storageKey);

  return { type: 'upload', link: '', key: storageKey, assetId };
}

/** Extensions `POST /assets` can mint, in the order it accepts them. */
const SOURCE_EXTENSIONS = ['mp4', 'mov', 'avi', 'mkv'] as const;

async function findUploadedObjectKey(assetId: string): Promise<string | null> {
  for (const extension of SOURCE_EXTENSIONS) {
    const key = `${assetId}/source.${extension}`;
    const head = await headVideoObject(key);

    if (head.exists && head.byteSize > 0) {
      return key;
    }
  }

  return null;
}

/**
 * Probe, thumbnail and transcription run on the worker; the HLS ladder runs on
 * the encoder. Both are fire-and-forget: a queue outage must not fail the
 * attach, and the asset's `hls_status` records where it got to.
 */
async function queuePostUploadWork(orgId: string, actorId: string, assetId: string, storageKey: string): Promise<void> {
  if (!isRedisConfigured()) {
    console.warn('Redis not configured: uploaded video will not be processed', { assetId });
    return;
  }

  try {
    await startMediaJob({
      organizationId: orgId,
      assetId,
      storageKey,
      triggeredByProfileId: actorId,
      withTranscription: Boolean(process.env.OPENAI_API_KEY)
    });
  } catch (error) {
    console.error('Failed to queue media post-processing', { assetId, error });
  }

  try {
    await enqueueHlsEncode({
      assetId,
      storageKey,
      actorContext: { userId: actorId, organizationId: orgId }
    });
  } catch (error) {
    console.error('Failed to queue HLS encode', { assetId, error });
    await setAssetHlsStatus(assetId, orgId, 'failed').catch(() => undefined);
  }
}
