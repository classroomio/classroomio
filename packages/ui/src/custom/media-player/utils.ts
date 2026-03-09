/**
 * Extracts a YouTube video ID from standard YouTube URL variants.
 */
export function getYoutubeVideoId(url: string): string | null {
  const trimmedUrl = String(url ?? '').trim();
  if (!trimmedUrl) return null;

  try {
    const parsedUrl = new URL(trimmedUrl);
    const host = parsedUrl.hostname.replace(/^www\./, '').toLowerCase();

    if (host === 'youtu.be') {
      return parsedUrl.pathname.split('/').filter(Boolean)[0] ?? null;
    }

    if (host !== 'youtube.com' && host !== 'm.youtube.com') {
      return null;
    }

    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);

    if (pathParts[0] === 'watch') {
      return parsedUrl.searchParams.get('v');
    }

    if (pathParts[0] === 'embed' || pathParts[0] === 'shorts' || pathParts[0] === 'live') {
      return pathParts[1] ?? null;
    }

    return null;
  } catch {
    return null;
  }
}

export function formatYoutubeEmbedUrl(url: string): string {
  const videoId = getYoutubeVideoId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}

export function isYoutubeUrl(url: string): boolean {
  return getYoutubeVideoId(url) !== null;
}
