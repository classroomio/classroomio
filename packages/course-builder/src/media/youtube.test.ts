import { describe, expect, it } from 'vitest';

import type { FetchResponse } from '../fetch/types';
import { channelIdOf, channelVideos, chapterTitles, matchVideo, type ChannelVideo } from './youtube';

function fetcherFor(routes: Record<string, string>) {
  const requested: string[] = [];

  return {
    requested,
    async get(url: string): Promise<FetchResponse> {
      requested.push(url);
      const body = routes[url];

      return {
        url,
        status: body === undefined ? 404 : 200,
        body: body ?? '',
        headers: {},
        redirects: [],
        truncated: false
      };
    }
  };
}

const CHANNEL = 'UCacme123';
const FEED = `<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/">
  <entry><yt:videoId>v1</yt:videoId><title>Add a meter in Acme</title><published>2026-01-01</published>
    <media:group><media:description>0:00 Intro
1:10 Add a meter</media:description></media:group></entry>
  <entry><yt:videoId>v2</yt:videoId><title>Private draft</title></entry>
</feed>`;

function video(id: string, title: string, description = ''): ChannelVideo {
  return { id, url: `https://www.youtube.com/watch?v=${id}`, title, description, publishedAt: null, fetchedAt: 'now' };
}

describe('channel videos', () => {
  it('finds the channel id of a handle from the channel page', async () => {
    const fetcher = fetcherFor({
      'https://www.youtube.com/@acme': `<link rel="canonical" href="https://www.youtube.com/channel/${CHANNEL}">`
    });

    expect(await channelIdOf(fetcher, 'https://www.youtube.com/@acme')).toBe(CHANNEL);
    expect(await channelIdOf(fetcher, `https://www.youtube.com/channel/${CHANNEL}`)).toBe(CHANNEL);
  });

  it('reads the feed without a key and keeps only videos oEmbed confirms', async () => {
    const oembed = (id: string) =>
      `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`;
    const fetcher = fetcherFor({
      [`https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL}`]: FEED,
      [oembed('v1')]: '{"title":"Add a meter in Acme"}'
    });

    const videos = await channelVideos(fetcher, `https://www.youtube.com/channel/${CHANNEL}`, { fetchedAt: 'now' });

    expect(videos.map((entry) => entry.id)).toEqual(['v1']);
    expect(videos[0].description).toContain('1:10 Add a meter');
  });

  it('uses the Data API with a key and drops private and non-embeddable videos', async () => {
    const fetcher = fetcherFor({
      [`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL}&key=k`]: JSON.stringify({
        items: [{ contentDetails: { relatedPlaylists: { uploads: 'UUacme' } } }]
      }),
      'https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=50&playlistId=UUacme&pageToken=&key=k':
        JSON.stringify({ items: ['a', 'b', 'c'].map((videoId) => ({ contentDetails: { videoId } })) }),
      'https://www.googleapis.com/youtube/v3/videos?part=snippet,status&id=a,b,c&key=k': JSON.stringify({
        items: [
          {
            id: 'a',
            snippet: { title: 'A', description: '', publishedAt: 'x' },
            status: { privacyStatus: 'public', embeddable: true }
          },
          {
            id: 'b',
            snippet: { title: 'B', description: '', publishedAt: 'x' },
            status: { privacyStatus: 'private', embeddable: true }
          },
          {
            id: 'c',
            snippet: { title: 'C', description: '', publishedAt: 'x' },
            status: { privacyStatus: 'public', embeddable: false }
          }
        ]
      })
    });

    const videos = await channelVideos(fetcher, `https://www.youtube.com/channel/${CHANNEL}`, {
      apiKey: 'k',
      fetchedAt: 'now'
    });

    expect(videos.map((entry) => entry.id)).toEqual(['a']);
  });

  it('matches a lesson to a video by its title or a chapter, and not on one shared word', () => {
    const videos = [
      video('v1', 'Acme product tour', '0:00 Welcome\n2:15 Add a meter to a building'),
      video('v2', 'Meter reading basics')
    ];

    expect(chapterTitles(videos[0].description)).toEqual(['Welcome', 'Add a meter to a building']);
    expect(matchVideo('Add a meter to a building', videos)?.video.id).toBe('v1');
    expect(matchVideo('Export a meter report', videos)).toBeNull();
  });
});
