import { extractIframeSrcOrUrl } from './links';

const VIMEO_ID_PATTERN = /^\d+$/;
const VIMEO_HASH_PATTERN = /^[a-zA-Z0-9]+$/;

export interface VimeoVideoDetails {
  videoId: string;
  hash?: string;
}

function normalizeVimeoLink(rawLink = ''): string {
  const extracted = extractIframeSrcOrUrl(rawLink);
  if (!extracted) {
    return '';
  }

  if (extracted.startsWith('http://') || extracted.startsWith('https://')) {
    return extracted;
  }

  return `https://${extracted}`;
}

/**
 * Extracts the videoId and optional privacy hash from a Vimeo URL.
 * Accepts standard links, channels, showcases, albums, and player.vimeo.com URLs.
 * Strictly verifies that the video ID is numeric and the hash is alphanumeric,
 * and only accepts official Vimeo domains (vimeo.com, player.vimeo.com).
 */
export function extractVimeoDetails(url = ''): VimeoVideoDetails | null {
  const normalized = normalizeVimeoLink(url);
  if (!normalized) {
    return null;
  }

  try {
    const parsed = new URL(normalized);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();

    if (host !== 'vimeo.com' && host !== 'player.vimeo.com') {
      return null;
    }

    const segments = parsed.pathname.split('/').filter(Boolean);
    if (segments.length === 0) {
      return null;
    }

    let candidateId: string | null = null;
    let candidateHash: string | null = parsed.searchParams.get('h') || null;

    if (host === 'player.vimeo.com') {
      // https://player.vimeo.com/video/{videoId}(?h={hash})
      if (segments[0] === 'video' && segments[1]) {
        candidateId = segments[1];
      }
    } else {
      // https://vimeo.com/channels/{channel}/{videoId}
      if (segments[0] === 'channels' && segments[2]) {
        candidateId = segments[2];
      }
      // https://vimeo.com/groups/{group}/videos/{videoId}
      else if (segments[0] === 'groups' && segments[1] === 'videos' && segments[2]) {
        candidateId = segments[2];
      }
      // https://vimeo.com/showcase/{id}/video/{videoId} or album/{id}/video/{videoId}
      else if ((segments[0] === 'showcase' || segments[0] === 'album') && segments[2] === 'video' && segments[3]) {
        candidateId = segments[3];
      }
      // https://vimeo.com/manage/videos/{videoId}
      else if (segments[0] === 'manage' && segments[1] === 'videos' && segments[2]) {
        candidateId = segments[2];
      }
      // https://vimeo.com/{videoId} or https://vimeo.com/{videoId}/{hash}
      else if (VIMEO_ID_PATTERN.test(segments[0])) {
        candidateId = segments[0];
        if (segments[1] && !candidateHash) {
          candidateHash = segments[1];
        }
      }
    }

    if (!candidateId || !VIMEO_ID_PATTERN.test(candidateId)) {
      return null;
    }

    if (candidateHash && !VIMEO_HASH_PATTERN.test(candidateHash)) {
      return null;
    }

    return {
      videoId: candidateId,
      ...(candidateHash ? { hash: candidateHash } : {})
    };
  } catch {
    return null;
  }
}

export function isValidVimeoUrl(url = ''): boolean {
  return extractVimeoDetails(url) !== null;
}

export function extractVimeoVideoId(url = ''): string | null {
  const details = extractVimeoDetails(url);
  return details?.videoId ?? null;
}

/**
 * Reconstructs a clean canonical URL from regex-verified tokens.
 * Never echoes unverified user input or extra query parameters.
 */
export function toCanonicalVimeoUrl(urlOrDetails: string | VimeoVideoDetails): string | null {
  const details = typeof urlOrDetails === 'string' ? extractVimeoDetails(urlOrDetails) : urlOrDetails;
  if (!details || !VIMEO_ID_PATTERN.test(details.videoId)) {
    return null;
  }

  if (details.hash && VIMEO_HASH_PATTERN.test(details.hash)) {
    return `https://vimeo.com/${details.videoId}/${details.hash}`;
  }

  return `https://vimeo.com/${details.videoId}`;
}

/**
 * Reconstructs the official Vimeo embed URL.
 * Includes privacy hash when present (?h={hash}).
 */
export function formatVimeoEmbedUrl(urlOrDetails: string | VimeoVideoDetails): string {
  const details = typeof urlOrDetails === 'string' ? extractVimeoDetails(urlOrDetails) : urlOrDetails;
  if (!details || !VIMEO_ID_PATTERN.test(details.videoId)) {
    return typeof urlOrDetails === 'string' ? urlOrDetails : '';
  }

  const queryParams = new URLSearchParams();
  if (details.hash && VIMEO_HASH_PATTERN.test(details.hash)) {
    queryParams.set('h', details.hash);
  }

  const queryString = queryParams.toString();
  return queryString
    ? `https://player.vimeo.com/video/${details.videoId}?${queryString}`
    : `https://player.vimeo.com/video/${details.videoId}`;
}
