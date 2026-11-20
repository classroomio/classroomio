import * as cheerio from 'cheerio';

import type { Fetcher } from '../fetch/types';

export interface ChannelVideo {
  id: string;
  url: string;
  title: string;
  description: string;
  publishedAt: string | null;
  /** When this was read; YouTube's terms ask for stored data to be refreshed within 30 days. */
  fetchedAt: string;
}

const API = 'https://www.googleapis.com/youtube/v3';
const MAX_VIDEOS = 500;
const API_PAGE = 50;

async function getJson<Data>(fetcher: Fetcher, url: string): Promise<Data | null> {
  const response = await fetcher.get(url, { accept: 'application/json' });
  if (response.status !== 200) return null;

  try {
    return JSON.parse(response.body) as Data;
  } catch {
    return null;
  }
}

/** The channel id (`UC…`) from a channel URL, reading the channel page when the URL names a handle or custom name. */
export async function channelIdOf(fetcher: Fetcher, channelUrl: string): Promise<string | null> {
  const direct = channelUrl.match(/youtube\.com\/channel\/(UC[\w-]+)/)?.[1];
  if (direct) return direct;

  const page = await fetcher.get(channelUrl);
  if (page.status !== 200) return null;

  const $ = cheerio.load(page.body);
  const canonical = $('link[rel="canonical"]').attr('href') ?? '';
  const fromMeta = $('meta[itemprop="channelId"], meta[itemprop="identifier"]').attr('content') ?? '';

  return canonical.match(/channel\/(UC[\w-]+)/)?.[1] ?? (fromMeta.startsWith('UC') ? fromMeta : null);
}

interface ApiList<Item> {
  items?: Item[];
  nextPageToken?: string;
}

async function apiVideos(
  fetcher: Fetcher,
  apiKey: string,
  channelId: string,
  fetchedAt: string
): Promise<ChannelVideo[]> {
  const key = encodeURIComponent(apiKey);
  const channels = await getJson<ApiList<{ contentDetails?: { relatedPlaylists?: { uploads?: string } } }>>(
    fetcher,
    `${API}/channels?part=contentDetails&id=${channelId}&key=${key}`
  );
  const uploads = channels?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) return [];

  const ids: string[] = [];
  let pageToken = '';
  do {
    const page = await getJson<ApiList<{ contentDetails: { videoId: string } }>>(
      fetcher,
      `${API}/playlistItems?part=contentDetails&maxResults=${API_PAGE}&playlistId=${uploads}&pageToken=${pageToken}&key=${key}`
    );
    ids.push(...(page?.items ?? []).map((item) => item.contentDetails.videoId));
    pageToken = page?.nextPageToken ?? '';
  } while (pageToken && ids.length < MAX_VIDEOS);

  const videos: ChannelVideo[] = [];
  for (let start = 0; start < ids.length; start += API_PAGE) {
    const details = await getJson<
      ApiList<{
        id: string;
        snippet: { title: string; description: string; publishedAt: string };
        status: { privacyStatus: string; embeddable: boolean };
      }>
    >(fetcher, `${API}/videos?part=snippet,status&id=${ids.slice(start, start + API_PAGE).join(',')}&key=${key}`);
    for (const item of details?.items ?? []) {
      if (item.status.privacyStatus !== 'public' || !item.status.embeddable) continue;

      videos.push({
        id: item.id,
        url: `https://www.youtube.com/watch?v=${item.id}`,
        title: item.snippet.title,
        description: item.snippet.description,
        publishedAt: item.snippet.publishedAt,
        fetchedAt
      });
    }
  }

  return videos;
}

async function feedVideos(fetcher: Fetcher, channelId: string, fetchedAt: string): Promise<ChannelVideo[]> {
  const feed = await fetcher.get(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
    accept: 'application/atom+xml'
  });
  if (feed.status !== 200) return [];

  const $ = cheerio.load(feed.body, { xml: true });
  const entries = $('entry')
    .toArray()
    .map((entry) => ({
      id: $(entry).find('yt\\:videoId').text().trim(),
      title: $(entry).find('title').first().text().trim(),
      description: $(entry).find('media\\:description').text().trim(),
      publishedAt: $(entry).find('published').text().trim() || null
    }))
    .filter((entry) => entry.id && entry.title);

  const videos: ChannelVideo[] = [];
  for (const entry of entries) {
    const url = `https://www.youtube.com/watch?v=${entry.id}`;
    const embeddable = await fetcher.get(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, {
      accept: 'application/json'
    });
    if (embeddable.status === 200) videos.push({ ...entry, url, fetchedAt });
  }

  return videos;
}

/**
 * The public, embeddable videos of an organisation's own channel: through the YouTube Data API when there is a key,
 * else the channel feed (its latest 15) with each video confirmed embeddable through oEmbed.
 */
export async function channelVideos(
  fetcher: Fetcher,
  channelUrl: string,
  options: { apiKey?: string; fetchedAt: string }
): Promise<ChannelVideo[]> {
  const channelId = await channelIdOf(fetcher, channelUrl);
  if (!channelId) return [];

  if (options.apiKey) {
    const videos = await apiVideos(fetcher, options.apiKey, channelId, options.fetchedAt).catch(() => null);
    if (videos) return videos;
  }

  return feedVideos(fetcher, channelId, options.fetchedAt);
}

const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'your',
  'you',
  'how',
  'what',
  'from',
  'into',
  'about',
  'this',
  'that',
  'use',
  'using'
]);

function words(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

/** Chapter titles from a description's `mm:ss Title` lines. */
export function chapterTitles(description: string): string[] {
  return description
    .split('\n')
    .map((line) => line.match(/^\s*(?:\d{1,2}:)?\d{1,2}:\d{2}\s*[-–—]?\s*(.+)$/)?.[1]?.trim())
    .filter((title): title is string => !!title);
}

export interface VideoMatch {
  video: ChannelVideo;
  /** Share of the lesson title's words the video's title or chapters contain. */
  score: number;
}

export const MIN_VIDEO_MATCH = 0.75;

/**
 * The channel video that best fits a lesson: most of the lesson title's words (at least two) appear in the video's
 * title or one chapter. The checker confirms a match before it is used.
 */
export function matchVideo(lessonTitle: string, videos: ChannelVideo[]): VideoMatch | null {
  const wanted = [...new Set(words(lessonTitle))];
  if (wanted.length < 2) return null;

  let best: VideoMatch | null = null;
  for (const video of videos) {
    const candidates = [video.title, ...chapterTitles(video.description)].map((text) => new Set(words(text)));
    const found = Math.max(...candidates.map((candidate) => wanted.filter((word) => candidate.has(word)).length));
    const score = found / wanted.length;
    if (found >= 2 && score >= MIN_VIDEO_MATCH && (!best || score > best.score)) best = { video, score };
  }

  return best;
}
