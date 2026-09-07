/**
 * YouTube playlist URL → playlist ID.
 *
 * Callers must forward only the parsed ID to the provider, never the string the
 * model supplied. A playlist ID cannot express a host, port, or scheme, so
 * re-canonicalizing from the ID removes the whole class of SSRF tricks that a
 * hostname denylist still leaves open (DNS rebinding, `.internal` names,
 * redirects, userinfo-in-authority).
 */

/** Hosts a playlist link may come from. Everything else is rejected outright. */
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

/** YouTube playlist IDs are URL-safe base64-ish and comfortably inside this range. */
const PLAYLIST_ID_REGEX = /^[A-Za-z0-9_-]{2,64}$/;

/**
 * Per-account playlists that are private by definition — "Liked videos" and
 * "Watch Later". They resolve to whoever is signed in, so they are never a
 * legitimate target for a server-side fetch.
 */
const PRIVATE_PLAYLIST_IDS = new Set(['LL', 'WL']);

/** A playlist id must look like a real playlist, not a bare 11-char video id. */
function isPlausiblePlaylistId(value: string): boolean {
  if (!PLAYLIST_ID_REGEX.test(value)) {
    return false;
  }

  return !PRIVATE_PLAYLIST_IDS.has(value.toUpperCase());
}

/**
 * Extract the playlist ID from a playlist URL, or accept a bare playlist ID.
 * Returns `null` for anything that is not an allowlisted YouTube playlist.
 */
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

/** Canonical URL rebuilt from the parsed ID — safe to show to a user. */
export function buildPlaylistUrl(playlistId: string): string {
  return `https://www.youtube.com/playlist?list=${playlistId}`;
}
