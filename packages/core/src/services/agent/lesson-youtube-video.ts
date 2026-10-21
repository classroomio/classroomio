import { AppError } from '@cio/utils/errors';

import { attachAssetService, createAssetFromUploadService, getYouTubeMetadataService } from '../assets/assets';
import { getLesson, updateLessonService } from '../lesson/lesson';

interface LessonVideoEntry {
  type: 'youtube' | 'generic' | 'upload' | 'google_drive';
  link: string;
  key?: string;
  assetId?: string;
  watchEnforced?: boolean;
  fileName?: string;
  metadata?: Record<string, unknown>;
}

export interface AttachYoutubeVideoToLessonResult {
  lessonId: string;
  lessonTitle: string;
  assetId: string;
  videoId: string;
  title: string;
  url: string;
  position: number;
}

/**
 * Attach a YouTube video the way the dashboard embed form does. All three writes
 * matter: skipping `lesson.videos` leaves the video tab empty, because that JSON
 * column is what it renders from.
 *
 * Caption prefetch is suppressed — otherwise attaching a playlist would spend one
 * provider credit per video up front. Captions are fetched when someone asks for
 * the lesson transcript instead.
 */
export async function attachYoutubeVideoToLesson(input: {
  orgId: string;
  userId: string;
  lessonId: string;
  videoUrl: string;
}): Promise<AttachYoutubeVideoToLessonResult> {
  const { orgId, userId, lessonId, videoUrl } = input;

  const metadata = await getYouTubeMetadataService(orgId, { url: videoUrl });
  const lesson = await getLesson(lessonId);
  const lessonWithVideos = lesson as { id: string; title: string; videos?: LessonVideoEntry[] | null };
  const existingVideos = lessonWithVideos.videos ?? [];

  const alreadyAttached = existingVideos.some(
    (video) =>
      video.type === 'youtube' && (video.metadata as { videoId?: string } | undefined)?.videoId === metadata.videoId
  );
  if (alreadyAttached) {
    throw new AppError(
      `That video is already attached to lesson "${lessonWithVideos.title}"`,
      'LESSON_VIDEO_ALREADY_ATTACHED',
      409
    );
  }

  const videoMetadata: Record<string, unknown> = {
    createdAt: new Date().toISOString(),
    videoId: metadata.videoId,
    title: metadata.title,
    thumbnailUrl: metadata.thumbnailUrl ?? undefined,
    duration: metadata.durationSeconds ?? undefined
  };

  const asset = await createAssetFromUploadService(
    orgId,
    userId,
    {
      kind: 'video',
      provider: 'youtube',
      storageProvider: 'external',
      sourceUrl: metadata.sourceUrl,
      isExternal: true,
      title: metadata.title,
      thumbnailUrl: metadata.thumbnailUrl ?? undefined,
      durationSeconds: metadata.durationSeconds ?? undefined,
      metadata: videoMetadata
    },
    { skipYoutubeCaptionPrefetch: true }
  );

  const position = existingVideos.length;

  await attachAssetService(orgId, asset.id, userId, {
    targetType: 'lesson',
    targetId: lessonId,
    slotType: 'lesson_video',
    position
  });

  const newVideo: LessonVideoEntry = {
    type: 'youtube',
    link: metadata.sourceUrl,
    assetId: asset.id,
    fileName: metadata.title,
    metadata: videoMetadata
  };

  await updateLessonService(lessonId, { videos: [...existingVideos, newVideo] });

  return {
    lessonId,
    lessonTitle: lessonWithVideos.title,
    assetId: asset.id,
    videoId: metadata.videoId,
    title: metadata.title,
    url: metadata.sourceUrl,
    position
  };
}
