import {
  getYoutubeCaption,
  getActiveNegativeYoutubeCaption,
  upsertYoutubeCaption
} from '@cio/db/queries/youtube-caption';

import { getTokenBalance, recordFlatCostUnits } from '../agent/usage';
import { VIDEO_LEVEL_LANGUAGE_KEY, isVideoLevelUnavailableReason, resolveRequestLanguage } from './language';
import {
  CAPTION_FETCH_COST_UNITS,
  CAPTION_FETCH_MODEL_LABEL,
  canOrgFetchYoutubeCaptions,
  isSelfHostedInstance
} from './policy';
import { SupadataAdapter } from './supadata-adapter';
import type {
  YoutubeCaptionBillingContext,
  YoutubeCaptionFetchResult,
  YoutubeCaptionOutcome,
  YoutubeCaptionUnavailable
} from './types';

const NEGATIVE_CACHE_TTL_HOURS = 24;
const ASYNC_PENDING_CACHE_TTL_MINUTES = 15;
/** `ai_token_usage.course_id` is NOT NULL but carries no FK, so unattributed spend uses the nil UUID. */
const UNATTRIBUTED_COURSE_ID = '00000000-0000-0000-0000-000000000000';
const PROVIDER_COST_CENTS_PER_CALL = 1;

export interface FetchAndCacheYoutubeCaptionsInput {
  youtubeVideoId: string;
  canonicalUrl: string;
  preferredLanguages?: string[];
  apiKey: string;
  billing: YoutubeCaptionBillingContext;
}

/**
 * The only function that spends money on captions.
 *
 * The plan gate runs before the cache read: a free org gets no YouTube
 * transcription at all, even when the captions are already cached and would
 * cost nothing. Neither the gate nor the balance check writes to the cache —
 * both are per-org verdicts, while `youtube_caption` is platform-wide.
 *
 * Transient provider errors rethrow so the job retries; the charge is still
 * recorded, because Supadata bills on request rather than on success.
 */
export async function fetchAndCacheYoutubeCaptions(
  input: FetchAndCacheYoutubeCaptionsInput
): Promise<YoutubeCaptionOutcome> {
  const { youtubeVideoId, canonicalUrl, preferredLanguages, apiKey, billing } = input;
  const language = resolveRequestLanguage(preferredLanguages);

  const allowed = await canOrgFetchYoutubeCaptions(billing.organizationId);
  if (!allowed) {
    return { unavailable: true, reason: 'plan_gated', providerCalls: 0 };
  }

  const cached = await getYoutubeCaption(youtubeVideoId, language);
  if (cached && cached.status === 'ready' && cached.text) {
    return {
      youtubeVideoId,
      language: cached.language,
      isGenerated: cached.isGenerated,
      text: cached.text,
      segments: (cached.segments as Array<{ start: number; end: number; text: string }>) ?? [],
      provider: 'supadata',
      sourceTrackKind: cached.isGenerated ? 'asr' : 'manual',
      providerCalls: 0
    };
  }

  const [languageNegative, videoNegative] = await Promise.all([
    getActiveNegativeYoutubeCaption(youtubeVideoId, language),
    getActiveNegativeYoutubeCaption(youtubeVideoId, VIDEO_LEVEL_LANGUAGE_KEY)
  ]);
  const negative = videoNegative ?? languageNegative;
  if (negative) {
    return { unavailable: true, reason: negative.unavailableReason ?? 'unavailable', providerCalls: 0 };
  }

  const selfHosted = isSelfHostedInstance();
  if (!selfHosted) {
    const balance = await getTokenBalance(billing.organizationId);
    if (balance.remaining < CAPTION_FETCH_COST_UNITS) {
      return { unavailable: true, reason: 'token_limit_reached', providerCalls: 0 };
    }
  }

  const providerCalls = 1;
  const result = await callProviderAndBill({
    apiKey,
    youtubeVideoId,
    canonicalUrl,
    language,
    billing,
    providerCalls,
    selfHosted
  });

  if ('unavailable' in result) {
    await cacheUnavailable(youtubeVideoId, language, result.reason);

    return { ...result, providerCalls };
  }

  await upsertYoutubeCaption({
    youtubeVideoId,
    // Never `result.language`: a row written as `en-US` would not match the next `en` lookup.
    language,
    status: 'ready',
    unavailableReason: null,
    isGenerated: result.isGenerated,
    text: result.text,
    segments: result.segments,
    provider: 'supadata',
    sourceHash: null,
    costCents: PROVIDER_COST_CENTS_PER_CALL,
    fetchedAt: new Date().toISOString(),
    expiresAt: null
  });

  return { ...result, providerCalls };
}

/** Charges the org even when the call throws — Supadata bills on request. */
async function callProviderAndBill(input: {
  apiKey: string;
  youtubeVideoId: string;
  canonicalUrl: string;
  language: string;
  billing: YoutubeCaptionBillingContext;
  providerCalls: number;
  selfHosted: boolean;
}): Promise<YoutubeCaptionFetchResult | YoutubeCaptionUnavailable> {
  const { apiKey, youtubeVideoId, canonicalUrl, language, billing, providerCalls, selfHosted } = input;
  const adapter = new SupadataAdapter(apiKey);

  try {
    return await adapter.fetchNativeCaptions({ youtubeVideoId, canonicalUrl, language });
  } finally {
    await debitCaptionFetch(billing, providerCalls, selfHosted);
  }
}

/** Wrapped so a metering failure can never lose a transcript we already paid for. */
async function debitCaptionFetch(
  billing: YoutubeCaptionBillingContext,
  providerCalls: number,
  selfHosted: boolean
): Promise<void> {
  if (providerCalls <= 0 || selfHosted) {
    return;
  }

  const costUnits = CAPTION_FETCH_COST_UNITS * providerCalls;
  const courseId = billing.courseId ?? UNATTRIBUTED_COURSE_ID;

  try {
    await recordFlatCostUnits(billing.organizationId, billing.userId, courseId, costUnits, CAPTION_FETCH_MODEL_LABEL);
  } catch (error) {
    console.error('debitCaptionFetch failed to record caption spend:', error);
  }
}

async function cacheUnavailable(youtubeVideoId: string, language: string, reason: string): Promise<void> {
  const isAsyncPending = reason === 'async_pending';
  const ttlMs = isAsyncPending
    ? ASYNC_PENDING_CACHE_TTL_MINUTES * 60 * 1000
    : NEGATIVE_CACHE_TTL_HOURS * 60 * 60 * 1000;

  const cacheLanguage = isVideoLevelUnavailableReason(reason) ? VIDEO_LEVEL_LANGUAGE_KEY : language;

  await upsertYoutubeCaption({
    youtubeVideoId,
    language: cacheLanguage,
    status: 'unavailable',
    unavailableReason: reason,
    isGenerated: false,
    text: null,
    segments: null,
    provider: 'supadata',
    sourceHash: null,
    costCents: PROVIDER_COST_CENTS_PER_CALL,
    fetchedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + ttlMs).toISOString()
  });
}
