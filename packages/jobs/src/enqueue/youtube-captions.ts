import { JOB_NAMES, QUEUE_NAMES } from '../queues/names';
import { QUEUE_DEFAULTS } from '../queues/defaults';
import { getQueue } from '../queues/factories';
import type { TFetchYoutubeCaptionsPayload } from '../payloads/youtube-captions';

/**
 * Enqueue a YouTube captions fetch job. The worker calls Supadata,
 * writes to `youtube_caption`, and writes through to `media_transcript`.
 *
 * The BullMQ `jobId` is deterministic on asset + language so concurrent
 * enqueues collapse into one job. `youtube_caption` remains the authoritative
 * dedup — a duplicate that does slip through hits the cache and spends nothing.
 *
 * Note: with `removeOnComplete: { age }`, a re-enqueue for the same asset and
 * language is silently dropped while the completed job is still retained. That
 * is what we want for a prefetch; a future "refresh captions" action would need
 * `mediaJobId` appended to this key.
 */
export async function enqueueYoutubeCaptionsFetch(input: TFetchYoutubeCaptionsPayload): Promise<void> {
  const language = normalizeJobIdLanguage(input.preferredLanguages?.[0]);
  const jobId = `yt-captions:${input.assetId}:${language}`;

  await getQueue(QUEUE_NAMES.youtubeCaptions).add(JOB_NAMES.youtubeCaptions.fetchCaptions, input, {
    ...QUEUE_DEFAULTS[QUEUE_NAMES.youtubeCaptions],
    jobId
  });
}

/**
 * Mirrors `normalizeCaptionLanguage` in `@cio/core` so the dedup key matches the
 * cache key. Duplicated rather than imported to keep `@cio/jobs` free of a
 * dependency on `@cio/core`.
 */
function normalizeJobIdLanguage(value: string | undefined): string {
  const baseSubtag = (value ?? 'en').trim().toLowerCase().split(/[-_]/)[0] ?? '';
  const lettersOnly = baseSubtag.replace(/[^a-z]/g, '');

  return lettersOnly.slice(0, 8) || 'en';
}
