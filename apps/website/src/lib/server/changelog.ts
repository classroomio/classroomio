import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import type { ChangelogEntry } from '$lib/utils/types';
import { CHANGELOG_PLAYLIST_ID, CHANGELOG_VIDEO_OVERRIDES } from '$lib/data/changelog-videos';
import {
  matchVideosToEntries,
  parsePlaylistFeed,
  resolveVideoId,
  stripYoutubeLines,
  type PlaylistVideo
} from './changelog-video';

const USERJOT_CHANGELOG_URL = 'https://api.userjot.com/v1/changelogs';
const UPDATES_BASE_URL = 'https://feedback.classroomio.com/updates';
const UPDATES_SITEMAP_URL = 'https://feedback.classroomio.com/sitemap.xml';
const PLAYLIST_FEED_URL = `https://www.youtube.com/feeds/videos.xml?playlist_id=${CHANGELOG_PLAYLIST_ID}`;
const FETCH_LIMIT = 30;
const CACHE_TTL_MS = 1000 * 60 * 60 * 3;
const KV_KEY = 'userjot:changelog:v5';

type ChangelogCacheEntry = {
  entries: ChangelogEntry[];
  fetchedAt: number;
};

type UserJotChangelog = {
  id: string;
  title: string;
  markdown: string;
  short: string | null;
  cover: { url: string } | null;
  publish_at: string;
  tags: { name: string }[];
};

export type ChangelogKvNamespace = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
};

const memoryCache: ChangelogCacheEntry = { entries: [], fetchedAt: 0 };
let inFlightFetch: Promise<ChangelogEntry[]> | null = null;

function isFresh(entry: ChangelogCacheEntry, now: number) {
  return entry.fetchedAt > 0 && now - entry.fetchedAt < CACHE_TTL_MS;
}

function extractFirstParagraph(markdown: string) {
  const html = marked.parse(markdown, { async: false });
  const firstParagraph = html.match(/<p>([\s\S]*?)<\/p>/)?.[1] ?? '';

  return sanitizeHtml(firstParagraph, { allowedTags: [], allowedAttributes: {} }).trim() || null;
}

/**
 * Maps publish date (YYYY-MM-DD) to the public entry URL using UserJot's sitemap, since the API does not return slugs.
 * Dates shared by more than one entry are omitted so a link never points at the wrong entry.
 */
async function fetchEntryUrlsByDate(): Promise<Map<string, string>> {
  const urlsByDate = new Map<string, string>();

  try {
    const response = await fetch(UPDATES_SITEMAP_URL);

    if (!response.ok) {
      throw new Error(`UserJot sitemap returned ${response.status}`);
    }

    const sitemap = await response.text();
    const entryPattern = /<loc>([^<]*\/updates\/p\/[^<]+)<\/loc>\s*<lastmod>(\d{4}-\d{2}-\d{2})/g;
    const ambiguousDates = new Set<string>();

    for (const [, url, date] of sitemap.matchAll(entryPattern)) {
      if (urlsByDate.has(date)) {
        ambiguousDates.add(date);
      }

      urlsByDate.set(date, url);
    }

    ambiguousDates.forEach((date) => urlsByDate.delete(date));
  } catch (error) {
    console.error('getChangelog error: failed to read entry urls', error);
  }

  return urlsByDate;
}

/**
 * Reads the changelog playlist's public RSS feed. Returns no videos when it cannot be reached.
 */
async function fetchPlaylistVideos(): Promise<PlaylistVideo[]> {
  try {
    const response = await fetch(PLAYLIST_FEED_URL);

    if (!response.ok) {
      throw new Error(`YouTube playlist feed returned ${response.status}`);
    }

    return parsePlaylistFeed(await response.text());
  } catch (error) {
    console.error('getChangelog error: failed to read playlist videos', error);

    return [];
  }
}

function toChangelogEntry(
  changelog: UserJotChangelog,
  urlsByDate: Map<string, string>,
  videoMatches: Map<string, string>
): ChangelogEntry {
  return {
    id: changelog.id,
    title: changelog.title,
    summary: changelog.short?.trim() || extractFirstParagraph(stripYoutubeLines(changelog.markdown)),
    videoId: resolveVideoId(changelog.id, changelog.markdown, CHANGELOG_VIDEO_OVERRIDES, videoMatches),
    url: urlsByDate.get(changelog.publish_at.slice(0, 10)) ?? UPDATES_BASE_URL,
    coverUrl: changelog.cover?.url ?? null,
    publishedAt: changelog.publish_at,
    tags: changelog.tags.map((tag) => tag.name)
  };
}

async function fetchFromUserJot(apiKey: string): Promise<ChangelogEntry[]> {
  const url = `${USERJOT_CHANGELOG_URL}?status=published&limit=${FETCH_LIMIT}`;
  const [response, urlsByDate, playlistVideos] = await Promise.all([
    fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } }),
    fetchEntryUrlsByDate(),
    fetchPlaylistVideos()
  ]);

  if (!response.ok) {
    throw new Error(`UserJot API returned ${response.status}`);
  }

  const payload = (await response.json()) as { changelogs?: UserJotChangelog[] };
  const now = Date.now();

  const published = (payload.changelogs ?? [])
    .filter((changelog) => new Date(changelog.publish_at).getTime() <= now)
    .sort((a, b) => new Date(b.publish_at).getTime() - new Date(a.publish_at).getTime());
  const videoMatches = matchVideosToEntries(
    published.map((changelog) => ({ id: changelog.id, publishedAt: changelog.publish_at })),
    playlistVideos
  );

  return published.map((changelog) => toChangelogEntry(changelog, urlsByDate, videoMatches));
}

async function readKv(kv: ChangelogKvNamespace | null | undefined): Promise<ChangelogCacheEntry | null> {
  if (!kv) {
    return null;
  }

  try {
    const raw = await kv.get(KV_KEY);

    return raw ? (JSON.parse(raw) as ChangelogCacheEntry) : null;
  } catch (error) {
    console.error('getChangelog error: failed to read KV', error);
    return null;
  }
}

async function writeKv(kv: ChangelogKvNamespace | null | undefined, entry: ChangelogCacheEntry) {
  if (!kv) {
    return;
  }

  try {
    await kv.put(KV_KEY, JSON.stringify(entry));
  } catch (error) {
    console.error('getChangelog error: failed to write KV', error);
  }
}

async function resolveChangelog(
  apiKey: string,
  kv: ChangelogKvNamespace | null | undefined,
  now: number
): Promise<ChangelogEntry[]> {
  const kvEntry = await readKv(kv);

  if (kvEntry && isFresh(kvEntry, now)) {
    memoryCache.entries = kvEntry.entries;
    memoryCache.fetchedAt = kvEntry.fetchedAt;
    return kvEntry.entries;
  }

  try {
    const entries = await fetchFromUserJot(apiKey);

    memoryCache.entries = entries;
    memoryCache.fetchedAt = now;
    await writeKv(kv, { entries, fetchedAt: now });

    return entries;
  } catch (error) {
    console.error('getChangelog error:', error);

    if (memoryCache.fetchedAt > 0) {
      return memoryCache.entries;
    }

    return kvEntry?.entries ?? [];
  }
}

/**
 * Returns the published changelog entries, newest first, ready for the website and the dashboard sidebar.
 * Never throws: it returns stale cached entries when a refresh fails, and an empty list when there is no
 * API key or nothing cached.
 *
 * Each entry is `{ id, title, summary, url, videoId, coverUrl, publishedAt, tags }`:
 * - `summary` is UserJot's `short` text, or the first paragraph of the entry when `short` is empty, with any
 *   line that carries a YouTube link removed so the video link never becomes the summary.
 * - `url` is the public entry page on feedback.classroomio.com. UserJot's API does not return slugs, so it is
 *   found by matching the entry's publish date (YYYY-MM-DD) to the `lastmod` dates in UserJot's public
 *   sitemap. A date shared by two entries is left out of the lookup so a link never points at the wrong entry,
 *   and an entry with no match falls back to the updates list page.
 * - `videoId` is a YouTube video id or null, resolved as described below.
 *
 * How a refresh works: UserJot's changelogs API (bearer token, 30 published entries), UserJot's sitemap and
 * the changelog YouTube playlist's RSS feed are fetched in parallel. Entries scheduled for the future are
 * dropped and the rest are sorted newest first. A failing sitemap or feed only loses links or videos, while a
 * failing UserJot call fails the whole refresh.
 *
 * How videos are matched: UserJot's API does not return an entry's embedded video, so the videos come from the
 * public "Changelogs" playlist (`CHANGELOG_PLAYLIST_ID`, RSS feed at
 * `youtube.com/feeds/videos.xml?playlist_id=<id>`, no API key, latest 15 videos). Every entry is compared with
 * every video and the pairs published within 24 hours of each other are kept. They are assigned from the
 * smallest time gap upward, skipping an entry or video that is already paired, so each video goes to at most
 * one entry. The team publishes the video and the entry on the same day, so gaps are normally under a few
 * hours. The video for an entry is then the first of: an override in `CHANGELOG_VIDEO_OVERRIDES` (for a wrong
 * pairing or a video outside the playlist), the playlist pair, a YouTube link written in the entry text, or
 * null. Entries older than the playlist's latest 15 videos, or more than 24 hours from any video, get no video.
 *
 * Caching: isolate memory (L1) and Cloudflare KV (L2, key `KV_KEY`) both hold the result for 3 hours, and
 * simultaneous callers share one in-flight refresh. The key carries a version suffix, so change it whenever the
 * shape of an entry changes. A new entry or video therefore shows up within about 3 hours, or sooner if the KV key is deleted.
 * An entry cached before its video was uploaded keeps showing no video until the next refresh.
 *
 * Who calls it: `routes/changelog/+page.server.ts` for the changelog page and `routes/api/changelog/+server.ts`
 * (`?limit=1..30`) for the home page section and for the dashboard. The dashboard never calls this endpoint from
 * the browser: its server route `/api/whats-new` fetches `/api/changelog?limit=5` (localhost:5174 in dev,
 * classroomio.com in production) and returns the entries to the sidebar card, which the browser may reuse for 5
 * minutes. The sidebar card shows the newest entry the user has not opened (opened ids are kept in localStorage)
 * and its modal embeds `youtube-nocookie.com/embed/<videoId>` when `videoId` is set, or the cover image when not.
 * If the website is unreachable the dashboard route returns an empty list and the card hides itself.
 *
 * @param apiKey UserJot API token (`USERJOT_API_KEY`); without it the result is always empty.
 * @param kv Cloudflare KV namespace for the shared cache; omit it to cache in memory only.
 */
export async function getChangelog(
  apiKey: string | undefined,
  kv?: ChangelogKvNamespace | null
): Promise<ChangelogEntry[]> {
  if (!apiKey) {
    return [];
  }

  const now = Date.now();

  if (isFresh(memoryCache, now)) {
    return memoryCache.entries;
  }

  inFlightFetch ??= resolveChangelog(apiKey, kv, now).finally(() => {
    inFlightFetch = null;
  });

  return inFlightFetch;
}
