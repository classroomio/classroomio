import type { WhatsNewEntry } from './types';

export const WHATS_NEW_ENDPOINT = 'https://classroomio.com/api/changelog?limit=5';
export const WHATS_NEW_LAST_SEEN_KEY = 'cio:whats-new:last-seen';

export function countNewEntries(entries: WhatsNewEntry[], lastSeenAt: string | null): number {
  if (!lastSeenAt) return 0;

  const lastSeenTime = new Date(lastSeenAt).getTime();

  return entries.filter((entry) => new Date(entry.publishedAt).getTime() > lastSeenTime).length;
}

export function getYoutubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
}
