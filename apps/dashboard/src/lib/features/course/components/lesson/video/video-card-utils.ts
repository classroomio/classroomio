import { getYoutubeVideoId } from '@cio/ui/custom/media-player';

export type LessonVideo = NonNullable<import('$features/course/utils/types').Lesson['videos']>[number];

export type Hls1080Status = 'none' | 'generating' | 'ready' | 'failed';

export type VideoMetadata = {
  title?: string;
  fileName?: string;
  aspectRatio?: string;
  duration?: number;
  createdAt?: string;
  thumbnailUrl?: string;
  googleDriveFileId?: string;
  mimeType?: string;
  hls?: boolean;
  sourceWidth?: number;
  sourceHeight?: number;
  hlsRenditions?: string[];
  hls1080Status?: Hls1080Status;
};

export function getVideoMetadata(video: LessonVideo): VideoMetadata {
  if (video.metadata && typeof video.metadata === 'object' && !Array.isArray(video.metadata)) {
    return video.metadata as VideoMetadata;
  }

  return {};
}

export function isHlsUploadVideo(video: LessonVideo): boolean {
  if (video.type !== 'upload') return false;

  const metadata = getVideoMetadata(video);
  if (metadata.hls === true) return true;

  return typeof video.link === 'string' && video.link.includes('/hls/') && video.link.endsWith('.m3u8');
}

export function hasHls1080Rendition(video: LessonVideo): boolean {
  const metadata = getVideoMetadata(video);
  return metadata.hlsRenditions?.includes('p1080') ?? false;
}

export function canGenerateHls1080(video: LessonVideo): boolean {
  if (!isHlsUploadVideo(video)) return false;

  const assetId = (video as LessonVideo & { assetId?: string }).assetId;
  if (!assetId) return false;

  const metadata = getVideoMetadata(video);
  const sourceHeight = metadata.sourceHeight;
  if (sourceHeight != null && sourceHeight < 1080) return false;

  if (hasHls1080Rendition(video)) return false;
  if (metadata.hls1080Status === 'generating') return false;

  return true;
}

export function getHls1080Status(video: LessonVideo): Hls1080Status | 'unavailable' | 'unknown' {
  const metadata = getVideoMetadata(video);
  if (!isHlsUploadVideo(video)) return 'unavailable';

  if (hasHls1080Rendition(video) || metadata.hls1080Status === 'ready') {
    return 'ready';
  }

  const sourceHeight = metadata.sourceHeight;
  if (sourceHeight == null) return 'unknown';
  if (sourceHeight < 1080) return 'unavailable';

  return metadata.hls1080Status ?? 'none';
}

/**
 * Thumbnail URL for a lesson video. YouTube uses img.youtube.com; uploads use metadata.thumbnailUrl when present.
 */
export function getVideoThumbnailUrl(video: LessonVideo): string | null {
  if (video.type === 'youtube' && video.link) {
    const id = getYoutubeVideoId(video.link);
    return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
  }
  if (video.type === 'upload') {
    const meta = video.metadata as VideoMetadata | undefined;
    if (meta?.thumbnailUrl && typeof meta.thumbnailUrl === 'string') return meta.thumbnailUrl;
  }
  if (video.type === 'google_drive') {
    const meta = video.metadata as VideoMetadata | undefined;
    if (meta?.thumbnailUrl && typeof meta.thumbnailUrl === 'string') return meta.thumbnailUrl;
    if (meta?.googleDriveFileId && typeof meta.googleDriveFileId === 'string') {
      return `https://drive.google.com/thumbnail?id=${meta.googleDriveFileId}&sz=w400`;
    }
  }
  return null;
}

/**
 * Format duration in seconds as M:SS. Returns null if no duration.
 */
export function formatVideoDuration(seconds: number | undefined | null): string | null {
  if (seconds == null || typeof seconds !== 'number' || seconds < 0) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Fallback: derive display name from upload key (format: "nanoid-filename.ext").
 * Used only for older uploads that don't have top-level fileName.
 */
function getFileNameFromKey(key: string | undefined): string | null {
  if (!key || typeof key !== 'string') return null;
  const dashIndex = key.indexOf('-');
  if (dashIndex === -1) return null;
  return key.slice(dashIndex + 1).trim() || null;
}

/**
 * Display title for a video.
 * Order: top-level fileName → metadata.title → (upload only) derive from key → type fallback → "Video N".
 */
export function getVideoTitle(video: LessonVideo, index: number): string {
  const topLevelName = (video as LessonVideo & { fileName?: string }).fileName;
  if (topLevelName && typeof topLevelName === 'string') return topLevelName;

  const meta = video.metadata as VideoMetadata | undefined;

  if (meta?.title && typeof meta.title === 'string') return meta.title;

  if (video.type === 'upload' && video.key) {
    const fromKey = getFileNameFromKey(video.key);

    if (fromKey) return fromKey;
  }

  if (video.type === 'youtube') return 'YouTube video';
  if (video.type === 'generic') return 'Embedded video';
  if (video.type === 'google_drive') return 'Google Drive video';

  return `Video ${index + 1}`;
}

/**
 * Duration in seconds from metadata, if present.
 */
export function getVideoDurationSeconds(video: LessonVideo): number | null {
  const meta = video.metadata as VideoMetadata | undefined;
  if (meta?.duration != null && typeof meta.duration === 'number') return meta.duration;
  return null;
}

/**
 * Created at ISO string from metadata, if present.
 */
export function getVideoCreatedAt(video: LessonVideo): string | null {
  const meta = video.metadata as VideoMetadata | undefined;
  if (meta?.createdAt && typeof meta.createdAt === 'string') return meta.createdAt;
  return null;
}

/**
 * Format created-at for display (e.g. "Feb 15, 2026").
 */
export function formatVideoCreatedAt(isoString: string | null | undefined): string | null {
  if (!isoString || typeof isoString !== 'string') return null;
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(d);
}

export function isEnforceableLessonVideo(video: LessonVideo): boolean {
  return video.type === 'upload' && Boolean((video as LessonVideo & { assetId?: string }).assetId);
}

export function resolveWatchEnforcedAssetIds(
  videos: LessonVideo[] | null | undefined,
  completionPolicy: string | null | undefined
): string[] {
  const lessonVideos = videos ?? [];
  const flaggedAssetIds = lessonVideos
    .filter((video) => video.watchEnforced && isEnforceableLessonVideo(video))
    .map((video) => (video as LessonVideo & { assetId: string }).assetId);

  if (flaggedAssetIds.length > 0) {
    return Array.from(new Set(flaggedAssetIds));
  }

  if (completionPolicy !== 'video_watch') {
    return [];
  }

  return Array.from(
    new Set(
      lessonVideos
        .filter((video) => isEnforceableLessonVideo(video))
        .map((video) => (video as LessonVideo & { assetId: string }).assetId)
    )
  );
}
