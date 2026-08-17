import { updateMediaJob, hasActiveMediaJobForAsset } from '@cio/db/queries';
import type { TFetchYoutubeCaptionsPayload } from '@cio/jobs/payloads/youtube-captions';
import { fetchAndCacheYoutubeCaptions } from '@cio/core/services/youtube-captions/index';
import { writeYoutubeCaptionToMediaTranscript } from '@cio/core/services/youtube-captions/write-through';

import { uploadBufferToBucket, mediaBucket } from '../../utils/storage';
import { log } from '../../utils/logger';

const DOMAIN = 'youtube-captions';
const STEP_KEY = 'fetch-captions';

interface FetchCaptionsResult {
  provider: string;
  language: string;
  segmentCount: number;
  status: 'ready' | 'unavailable';
  reason?: string;
}

/**
 * Processor for YouTube caption fetch jobs.
 *
 * 1. Validates the payload
 * 2. Checks if there's already an active media job for this asset (dedup)
 * 3. Calls Supadata via the caption adapter
 * 4. Writes to `youtube_caption` (inside fetchAndCacheYoutubeCaptions)
 * 5. Writes through to `media_transcript` + uploads VTT
 * 6. Updates the `media_job` row to completed/failed
 */
export async function processFetchYoutubeCaptions(payload: TFetchYoutubeCaptionsPayload): Promise<FetchCaptionsResult> {
  const { mediaJobId, assetId, organizationId, youtubeVideoId, canonicalUrl, preferredLanguages } = payload;

  log.info('youtube-captions-start', {
    mediaJobId,
    assetId,
    youtubeVideoId,
    organizationId
  });

  const hasActive = await hasActiveMediaJobForAsset(assetId, organizationId, { staleAfterMinutes: 10 });
  if (hasActive) {
    const existingJob = await import('@cio/db/queries').then((m) => m.getMediaJobById(mediaJobId));
    if (existingJob && existingJob.status !== 'queued' && existingJob.status !== 'running') {
      log.info('youtube-captions-skip-active-job', { mediaJobId, assetId });
      return { provider: 'supadata', language: 'en', segmentCount: 0, status: 'ready' };
    }
  }

  await updateMediaJob(mediaJobId, {
    status: 'running',
    stage: 'fetching',
    progressPercent: 25
  });

  const apiKey = process.env.SUPADATA_API_KEY;
  if (!apiKey) {
    log.warn('youtube-captions-no-api-key', { mediaJobId, youtubeVideoId });
    await updateMediaJob(mediaJobId, {
      status: 'completed',
      stage: 'done',
      progressPercent: 100,
      result: { status: 'skipped', reason: 'no_provider_key' } as Record<string, unknown>
    });
    return { provider: 'supadata', language: 'en', segmentCount: 0, status: 'ready' };
  }

  try {
    const result = await fetchAndCacheYoutubeCaptions({
      youtubeVideoId,
      canonicalUrl,
      preferredLanguages,
      apiKey
    });

    await updateMediaJob(mediaJobId, { progressPercent: 75 });

    if ('unavailable' in result) {
      log.info('youtube-captions-unavailable', {
        mediaJobId,
        youtubeVideoId,
        reason: result.reason
      });

      await updateMediaJob(mediaJobId, {
        status: 'completed',
        stage: 'done',
        progressPercent: 100,
        result: { status: 'unavailable', reason: result.reason } as Record<string, unknown>
      });

      return {
        provider: 'supadata',
        language: 'en',
        segmentCount: 0,
        status: 'unavailable',
        reason: result.reason
      };
    }

    await writeYoutubeCaptionToMediaTranscript({
      assetId,
      organizationId,
      captionResult: result,
      uploadBufferToBucket,
      mediaBucket
    });

    const fetchResult: FetchCaptionsResult = {
      provider: 'supadata',
      language: result.language,
      segmentCount: result.segments.length,
      status: 'ready'
    };

    await updateMediaJob(mediaJobId, {
      status: 'completed',
      stage: 'done',
      progressPercent: 100,
      result: fetchResult as unknown as Record<string, unknown>
    });

    log.info('youtube-captions-done', {
      mediaJobId,
      youtubeVideoId,
      language: result.language,
      segmentCount: result.segments.length
    });

    return fetchResult;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    log.error('youtube-captions-error', {
      mediaJobId,
      youtubeVideoId,
      error: message
    });

    await updateMediaJob(mediaJobId, {
      status: 'failed',
      stage: 'failed',
      error: { code: 'PROVIDER_ERROR', message }
    });

    throw error;
  }
}
