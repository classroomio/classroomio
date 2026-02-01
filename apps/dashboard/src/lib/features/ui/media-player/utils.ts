/**
 * Formats a YouTube URL into an embed URL
 * Supports multiple YouTube URL formats:
 * - https://www.youtube.com/embed/qajK1J1neAM
 * - https://youtu.be/qajK1J1neAM
 * - https://www.youtube.com/watch?v=qajK1J1neAM
 */
export function formatYoutubeEmbedUrl(url: string): string {
  const prefix = 'https://www.youtube.com/embed';

  // Already an embed URL
  if (url.includes('embed')) {
    return url;
  }

  // Short youtu.be format
  if (url.includes('.be/')) {
    const splittedUrlWithBe = url.split('.be/');
    return `${prefix}/${splittedUrlWithBe[1]}`;
  }

  // Standard watch format
  const splitedUrl = url.split('watch');
  if (splitedUrl.length !== 2) {
    return url; // Return original if can't parse
  }

  const query = new URLSearchParams(splitedUrl[1]);
  const videoId = query.get('v');

  return videoId ? `${prefix}/${videoId}` : url;
}

/**
 * Extracts the YouTube video ID from various YouTube URL formats
 */
export function getYoutubeVideoId(url: string): string | null {
  // https://www.youtube.com/embed/qajK1J1neAM
  if (url.includes('embed')) {
    return url.split('embed/')[1]?.split('?')[0] || null;
  }

  // https://youtu.be/qajK1J1neAM
  if (url.includes('.be/')) {
    const splittedUrlWithBe = url.split('.be/');
    return splittedUrlWithBe[1]?.split('?')[0] || null;
  }

  // https://www.youtube.com/watch?v=qajK1J1neAM
  const splitedUrl = url.split('watch');
  if (splitedUrl.length !== 2) {
    return null;
  }

  const query = new URLSearchParams(splitedUrl[1]);
  return query.get('v');
}

/**
 * Checks if a URL is a YouTube URL
 */
export function isYoutubeUrl(url: string): boolean {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)/;
  return youtubeRegex.test(url);
}
