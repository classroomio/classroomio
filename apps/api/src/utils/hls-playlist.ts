const URI_ATTRIBUTE = /URI="([^"]*)"/g;

function isRelativeUri(uri: string): boolean {
  return uri.length > 0 && !/^[a-z][a-z0-9+.-]*:/i.test(uri) && !uri.startsWith('//');
}

function withToken(uri: string, token: string): string {
  if (!isRelativeUri(uri)) return uri;

  const hashIndex = uri.indexOf('#');
  const base = hashIndex === -1 ? uri : uri.slice(0, hashIndex);
  const hash = hashIndex === -1 ? '' : uri.slice(hashIndex);
  const separator = base.includes('?') ? '&' : '?';

  return `${base}${separator}t=${encodeURIComponent(token)}${hash}`;
}

/**
 * Appends `t=<token>` to every relative URI in an HLS playlist (variant streams, segments,
 * and `URI="..."` attributes such as EXT-X-MEDIA, EXT-X-MAP and EXT-X-KEY) so a native player
 * that cannot send cookies or headers authorizes each follow-up request. Absolute URIs are left alone.
 */
export function appendTokenToPlaylist(playlist: string, token: string): string {
  return playlist
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;

      if (trimmed.startsWith('#')) {
        return line.replace(URI_ATTRIBUTE, (_match, uri: string) => `URI="${withToken(uri, token)}"`);
      }

      return withToken(trimmed, token);
    })
    .join('\n');
}

export function isPlaylistPath(path: string): boolean {
  return path.toLowerCase().endsWith('.m3u8');
}
