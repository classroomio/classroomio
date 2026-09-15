import { AppError, ErrorCodes } from '@cio/utils/errors';

import { listMediaTranscriptsByAssetIds } from '@cio/db/queries/media-transcript';
import { getActiveNegativeYoutubeCaption } from '@cio/db/queries/youtube-caption';

import { startTranscriptionOnlyMediaJob, startYoutubeCaptionsJob } from '../jobs/media-jobs';
import { getLesson } from '../lesson/lesson';
import { VIDEO_LEVEL_LANGUAGE_KEY, resolveRequestLanguage } from '../youtube-captions/language';
import { CAPTION_FETCH_COST_UNITS, canOrgFetchYoutubeCaptions, isSelfHostedInstance } from '../youtube-captions/policy';
import { getTokenBalance } from './usage';

/** `fetching` is the only value worth retrying; the rest are terminal for this run. */
export type LessonTranscriptStatus =
  | 'ready'
  | 'fetching'
  | 'unavailable'
  | 'plan_gated'
  | 'token_limit_reached'
  | 'no_videos';

export interface LessonVideoTranscriptResult {
  lessonId: string;
  title: string;
  hasTranscript: boolean;
  status: LessonTranscriptStatus;
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
type PendingCaptionReason = 'plan_gated' | 'token_limit_reached' | 'fetching' | 'unavailable';

interface LessonYoutubeVideo {
  assetId: string;
  youtubeVideoId: string;
  canonicalUrl: string;
}

/**
 * Lesson embeds store their id under `metadata.svid`, not `metadata.videoId`, so
 * in practice they fall through to URL parsing.
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
 * Reads `media_transcript` only — after the caption write-through an upload and a
 * YouTube embed are the same kind of row. A YouTube video with no row yet gets its
 * fetch enqueued and reports `hasTranscript: false`, so a slow or rate-limited
 * provider can never stall a chat request.
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
      status: 'no_videos',
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
  const missingUploadAssetIds = uploadAssetIds.filter((assetId) => !textByAssetId.has(assetId));
  const pendingReason =
    missingYoutubeVideos.length > 0 ? await warmMissingCaptions(orgId, missingYoutubeVideos, options) : null;

  // An upload still being transcribed leaves the lesson just as ungrounded as a
  // missing caption track, so it also blocks `ready`.
  const uploadReason =
    missingUploadAssetIds.length > 0 ? await warmMissingUploads(orgId, missingUploadAssetIds, options) : null;
  const partialReason: PendingCaptionReason | null = pendingReason ?? uploadReason;

  const transcript = allAssetIds
    .map((assetId) => textByAssetId.get(assetId))
    .filter((text): text is string => Boolean(text))
    .join('\n\n');

  if (!transcript) {
    return {
      lessonId: lessonWithVideos.id,
      title: lessonWithVideos.title,
      hasTranscript: false,
      status: partialReason ?? 'unavailable',
      transcript: null,
      message: buildEmptyTranscriptMessage({
        hasUploadVideos: uploadAssetIds.length > 0,
        hasYoutubeVideos: youtubeVideos.length > 0,
        pendingReason
      })
    };
  }

  // One video's transcript does not stand in for another's.
  if (partialReason) {
    return {
      lessonId: lessonWithVideos.id,
      title: lessonWithVideos.title,
      hasTranscript: false,
      status: partialReason,
      transcript,
      message: pendingReason ? buildPartialTranscriptMessage(pendingReason) : buildPartialUploadMessage(partialReason)
    };
  }

  return {
    lessonId: lessonWithVideos.id,
    title: lessonWithVideos.title,
    hasTranscript: true,
    status: 'ready',
    transcript
  };
}

function buildPartialUploadMessage(reason: PendingCaptionReason): string {
  if (reason === 'unavailable') {
    return 'Only part of this lesson has a transcript — an uploaded video cannot be transcribed. Do not fill the gap from the video title.';
  }

  return 'Only part of this lesson has a transcript — an uploaded video is still being transcribed. Ask again shortly.';
}

function buildPartialTranscriptMessage(pendingReason: PendingCaptionReason): string {
  if (pendingReason === 'plan_gated') {
    return 'Only part of this lesson has a transcript. YouTube transcripts require a paid plan, so the embedded video is not covered.';
  }

  if (pendingReason === 'token_limit_reached') {
    return 'Only part of this lesson has a transcript. AI credits are exhausted, so the embedded YouTube video could not be fetched.';
  }

  if (pendingReason === 'unavailable') {
    return 'Only part of this lesson has a transcript — the embedded YouTube video has no captions available. Do not fill the gap from the video title.';
  }

  return 'Only part of this lesson has a transcript. Captions for the embedded YouTube video are still being fetched — ask again shortly.';
}

/** Enqueues the fetches when allowed; returns why the captions are not ready. */
async function warmMissingCaptions(
  orgId: string,
  missingVideos: LessonYoutubeVideo[],
  options: GetLessonVideoTranscriptOptions
): Promise<PendingCaptionReason> {
  // Filter first: no plan or balance can fetch captions for a video that has none.
  const fetchable = await filterOutKnownUnavailable(missingVideos);
  if (fetchable.length === 0) {
    return 'unavailable';
  }

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

  // Nothing to attribute the spend to, so report as fetching rather than spend anonymously.
  if (!options.userId) {
    return 'fetching';
  }

  await enqueueCaptionFetches(orgId, fetchable, options.userId, options.courseId ?? null);

  return 'fetching';
}

/** Without this, a caller retrying on a miss re-enqueues the same video forever. */
async function filterOutKnownUnavailable(videos: LessonYoutubeVideo[]): Promise<LessonYoutubeVideo[]> {
  const language = resolveRequestLanguage();
  const checks = await Promise.all(
    videos.map(async (video) => {
      const [languageNegative, videoNegative] = await Promise.all([
        getActiveNegativeYoutubeCaption(video.youtubeVideoId, language),
        getActiveNegativeYoutubeCaption(video.youtubeVideoId, VIDEO_LEVEL_LANGUAGE_KEY)
      ]);

      return languageNegative || videoNegative ? null : video;
    })
  );

  return checks.filter((video): video is LessonYoutubeVideo => video !== null);
}

/**
 * Upload post-processing is fire-and-forget at asset creation, so an upload can
 * reach here with no transcript and no job. Reporting `fetching` without
 * queueing one would leave the agent retrying something nothing is working on.
 */
async function warmMissingUploads(
  orgId: string,
  assetIds: string[],
  options: GetLessonVideoTranscriptOptions
): Promise<PendingCaptionReason> {
  const outcomes = await Promise.all(
    assetIds.map(async (assetId) => {
      try {
        await startTranscriptionOnlyMediaJob({
          organizationId: orgId,
          assetId,
          triggeredByProfileId: options.userId ?? null
        });

        return 'fetching' as const;
      } catch (error) {
        // A job already running is exactly the state `fetching` describes.
        const code = error instanceof AppError ? error.code : null;

        if (code === ErrorCodes.CONFLICT) {
          return 'fetching' as const;
        }

        if (code === ErrorCodes.OPENAI_KEY_MISSING || code === ErrorCodes.ASSET_NOT_TRANSCRIBABLE) {
          return 'unavailable' as const;
        }

        console.error('warmMissingUploads failed:', error);

        return 'unavailable' as const;
      }
    })
  );

  return outcomes.includes('fetching') ? 'fetching' : 'unavailable';
}

async function enqueueCaptionFetches(
  orgId: string,
  videos: LessonYoutubeVideo[],
  userId: string,
  courseId: string | null
): Promise<void> {
  try {
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
    // Non-fatal: the caller still gets existing transcripts and the next request retries.
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

    if (pendingReason === 'unavailable') {
      return 'No captions are available for these YouTube video(s) right now, so there is no transcript to work from. Do not rely on the video title instead.';
    }

    return 'This lesson has YouTube video(s) but no transcript is available yet. Captions are being fetched — ask again shortly.';
  }

  if (hasUploadVideos) {
    return 'This lesson has an uploaded video, but no transcript is available yet — transcription may still be processing.';
  }

  return 'No transcript is available for this lesson.';
}
