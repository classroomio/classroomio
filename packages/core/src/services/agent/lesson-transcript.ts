import { listMediaTranscriptsByAssetIds, getMediaTranscriptByAsset } from '@cio/db/queries/media-transcript';
import { getLesson } from '../lesson/lesson';

export interface LessonVideoTranscriptResult {
  lessonId: string;
  title: string;
  hasTranscript: boolean;
  transcript: string | null;
  message?: string;
}

/**
 * Extract a YouTube video ID from a URL or metadata.
 * Returns null if not a YouTube video or ID not found.
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
 * Handles both uploaded videos (existing `media_transcript` path) and
 * YouTube embeds (cache-first, then lazy provider fetch for paid orgs).
 */
export async function getLessonVideoTranscript(
  lessonId: string,
  orgId: string,
  options?: { isOrgOnPaidPlan?: boolean }
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

  // Separate upload and YouTube videos
  const uploadAssetIds: string[] = [];
  const youtubeVideos: Array<{ assetId: string; youtubeVideoId: string; link: string }> = [];

  for (const video of videos) {
    if (video.type === 'upload' && video.assetId) {
      uploadAssetIds.push(video.assetId);
    } else if (video.type === 'youtube' && video.assetId) {
      const videoId = extractYoutubeVideoId(video.link, video.metadata);
      if (videoId) {
        youtubeVideos.push({
          assetId: video.assetId,
          youtubeVideoId: videoId,
          link: video.link ?? ''
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

  const uploadTranscripts =
    uploadAssetIds.length > 0 ? await listMediaTranscriptsByAssetIds(uploadAssetIds, orgId) : [];

  const youtubeTranscriptTexts: string[] = [];

  for (const youtubeVideo of youtubeVideos) {
    const existing = await getMediaTranscriptByAsset(youtubeVideo.assetId, orgId);
    if (existing?.text) {
      youtubeTranscriptTexts.push(existing.text);
      continue;
    }

    if (options?.isOrgOnPaidPlan === false) {
      youtubeTranscriptTexts.push(
        'YouTube video transcripts require a paid plan. Upgrade your account to access this feature.'
      );
      continue;
    }

    try {
      const apiKey = process.env.SUPADATA_API_KEY;
      if (!apiKey) continue;

      const { fetchAndCacheYoutubeCaptions } = await import('../youtube-captions');
      const result = await fetchAndCacheYoutubeCaptions({
        youtubeVideoId: youtubeVideo.youtubeVideoId,
        canonicalUrl: youtubeVideo.link,
        apiKey
      });

      if ('unavailable' in result) continue;

      try {
        const { writeYoutubeCaptionToMediaTranscript } = await import('../youtube-captions/write-through');
        const { getS3Client, getStorageConfig } = await import('../../config/storage');
        const { PutObjectCommand } = await import('@aws-sdk/client-s3');

        const s3 = getS3Client();
        const config = getStorageConfig();
        const bucket = config.bucketMedia;

        const uploadBuffer = async (
          bufBucket: string,
          key: string,
          buffer: Buffer,
          contentType: string,
          cacheControl?: string
        ) => {
          await s3.send(
            new PutObjectCommand({
              Bucket: bufBucket,
              Key: key,
              Body: buffer,
              ContentType: contentType,
              CacheControl: cacheControl
            })
          );
        };

        const getMediaBucket = () => bucket;

        await writeYoutubeCaptionToMediaTranscript({
          assetId: youtubeVideo.assetId,
          organizationId: orgId,
          captionResult: result,
          uploadBufferToBucket: uploadBuffer,
          mediaBucket: getMediaBucket
        });
      } catch {
        // Write-through failure is non-fatal — we still have the text
      }

      youtubeTranscriptTexts.push(result.text);
    } catch {
      // Lazy fetch failure is non-fatal — continue with other transcripts
    }
  }

  const allTranscripts = [
    ...uploadTranscripts.map((row) => row.text?.trim()).filter((text): text is string => Boolean(text)),
    ...youtubeTranscriptTexts
  ];

  const transcript = allTranscripts.join('\n\n');

  if (!transcript) {
    const hasYouTubeVideos = youtubeVideos.length > 0;
    const hasUploadVideos = uploadAssetIds.length > 0;

    if (hasYouTubeVideos && !hasUploadVideos) {
      return {
        lessonId: lessonWithVideos.id,
        title: lessonWithVideos.title,
        hasTranscript: false,
        transcript: null,
        message:
          'This lesson has YouTube video(s) but no transcript is available yet. Captions may still be fetching, or the video may not have captions enabled.'
      };
    }

    if (hasUploadVideos) {
      return {
        lessonId: lessonWithVideos.id,
        title: lessonWithVideos.title,
        hasTranscript: false,
        transcript: null,
        message:
          'This lesson has an uploaded video, but no transcript is available yet — transcription may still be processing.'
      };
    }

    return {
      lessonId: lessonWithVideos.id,
      title: lessonWithVideos.title,
      hasTranscript: false,
      transcript: null,
      message: 'No transcript is available for this lesson.'
    };
  }

  return {
    lessonId: lessonWithVideos.id,
    title: lessonWithVideos.title,
    hasTranscript: true,
    transcript
  };
}
