import { getYoutubeVideoId } from '$features/ui/media-player';

export type LessonVideo = NonNullable<import('$features/course/utils/types').Lesson['videos']>[number];

type VideoMetadata = {
  title?: string;
  fileName?: string;
  aspectRatio?: string;
  duration?: number;
  createdAt?: string;
  thumbnailUrl?: string;
};

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
