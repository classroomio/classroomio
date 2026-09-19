import { normalizeHttpUrl } from './links';

const YOUTUBE_VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

/**
 * Extracts a YouTube video ID from standard YouTube URL variants,
 * including youtu.be, watch URLs, embed URLs, shorts, and live URLs.
 * Supports youtube.com, m.youtube.com, and youtube-nocookie.com.
 */
export function getYoutubeVideoId(link = ''): string | null {
  const normalizedLink = normalizeHttpUrl(link);
  if (!normalizedLink) {
    return null;
  }

  try {
    const parsedUrl = new URL(normalizedLink);
    const host = parsedUrl.hostname.replace(/^www\./, '').toLowerCase();

    if (host === 'youtu.be') {
      const shortPath = parsedUrl.pathname.split('/').filter(Boolean)[0] ?? '';
      return YOUTUBE_VIDEO_ID_PATTERN.test(shortPath) ? shortPath : null;
    }

    if (
      host !== 'youtube.com' &&
      host !== 'm.youtube.com' &&
      host !== 'music.youtube.com' &&
      host !== 'youtube-nocookie.com'
    ) {
      return null;
    }

    const directPath = parsedUrl.pathname.split('/').filter(Boolean);

    if (directPath[0] === 'watch') {
      const watchId = parsedUrl.searchParams.get('v') ?? '';
      return YOUTUBE_VIDEO_ID_PATTERN.test(watchId) ? watchId : null;
    }

    if (directPath[0] === 'embed' || directPath[0] === 'shorts' || directPath[0] === 'live') {
      const pathId = directPath[1] ?? '';
      return YOUTUBE_VIDEO_ID_PATTERN.test(pathId) ? pathId : null;
    }

    return null;
  } catch {
    return null;
  }
}

export function isValidYoutubeUrl(link = ''): boolean {
  return getYoutubeVideoId(link) !== null;
}

export function toCanonicalYoutubeUrl(link = ''): string | null {
  const videoId = getYoutubeVideoId(link);
  if (!videoId) {
    return null;
  }

  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function formatYoutubeEmbedUrl(link = ''): string {
  const videoId = getYoutubeVideoId(link);
  if (!videoId) {
    return link;
  }

  return `https://www.youtube.com/embed/${videoId}`;
}
