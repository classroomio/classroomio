import type { WhatsNewEntry } from './types';

export const WHATS_NEW_ENDPOINT = '/api/whats-new';
export const WHATS_NEW_SEEN_KEY = 'cio:whats-new:seen';

const MAX_REMEMBERED_ENTRIES = 50;

/**
 * Entries the user has not opened yet, in the order given (newest first).
 */
export function getUnseenEntries(entries: WhatsNewEntry[], seenIds: string[]): WhatsNewEntry[] {
  const seen = new Set(seenIds);

  return entries.filter((entry) => !seen.has(entry.id));
}

export function parseSeenIds(raw: string | null): string[] {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * Adds an id to the remembered list, keeping only the most recent ids so the stored value stays small.
 */
export function addSeenId(seenIds: string[], id: string): string[] {
  if (seenIds.includes(id)) return seenIds;

  return [...seenIds, id].slice(-MAX_REMEMBERED_ENTRIES);
}

export function getYoutubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
}
