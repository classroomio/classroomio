import { AppError } from '@cio/utils/errors';

import { recordFlatCostUnits, getTokenBalance } from '../agent/usage';
import { fetchYouTubeOEmbed } from '../assets/assets';
import {
  PLAYLIST_FETCH_COST_UNITS,
  PLAYLIST_FETCH_MODEL_LABEL,
  canOrgFetchYoutubeCaptions,
  isSelfHostedInstance
} from '../youtube-captions/policy';
import type { YoutubeCaptionBillingContext } from '../youtube-captions/types';
import { buildPlaylistUrl, parseYoutubePlaylistId } from './parse-playlist-id';

/** Hard ceiling regardless of what the caller asks for. */
export const MAX_PLAYLIST_VIDEOS = 50;
const DEFAULT_PLAYLIST_VIDEOS = 30;
const OEMBED_CONCURRENCY = 6;
const UNATTRIBUTED_COURSE_ID = '00000000-0000-0000-0000-000000000000';

export interface PlaylistVideoSummary {
  videoId: string;
  url: string;
  title: string | null;
}

export type ListYoutubePlaylistVideosResult =
  | {
      available: true;
      playlistId: string;
      playlistUrl: string;
      videos: PlaylistVideoSummary[];
      truncated: boolean;
      providerCalls: number;
    }
  | { available: false; reason: 'plan_gated' | 'token_limit_reached' | 'no_provider_key'; providerCalls: number };

/**
 * Costs exactly one provider credit: Supadata returns video IDs only, and titles
 * come from YouTube's free oEmbed endpoint rather than a per-video lookup.
 */
export async function listYoutubePlaylistVideos(input: {
  playlistUrl: string;
  limit?: number;
  billing: YoutubeCaptionBillingContext;
}): Promise<ListYoutubePlaylistVideosResult> {
  const { playlistUrl, billing } = input;

  const playlistId = parseYoutubePlaylistId(playlistUrl);
  if (!playlistId) {
    throw new AppError(
      'Not a valid public YouTube playlist URL. Pass a youtube.com link containing a `list=` playlist id.',
      'INVALID_YOUTUBE_PLAYLIST_URL',
      400
    );
  }

  const apiKey = process.env.SUPADATA_API_KEY;
  if (!apiKey) {
    return { available: false, reason: 'no_provider_key', providerCalls: 0 };
  }

  const allowed = await canOrgFetchYoutubeCaptions(billing.organizationId);
  if (!allowed) {
    return { available: false, reason: 'plan_gated', providerCalls: 0 };
  }

  const selfHosted = isSelfHostedInstance();
  if (!selfHosted) {
    const balance = await getTokenBalance(billing.organizationId);
    if (balance.remaining < PLAYLIST_FETCH_COST_UNITS) {
      return { available: false, reason: 'token_limit_reached', providerCalls: 0 };
    }
  }

  const limit = clampLimit(input.limit);
  const providerCalls = 1;
  const videoIds = await fetchPlaylistVideoIdsAndBill({ apiKey, playlistId, limit, billing, selfHosted });
  const cappedIds = videoIds.slice(0, limit);
  const videos = await resolveVideoTitles(cappedIds);

  return {
    available: true,
    playlistId,
    playlistUrl: buildPlaylistUrl(playlistId),
    videos,
    truncated: videoIds.length > cappedIds.length,
    providerCalls
  };
}

function clampLimit(requested: number | undefined): number {
  if (!requested || !Number.isFinite(requested)) {
    return DEFAULT_PLAYLIST_VIDEOS;
  }

  return Math.min(Math.max(Math.trunc(requested), 1), MAX_PLAYLIST_VIDEOS);
}

/** Bills in a `finally` because Supadata charges on request, not on success. */
async function fetchPlaylistVideoIdsAndBill(input: {
  apiKey: string;
  playlistId: string;
  limit: number;
  billing: YoutubeCaptionBillingContext;
  selfHosted: boolean;
}): Promise<string[]> {
  const { apiKey, playlistId, limit, billing, selfHosted } = input;

  try {
    const { Supadata } = await import('@supadata/js');
    const supadata = new Supadata({ apiKey });
    const result = await supadata.youtube.playlist.videos({ id: playlistId, limit });

    return [...(result.videoIds ?? []), ...(result.shortIds ?? []), ...(result.liveIds ?? [])];
  } finally {
    await debitPlaylistFetch(billing, selfHosted);
  }
}

async function debitPlaylistFetch(billing: YoutubeCaptionBillingContext, selfHosted: boolean): Promise<void> {
  if (selfHosted) {
    return;
  }

  const courseId = billing.courseId ?? UNATTRIBUTED_COURSE_ID;

  try {
    await recordFlatCostUnits(
      billing.organizationId,
      billing.userId,
      courseId,
      PLAYLIST_FETCH_COST_UNITS,
      PLAYLIST_FETCH_MODEL_LABEL
    );
  } catch (error) {
    console.error('debitPlaylistFetch failed to record playlist spend:', error);
  }
}

async function resolveVideoTitles(videoIds: string[]): Promise<PlaylistVideoSummary[]> {
  const summaries: PlaylistVideoSummary[] = [];

  for (let start = 0; start < videoIds.length; start += OEMBED_CONCURRENCY) {
    const batch = videoIds.slice(start, start + OEMBED_CONCURRENCY);
    const resolved = await Promise.all(
      batch.map(async (videoId) => {
        const url = `https://www.youtube.com/watch?v=${videoId}`;
        const oembed = await fetchYouTubeOEmbed(url);

        return { videoId, url, title: oembed.title };
      })
    );

    summaries.push(...resolved);
  }

  return summaries;
}
