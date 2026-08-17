import { JOB_NAMES, QUEUE_NAMES } from '../queues/names';
import { QUEUE_DEFAULTS } from '../queues/defaults';
import { getQueue } from '../queues/factories';
import type { TFetchYoutubeCaptionsPayload } from '../payloads/youtube-captions';

/**
 * Enqueue a YouTube captions fetch job. The worker calls Supadata,
 * writes to `youtube_caption`, and writes through to `media_transcript`.
 */
export async function enqueueYoutubeCaptionsFetch(input: TFetchYoutubeCaptionsPayload): Promise<void> {
  await getQueue(QUEUE_NAMES.youtubeCaptions).add(
    JOB_NAMES.youtubeCaptions.fetchCaptions,
    input,
    QUEUE_DEFAULTS[QUEUE_NAMES.youtubeCaptions]
  );
}
