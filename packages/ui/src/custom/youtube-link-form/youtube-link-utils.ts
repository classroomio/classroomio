import {
  getYoutubeVideoId,
  isValidYoutubeUrl,
  toCanonicalYoutubeUrl,
  formatYoutubeEmbedUrl,
  splitLinks,
  normalizeHttpUrl
} from '@cio/utils';

export const splitYoutubeLinks = splitLinks;
export const normalizeYoutubeLink = normalizeHttpUrl;
export { getYoutubeVideoId };
export const isValidYoutubeLink = isValidYoutubeUrl;
export const toCanonicalYoutubeLink = toCanonicalYoutubeUrl;

export function toYoutubeEmbedUrl(link = ''): string | null {
  const videoId = getYoutubeVideoId(link);
  if (!videoId) return null;

  return formatYoutubeEmbedUrl(link);
}
