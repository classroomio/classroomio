/**
 * Callers forward only the parsed ID to the provider, never the model-supplied
 * string. An ID cannot express a host, port or scheme, so rebuilding the URL
 * from it closes the SSRF holes a hostname denylist leaves open (DNS rebinding,
 * `.internal` names, redirects, userinfo-in-authority).
 */

const ALLOWED_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
  'youtu.be',
  'www.youtu.be'
]);

const PLAYLIST_ID_REGEX = /^[A-Za-z0-9_-]{2,64}$/;

/** Private per-account playlists; they resolve to whoever is signed in. */
const PRIVATE_PLAYLIST_IDS = new Set(['LL', 'WL']);

function isPlausiblePlaylistId(value: string): boolean {
  if (!PLAYLIST_ID_REGEX.test(value)) {
    return false;
  }

  return !PRIVATE_PLAYLIST_IDS.has(value.toUpperCase());
}

/** Returns `null` for anything that is not an allowlisted YouTube playlist. */
export function parseYoutubePlaylistId(rawValue: string): string | null {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return null;
  }

  if (!trimmed.includes('/') && !trimmed.includes(':')) {
    return isPlausiblePlaylistId(trimmed) ? trimmed : null;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return null;
  }

  if (!ALLOWED_HOSTS.has(parsedUrl.hostname.toLowerCase())) {
    return null;
  }

  const listParam = parsedUrl.searchParams.get('list');
  if (!listParam) {
    return null;
  }

  return isPlausiblePlaylistId(listParam) ? listParam : null;
}

/** Rebuilt from the parsed ID, so it is safe to show to a user. */
export function buildPlaylistUrl(playlistId: string): string {
  return `https://www.youtube.com/playlist?list=${playlistId}`;
}
