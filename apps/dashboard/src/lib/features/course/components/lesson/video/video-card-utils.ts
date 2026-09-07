import {
  getYoutubeVideoId,
  isValidYoutubeUrl as isYoutubeUrl,
  isValidVimeoUrl as isVimeoUrl,
  extractVimeoDetails as getVimeoVideoDetails,
  normalizeHttpUrl
} from '@cio/utils';
import { lessonApi } from '$features/course/api';
import { mediaApi } from '$features/media/api';
import { snackbar } from '$features/ui/snackbar/store';
import type { LessonVideoType } from '$features/course/utils/types';
export type { LessonVideoType };

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
  videoId?: string;
  hash?: string;
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
 * Thumbnail URL for a lesson video. Checks metadata.thumbnailUrl first; YouTube falls back to img.youtube.com; Google Drive falls back to drive thumbnail.
 */
export function getVideoThumbnailUrl(video: LessonVideo): string | null {
  const meta = video.metadata as VideoMetadata | undefined;
  if (meta?.thumbnailUrl && typeof meta.thumbnailUrl === 'string') {
    return meta.thumbnailUrl;
  }

  if ((video.type === 'youtube' || isYoutubeUrl(video.link)) && video.link) {
    const id = getYoutubeVideoId(video.link);
    return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
  }
  if (video.type === 'google_drive') {
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

  if (video.type === 'youtube' || isYoutubeUrl(video.link)) return 'YouTube video';
  if (video.type === 'vimeo' || isVimeoUrl(video.link)) return 'Vimeo video';
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

export interface CreateExternalLessonVideoOptions {
  link: string;
  type?: 'vimeo' | 'youtube' | 'generic';
  lessonId?: string;
  position: number;
  fallbackTitle?: string;
}

/**
 * Shared helper that resolves video metadata (oEmbed/API), creates the asset,
 * attaches it to the lesson target, and shapes the returned LessonVideo object.
 */
export async function createExternalLessonVideo(options: CreateExternalLessonVideoOptions): Promise<LessonVideo> {
  const { link, lessonId, position, fallbackTitle } = options;
  const createdAt = new Date().toISOString();
  const isVimeo = options.type === 'vimeo' || isVimeoUrl(link);
  const isYoutube = options.type === 'youtube' || isYoutubeUrl(link);
  const provider = isVimeo ? 'vimeo' : isYoutube ? 'youtube' : 'generic';
  const videoType = options.type ?? (provider as LessonVideoType);

  let resolvedTitle = fallbackTitle ?? link;
  let thumbnailUrl: string | undefined;
  let durationSeconds: number | undefined;
  let videoId: string | undefined;
  let hash: string | undefined;
  let sourceUrl = link;

  if (isVimeo) {
    const metadata = await mediaApi.getVimeoMetadata(link);
    if (metadata) {
      sourceUrl = metadata.sourceUrl || link;
      resolvedTitle = metadata.title || resolvedTitle;
      thumbnailUrl = metadata.thumbnailUrl ?? undefined;
      durationSeconds = metadata.durationSeconds ?? undefined;
      videoId = metadata.videoId;
      hash = metadata.hash ?? undefined;
    }
  } else if (isYoutube) {
    const metadata = await mediaApi.getYouTubeMetadata(link);
    if (metadata) {
      sourceUrl = metadata.sourceUrl || link;
      resolvedTitle = metadata.title || resolvedTitle;
      thumbnailUrl = metadata.thumbnailUrl ?? undefined;
      durationSeconds = metadata.durationSeconds ?? undefined;
      videoId = metadata.videoId;
    }
  }

  const videoMetadata: VideoMetadata = {
    createdAt,
    ...(videoId ? { videoId } : {}),
    ...(hash ? { hash } : {}),
    ...(resolvedTitle ? { title: resolvedTitle } : {}),
    ...(thumbnailUrl ? { thumbnailUrl } : {}),
    ...(durationSeconds ? { duration: durationSeconds } : {})
  };

  const asset = await mediaApi.createAsset({
    kind: 'video',
    provider,
    storageProvider: 'external',
    sourceUrl,
    isExternal: true,
    title: resolvedTitle,
    thumbnailUrl,
    durationSeconds,
    metadata: videoMetadata
  });

  if (!asset) {
    throw new Error('Failed to create external video asset');
  }

  if (lessonId) {
    const attached = await mediaApi.attachAsset(asset.id, {
      targetType: 'lesson',
      targetId: lessonId,
      slotType: 'lesson_video',
      position
    });

    if (!attached) {
      throw new Error('Failed to attach video asset to lesson');
    }
  }

  return {
    type: videoType as LessonVideoType,
    link: sourceUrl,
    assetId: asset.id,
    fileName: resolvedTitle,
    metadata: videoMetadata
  };
}

export interface AddExternalVideosToLessonOptions {
  links: string[];
  type: 'youtube' | 'vimeo' | 'generic';
  lessonId?: string;
  fallbackTitle?: string;
}

/**
 * Shared helper that filters duplicates, notifies the user via snackbar,
 * creates and attaches external videos, and updates lesson state.
 * Returns the count of newly added videos.
 */
export async function addExternalVideosToLesson(options: AddExternalVideosToLessonOptions): Promise<number> {
  const { links, type, lessonId, fallbackTitle } = options;
  if (!lessonApi.lesson || links.length === 0) {
    return 0;
  }

  const existingVideos = Array.isArray(lessonApi.lesson.videos) ? lessonApi.lesson.videos : [];
  const { uniqueLinks, duplicateLinks } = filterDuplicateVideoLinks(links, type, existingVideos);

  if (uniqueLinks.length === 0) {
    snackbar.error('course.navItem.lessons.materials.tabs.video.add_video.duplicate_video_error');

    return 0;
  }

  if (duplicateLinks.length > 0) {
    snackbar.info('course.navItem.lessons.materials.tabs.video.add_video.duplicates_skipped');
  }

  const existingCount = existingVideos.length;
  const results = await Promise.allSettled(
    uniqueLinks.map((link, index) =>
      createExternalLessonVideo({
        link,
        type,
        lessonId,
        position: existingCount + index,
        fallbackTitle
      })
    )
  );

  const newVideos = results
    .filter((result): result is PromiseFulfilledResult<LessonVideo> => result.status === 'fulfilled')
    .map((result) => result.value);
  const failedCount = results.length - newVideos.length;

  if (newVideos.length > 0) {
    lessonApi.updateLessonState('videos', newVideos, { append: true });
  }

  if (failedCount > 0) {
    if (newVideos.length === 0) {
      snackbar.error('course.navItem.lessons.materials.tabs.video.add_video.add_video_failed');
    } else {
      snackbar.error('course.navItem.lessons.materials.tabs.video.add_video.some_videos_failed');
    }
  }

  return newVideos.length;
}

/**
 * Determines whether a candidate video link is a duplicate of any video in the lesson.
 * Matches by:
 * 1. YouTube video ID (across full youtube.com, short youtu.be, embed URLs, and stored metadata)
 * 2. Vimeo video ID and privacy hash (across standard, unlisted, and player.vimeo.com URLs)
 * 3. Exact normalized URL match
 */
export function isDuplicateLessonVideo(
  candidateLink: string,
  candidateType: LessonVideoType | undefined,
  existingVideos: LessonVideo[]
): boolean {
  if (!candidateLink || !Array.isArray(existingVideos) || existingVideos.length === 0) {
    return false;
  }

  const trimmedCandidate = candidateLink.trim();
  const normalizedCandidateLink = normalizeHttpUrl(trimmedCandidate);
  const isCandidateYoutube = candidateType === 'youtube' || isYoutubeUrl(trimmedCandidate);
  const isCandidateVimeo = candidateType === 'vimeo' || isVimeoUrl(trimmedCandidate);

  const candidateYoutubeId = isCandidateYoutube ? getYoutubeVideoId(trimmedCandidate) : null;
  const candidateVimeoDetails = isCandidateVimeo ? getVimeoVideoDetails(trimmedCandidate) : null;

  for (const existing of existingVideos) {
    if (!existing) continue;

    // 1. YouTube video ID comparison
    if (candidateYoutubeId) {
      const existingMeta = existing.metadata as VideoMetadata | undefined;
      const existingYoutubeId = existingMeta?.videoId ?? (existing.link ? getYoutubeVideoId(existing.link) : null);

      if (existingYoutubeId && existingYoutubeId === candidateYoutubeId) {
        return true;
      }
    }

    // 2. Vimeo video ID & hash comparison
    if (candidateVimeoDetails?.videoId) {
      const existingMeta = existing.metadata as VideoMetadata | undefined;
      const existingVimeoDetails = existing.link ? getVimeoVideoDetails(existing.link) : null;
      const existingVimeoId = existingMeta?.videoId ?? existingVimeoDetails?.videoId;
      const existingVimeoHash = existingMeta?.hash ?? existingVimeoDetails?.hash;

      if (existingVimeoId && existingVimeoId === candidateVimeoDetails.videoId) {
        if (candidateVimeoDetails.hash && existingVimeoHash) {
          if (existingVimeoHash === candidateVimeoDetails.hash) {
            return true;
          }
        } else {
          return true;
        }
      }
    }

    // 3. Exact or normalized URL comparison
    if (existing.link) {
      const normalizedExistingLink = normalizeHttpUrl(existing.link.trim());

      if (normalizedExistingLink === normalizedCandidateLink) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Filters candidate video links, separating non-duplicates from duplicates.
 * Also deduplicates links within candidateLinks itself so batch pastes are clean.
 */
export function filterDuplicateVideoLinks(
  candidateLinks: string[],
  candidateType: LessonVideoType | undefined,
  existingVideos: LessonVideo[]
): { uniqueLinks: string[]; duplicateLinks: string[] } {
  const uniqueLinks: string[] = [];
  const duplicateLinks: string[] = [];
  const currentExisting: LessonVideo[] = [...(existingVideos || [])];

  for (const rawLink of candidateLinks) {
    const link = rawLink.trim();
    if (!link) continue;

    const isDuplicate = isDuplicateLessonVideo(link, candidateType, currentExisting);

    if (isDuplicate) {
      duplicateLinks.push(link);
    } else {
      uniqueLinks.push(link);
      currentExisting.push({
        type: candidateType ?? 'generic',
        link
      });
    }
  }

  return { uniqueLinks, duplicateLinks };
}
