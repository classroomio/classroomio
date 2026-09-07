import { updateMediaJob } from '@cio/db/queries';
import type { TFetchYoutubeCaptionsPayload } from '@cio/jobs/payloads/youtube-captions';
import { fetchAndCacheYoutubeCaptions } from '@cio/core/services/youtube-captions/index';
import { writeYoutubeCaptionToMediaTranscript } from '@cio/core/services/youtube-captions/write-through';
import {
  CAPTION_FETCH_COST_UNITS,
  canOrgFetchYoutubeCaptions,
  isSelfHostedInstance
} from '@cio/core/services/youtube-captions/policy';
import { getTokenBalance } from '@cio/core/services/agent/usage';

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

function skippedResult(reason: string): FetchCaptionsResult {
  return { provider: 'supadata', language: 'en', segmentCount: 0, status: 'unavailable', reason };
}

/**
 * Processor for YouTube caption fetch jobs.
 *
 * 1. Validates the payload
 * 2. Checks the provider key, the org's plan, and the org's AI credit balance
 * 3. Calls Supadata via the caption adapter (which meters the spend)
 * 4. Writes to `youtube_caption` (inside fetchAndCacheYoutubeCaptions)
 * 5. Writes through to `media_transcript` + uploads VTT
 * 6. Updates the `media_job` row to completed/failed
 *
 * Deliberately does **not** call `hasActiveMediaJobForAsset`: that is a
 * pre-enqueue guard, and this job's own row is still `queued` here, so it would
 * always match itself and skip the fetch. Dedup lives in the deterministic
 * BullMQ job id and, authoritatively, in the `youtube_caption` cache.
 */
export async function processFetchYoutubeCaptions(payload: TFetchYoutubeCaptionsPayload): Promise<FetchCaptionsResult> {
  const {
    mediaJobId,
    assetId,
    organizationId,
    triggeredByProfileId,
    courseId,
    youtubeVideoId,
    canonicalUrl,
    preferredLanguages
  } = payload;

  log.info('youtube-captions-start', {
    mediaJobId,
    assetId,
    youtubeVideoId,
    organizationId
  });

  await updateMediaJob(mediaJobId, {
    status: 'running',
    stage: 'fetching',
    progressPercent: 25
  });

  const apiKey = process.env.SUPADATA_API_KEY;
  if (!apiKey) {
    log.warn('youtube-captions-no-api-key', { mediaJobId, youtubeVideoId });

    return completeSkipped(mediaJobId, 'no_provider_key');
  }

  const allowed = await canOrgFetchYoutubeCaptions(organizationId);
  if (!allowed) {
    log.info('youtube-captions-plan-gated', { mediaJobId, youtubeVideoId, organizationId });

    return completeSkipped(mediaJobId, 'plan_gated');
  }

  // `enforceTokenBalance` throws, and a throw here would burn all three retries
  // with exponential backoff on a condition that cannot resolve on its own.
  if (!isSelfHostedInstance()) {
    const balance = await getTokenBalance(organizationId);
    if (balance.remaining < CAPTION_FETCH_COST_UNITS) {
      log.info('youtube-captions-token-limit-reached', { mediaJobId, youtubeVideoId, organizationId });

      return completeSkipped(mediaJobId, 'token_limit_reached');
    }
  }

  try {
    const result = await fetchAndCacheYoutubeCaptions({
      youtubeVideoId,
      canonicalUrl,
      preferredLanguages,
      apiKey,
      billing: { organizationId, userId: triggeredByProfileId, courseId: courseId ?? null }
    });

    await updateMediaJob(mediaJobId, { progressPercent: 75 });

    if ('unavailable' in result) {
      log.info('youtube-captions-unavailable', {
        mediaJobId,
        youtubeVideoId,
        reason: result.reason,
        providerCalls: result.providerCalls
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
      segmentCount: result.segments.length,
      providerCalls: result.providerCalls
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

/**
 * Mark the job `completed` with a skip reason. Never `failed` — none of these
 * conditions resolve by retrying, and a failure would exhaust the retry budget
 * and land the job in the dead-letter table for no reason.
 */
async function completeSkipped(mediaJobId: string, reason: string): Promise<FetchCaptionsResult> {
  await updateMediaJob(mediaJobId, {
    status: 'completed',
    stage: 'done',
    progressPercent: 100,
    result: { status: 'skipped', reason } as Record<string, unknown>
  });

  return skippedResult(reason);
}
