const YOUTUBE_VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

export function splitYoutubeLinks(rawInput = ''): string[] {
  return rawInput
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function normalizeYoutubeLink(rawLink = ''): string {
  const trimmedLink = rawLink.trim();
  if (!trimmedLink) return '';

  if (trimmedLink.startsWith('http://') || trimmedLink.startsWith('https://')) {
    return trimmedLink;
  }

  return `https://${trimmedLink}`;
}

export function getYoutubeVideoId(link = ''): string | null {
  const normalizedLink = normalizeYoutubeLink(link);
  if (!normalizedLink) return null;

  try {
    const parsedUrl = new URL(normalizedLink);
    const host = parsedUrl.hostname.replace(/^www\./, '').toLowerCase();

    if (host === 'youtu.be') {
      const shortPath = parsedUrl.pathname.split('/').filter(Boolean)[0] ?? '';
      return YOUTUBE_VIDEO_ID_PATTERN.test(shortPath) ? shortPath : null;
    }

    if (host !== 'youtube.com' && host !== 'm.youtube.com') {
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

export function isValidYoutubeLink(link = ''): boolean {
  return getYoutubeVideoId(link) !== null;
}

export function toCanonicalYoutubeLink(link = ''): string | null {
  const videoId = getYoutubeVideoId(link);
  if (!videoId) return null;

  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function toYoutubeEmbedUrl(link = ''): string | null {
  const videoId = getYoutubeVideoId(link);
  if (!videoId) return null;

  return `https://www.youtube.com/embed/${videoId}`;
}
