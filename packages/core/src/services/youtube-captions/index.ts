import {
  getYoutubeCaption,
  getActiveNegativeYoutubeCaption,
  upsertYoutubeCaption
} from '@cio/db/queries/youtube-caption';

import { SupadataAdapter } from './supadata-adapter';
import type { YoutubeCaptionFetchResult } from './types';

const NEGATIVE_CACHE_TTL_HOURS = 24;

/**
 * Fetch YouTube captions with a cache-first strategy.
 *
 * Lookup order:
 * 1. `youtube_caption` — ready row → return immediately
 * 2. Negative cache — recent `unavailable` row → return unavailable without provider call
 * 3. Provider fetch (Supadata) → write row → return result
 *
 * On provider transient errors (429, 5xx, network), the error is thrown so
 * callers (BullMQ job) can retry. Negative cache is NOT written for transient errors.
 */
export async function fetchAndCacheYoutubeCaptions(input: {
  youtubeVideoId: string;
  canonicalUrl: string;
  preferredLanguages?: string[];
  apiKey: string;
}): Promise<YoutubeCaptionFetchResult | { unavailable: true; reason: string }> {
  const { youtubeVideoId, canonicalUrl, preferredLanguages = ['en'], apiKey } = input;
  const language = preferredLanguages[0] ?? 'en';

  const cached = await getYoutubeCaption(youtubeVideoId, language);
  if (cached && cached.status === 'ready' && cached.text) {
    return {
      youtubeVideoId,
      language: cached.language,
      isGenerated: cached.isGenerated,
      text: cached.text,
      segments: (cached.segments as Array<{ start: number; end: number; text: string }>) ?? [],
      provider: 'supadata',
      sourceTrackKind: cached.isGenerated ? 'asr' : 'manual'
    };
  }

  const negative = await getActiveNegativeYoutubeCaption(youtubeVideoId, language);
  if (negative) {
    return { unavailable: true, reason: negative.unavailableReason ?? 'unavailable' };
  }

  const adapter = new SupadataAdapter(apiKey);
  const result = await adapter.fetchNativeCaptions({
    youtubeVideoId,
    canonicalUrl,
    preferredLanguages
  });

  if ('unavailable' in result) {
    const expiresAt = new Date(Date.now() + NEGATIVE_CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString();
    await upsertYoutubeCaption({
      youtubeVideoId,
      language,
      status: 'unavailable',
      unavailableReason: result.reason,
      isGenerated: false,
      text: null,
      segments: null,
      provider: 'supadata',
      sourceHash: null,
      costCents: 0,
      fetchedAt: new Date().toISOString(),
      expiresAt
    });

    return result;
  }

  await upsertYoutubeCaption({
    youtubeVideoId,
    language: result.language,
    status: 'ready',
    unavailableReason: null,
    isGenerated: result.isGenerated,
    text: result.text,
    segments: result.segments,
    provider: 'supadata',
    sourceHash: null,
    costCents: 0,
    fetchedAt: new Date().toISOString(),
    expiresAt: null
  });

  return result;
}
