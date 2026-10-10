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

/**
 * Picks the video for a changelog entry: the registry wins, then the first YouTube link in the entry text.
 */
export function resolveVideoId(entryId: string, markdown: string, registry: Record<string, string>): string | null {
  return registry[entryId] ?? extractYoutubeId(markdown);
}
