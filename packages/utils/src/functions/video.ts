import { isValidYoutubeUrl } from './youtube';
import { isValidVimeoUrl } from './vimeo';

export type VideoMediaType = 'youtube' | 'vimeo' | 'google_drive' | 'generic' | 'upload' | 'muse';

export interface VideoLike {
  type?: string;
  url?: string;
  sourceUrl?: string;
  link?: string;
  metadata?: {
    svid?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Checks whether a URL points to Google Drive or Google Docs.
 */
export function isGoogleDriveUrl(rawUrl = ''): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return false;
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return false;
  }

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(withProtocol);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();

    return host === 'drive.google.com' || host === 'docs.google.com';
  } catch {
    return false;
  }
}

/**
 * Determines the appropriate media player type for a given video URL or video item object.
 *
 * Checks in priority order:
 * 1. Explicit object type properties ('muse', 'upload', 'google_drive', 'vimeo', 'youtube')
 * 2. URL patterns:
 *    - Vimeo URL -> 'vimeo'
 *    - YouTube URL -> 'youtube'
 *    - Google Drive URL -> 'google_drive'
 * 3. Fallback: 'generic'
 *
 * @param video - Video URL string or video-like object
 * @returns Resolved VideoMediaType ('youtube' | 'vimeo' | 'google_drive' | 'generic' | 'upload' | 'muse')
 */
export function getVideoMediaType(video: string | VideoLike | null | undefined): VideoMediaType {
  if (!video) {
    return 'generic';
  }

  if (typeof video === 'object') {
    if (video.type === 'muse' || Boolean(video.metadata?.svid)) {
      return 'muse';
    }

    if (video.type === 'upload') {
      return 'upload';
    }

    if (video.type === 'google_drive') {
      return 'google_drive';
    }

    if (video.type === 'vimeo') {
      return 'vimeo';
    }

    if (video.type === 'youtube') {
      return 'youtube';
    }
  }

  const rawUrl = typeof video === 'string' ? video : (video.url ?? video.sourceUrl ?? video.link ?? '');
  const url = typeof rawUrl === 'string' ? rawUrl.trim() : '';

  if (!url) {
    return 'generic';
  }

  if (isValidVimeoUrl(url)) {
    return 'vimeo';
  }

  if (isValidYoutubeUrl(url)) {
    return 'youtube';
  }

  if (isGoogleDriveUrl(url)) {
    return 'google_drive';
  }

  return 'generic';
}

export const getVideoType = getVideoMediaType;
