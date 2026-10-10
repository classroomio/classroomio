const YOUTUBE_URL_PATTERN =
  /https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:[^\s)]*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})[^\s)<]*/;

/**
 * Returns the id of the first YouTube link in a changelog's markdown, or null when there is none.
 */
export function extractYoutubeId(markdown: string): string | null {
  return markdown.match(YOUTUBE_URL_PATTERN)?.[1] ?? null;
}

/**
 * Removes every line that carries a YouTube link so the video line never becomes the summary.
 */
export function stripYoutubeLines(markdown: string): string {
  return markdown
    .split('\n')
    .filter((line) => !YOUTUBE_URL_PATTERN.test(line))
    .join('\n');
}

export type PlaylistVideo = { id: string; publishedAt: string };

const MATCH_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Reads video ids and publish times from a YouTube playlist RSS feed. Skips entries it cannot read.
 */
export function parsePlaylistFeed(xml: string): PlaylistVideo[] {
  const videos: PlaylistVideo[] = [];

  for (const [block] of xml.matchAll(/<entry>[\s\S]*?<\/entry>/g)) {
    const id = block.match(/<yt:videoId>([A-Za-z0-9_-]{11})<\/yt:videoId>/)?.[1];
    const publishedAt = block.match(/<published>([^<]+)<\/published>/)?.[1];

    if (id && publishedAt && !Number.isNaN(Date.parse(publishedAt))) {
      videos.push({ id, publishedAt });
    }
  }

  return videos;
}

/**
 * Pairs each changelog entry with the playlist video published closest to it, within 24 hours.
 * Each video is used at most once, with the closest pairs assigned first.
 */
export function matchVideosToEntries(
  entries: { id: string; publishedAt: string }[],
  videos: PlaylistVideo[]
): Map<string, string> {
  const candidates = entries.flatMap((entry) =>
    videos.map((video) => ({
      entryId: entry.id,
      videoId: video.id,
      gap: Math.abs(Date.parse(video.publishedAt) - Date.parse(entry.publishedAt))
    }))
  );
  const matches = new Map<string, string>();
  const usedVideos = new Set<string>();

  for (const candidate of candidates.filter((pair) => pair.gap <= MATCH_WINDOW_MS).sort((a, b) => a.gap - b.gap)) {
    if (matches.has(candidate.entryId) || usedVideos.has(candidate.videoId)) continue;

    matches.set(candidate.entryId, candidate.videoId);
    usedVideos.add(candidate.videoId);
  }

  return matches;
}

/**
 * Picks the video for a changelog entry: a manual override first, then the playlist match,
 * then the first YouTube link in the entry text.
 */
export function resolveVideoId(
  entryId: string,
  markdown: string,
  overrides: Record<string, string>,
  playlistMatches: Map<string, string>
): string | null {
  return overrides[entryId] ?? playlistMatches.get(entryId) ?? extractYoutubeId(markdown);
}
