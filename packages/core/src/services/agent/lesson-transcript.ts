import { listMediaTranscriptsByAssetIds } from '@cio/db/queries/media-transcript';

import { getLesson } from '../lesson/lesson';
import { CAPTION_FETCH_COST_UNITS, canOrgFetchYoutubeCaptions, isSelfHostedInstance } from '../youtube-captions/policy';
import { getTokenBalance } from './usage';

export interface LessonVideoTranscriptResult {
  lessonId: string;
  title: string;
  hasTranscript: boolean;
  transcript: string | null;
  message?: string;
}

export interface GetLessonVideoTranscriptOptions {
  /** Profile billed for any caption fetch this call triggers. */
  userId?: string;
  /** Course the spend is attributed to. */
  courseId?: string | null;
}

/** Why a lesson's YouTube captions are not available yet. */
type PendingCaptionReason = 'plan_gated' | 'token_limit_reached' | 'fetching';

interface LessonYoutubeVideo {
  assetId: string;
  youtubeVideoId: string;
  canonicalUrl: string;
}

/**
 * Extract a YouTube video ID from a URL or metadata.
 * Returns null if not a YouTube video or ID not found.
 *
 * Note: lesson-embedded videos store their id under `metadata.svid`, not
 * `metadata.videoId` (see `lesson.videos[].metadata` in the schema), so in
 * practice the metadata branch only fires for assets written by other paths and
 * lesson embeds fall through to URL parsing.
 */
function extractYoutubeVideoId(link: string | undefined, metadata: { videoId?: string } | undefined): string | null {
  if (metadata?.videoId && typeof metadata.videoId === 'string' && metadata.videoId.length === 11) {
    return metadata.videoId;
  }

  if (!link) return null;

  try {
    const url = new URL(link);
    const host = url.hostname.replace('www.', '');

    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return id?.length === 11 ? id : null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (url.pathname === '/watch') {
        const id = url.searchParams.get('v');
        return id?.length === 11 ? id : null;
      }
      const segments = url.pathname.split('/').filter(Boolean);
      if (segments[0] === 'embed' || segments[0] === 'shorts' || segments[0] === 'live') {
        const id = segments[1];
        return id?.length === 11 ? id : null;
      }
    }
  } catch {
    // Invalid URL — not a YouTube link
  }

  return null;
}

/**
 * Assembles the transcript text for a lesson's video(s).
 *
 * Reads `media_transcript` only. After the caption write-through, an uploaded
 * video and a YouTube embed are the same kind of row, so both are served by one
 * batched read. A YouTube video with no row yet has its caption fetch enqueued
 * and reports `hasTranscript: false` — the provider is never called inside a
 * chat request, so a slow or rate-limited provider cannot stall the response.
 */
export async function getLessonVideoTranscript(
  lessonId: string,
  orgId: string,
  options: GetLessonVideoTranscriptOptions = {}
): Promise<LessonVideoTranscriptResult> {
  const lesson = await getLesson(lessonId);
  const lessonWithVideos = lesson as {
    id: string;
    title: string;
    videos?: Array<{
      type?: string;
      assetId?: string;
      link?: string;
      metadata?: { videoId?: string };
    }> | null;
  };

  const videos = lessonWithVideos.videos ?? [];

  const uploadAssetIds: string[] = [];
  const youtubeVideos: LessonYoutubeVideo[] = [];

  for (const video of videos) {
    if (video.type === 'upload' && video.assetId) {
      uploadAssetIds.push(video.assetId);
    } else if (video.type === 'youtube' && video.assetId) {
      const videoId = extractYoutubeVideoId(video.link, video.metadata);
      if (videoId) {
        youtubeVideos.push({
          assetId: video.assetId,
          youtubeVideoId: videoId,
          canonicalUrl: video.link || `https://www.youtube.com/watch?v=${videoId}`
        });
      }
    }
  }

  if (uploadAssetIds.length === 0 && youtubeVideos.length === 0) {
    return {
      lessonId: lessonWithVideos.id,
      title: lessonWithVideos.title,
      hasTranscript: false,
      transcript: null,
      message:
        'This lesson has no videos with transcripts. Upload a video or embed a YouTube video with captions to enable transcript-based Q&A.'
    };
  }

  const allAssetIds = [...uploadAssetIds, ...youtubeVideos.map((video) => video.assetId)];
  const transcriptRows = await listMediaTranscriptsByAssetIds(allAssetIds, orgId);
  const textByAssetId = new Map<string, string>();

  for (const row of transcriptRows) {
    const text = row.text?.trim();
    if (text) {
      textByAssetId.set(row.assetId, text);
    }
  }

  const missingYoutubeVideos = youtubeVideos.filter((video) => !textByAssetId.has(video.assetId));
  const pendingReason =
    missingYoutubeVideos.length > 0 ? await warmMissingCaptions(orgId, missingYoutubeVideos, options) : null;

  const transcript = allAssetIds
    .map((assetId) => textByAssetId.get(assetId))
    .filter((text): text is string => Boolean(text))
    .join('\n\n');

  if (!transcript) {
    return {
      lessonId: lessonWithVideos.id,
      title: lessonWithVideos.title,
      hasTranscript: false,
      transcript: null,
      message: buildEmptyTranscriptMessage({
        hasUploadVideos: uploadAssetIds.length > 0,
        hasYoutubeVideos: youtubeVideos.length > 0,
        pendingReason
      })
    };
  }

  return {
    lessonId: lessonWithVideos.id,
    title: lessonWithVideos.title,
    hasTranscript: true,
    transcript
  };
}

/**
 * Decide whether captions for the given videos can be fetched and, if so,
 * enqueue the fetches. Returns why they are not ready yet.
 */
async function warmMissingCaptions(
  orgId: string,
  missingVideos: LessonYoutubeVideo[],
  options: GetLessonVideoTranscriptOptions
): Promise<PendingCaptionReason> {
  const allowed = await canOrgFetchYoutubeCaptions(orgId);
  if (!allowed) {
    return 'plan_gated';
  }

  if (!isSelfHostedInstance()) {
    const balance = await getTokenBalance(orgId);
    if (balance.remaining < CAPTION_FETCH_COST_UNITS) {
      return 'token_limit_reached';
    }
  }

  // Without a profile to bill there is nothing to attribute the spend to, so
  // report the videos as still fetching rather than spending anonymously.
  if (!options.userId) {
    return 'fetching';
  }

  await enqueueCaptionFetches(orgId, missingVideos, options.userId, options.courseId ?? null);

  return 'fetching';
}

async function enqueueCaptionFetches(
  orgId: string,
  videos: LessonYoutubeVideo[],
  userId: string,
  courseId: string | null
): Promise<void> {
  try {
    const { startYoutubeCaptionsJob } = await import('../jobs/media-jobs');

    await Promise.all(
      videos.map((video) =>
        startYoutubeCaptionsJob({
          organizationId: orgId,
          assetId: video.assetId,
          triggeredByProfileId: userId,
          courseId,
          youtubeVideoId: video.youtubeVideoId,
          canonicalUrl: video.canonicalUrl
        })
      )
    );
  } catch (error) {
    // A failed enqueue is non-fatal: the caller still gets whatever transcripts
    // already exist, and the next request retries.
    console.error('enqueueCaptionFetches failed:', error);
  }
}

function buildEmptyTranscriptMessage(input: {
  hasUploadVideos: boolean;
  hasYoutubeVideos: boolean;
  pendingReason: PendingCaptionReason | null;
}): string {
  const { hasUploadVideos, hasYoutubeVideos, pendingReason } = input;

  if (hasYoutubeVideos && !hasUploadVideos) {
    if (pendingReason === 'plan_gated') {
      return 'YouTube video transcripts require a paid plan. Upgrade your account to access this feature.';
    }

    if (pendingReason === 'token_limit_reached') {
      return 'This lesson has YouTube video(s), but the AI credit balance is exhausted so captions could not be fetched. Top up AI credits to enable transcript-based Q&A.';
    }

    return 'This lesson has YouTube video(s) but no transcript is available yet. Captions are being fetched — try again shortly, or the video may not have captions enabled.';
  }

  if (hasUploadVideos) {
    return 'This lesson has an uploaded video, but no transcript is available yet — transcription may still be processing.';
  }

  return 'No transcript is available for this lesson.';
}
