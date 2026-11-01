import { describe, expect, it } from 'vitest';

import { parseHlsVariants, pickOfflineVariant, singleVariantMaster } from '../offline-video';

const MASTER = [
  '#EXTM3U',
  '#EXT-X-VERSION:3',
  '#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="aud",NAME="audio",DEFAULT=YES,URI="audio/playlist.m3u8"',
  '#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="other",NAME="dub",URI="dub/playlist.m3u8"',
  '#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720,CODECS="avc1.640028,mp4a.40.2",AUDIO="aud"',
  'p720/playlist.m3u8',
  '#EXT-X-STREAM-INF:BANDWIDTH=900000,AVERAGE-BANDWIDTH=800000,RESOLUTION=640x360,CODECS="avc1.4d401e,mp4a.40.2",AUDIO="aud"',
  'p360/playlist.m3u8',
  '#EXT-X-STREAM-INF:BANDWIDTH=140000,CODECS="mp4a.40.2",AUDIO="aud"',
  'audio/playlist.m3u8',
  '#EXT-X-STREAM-INF:BANDWIDTH=100000,RESOLUTION=320x180',
  'https://cdn.example.com/p180/playlist.m3u8'
].join('\n');

describe('offline video playlists', () => {
  it('reads relative variants and skips absolute ones', () => {
    const variants = parseHlsVariants(MASTER);

    expect(variants.map((variant) => [variant.rendition, variant.isVideo, variant.bandwidth, variant.height])).toEqual([
      ['p720', true, 2500000, 720],
      ['p360', true, 800000, 360],
      ['audio', false, 140000, null]
    ]);
  });

  it('picks the lightest video variant unless a rendition is named', () => {
    const variants = parseHlsVariants(MASTER);

    expect(pickOfflineVariant(variants)?.rendition).toBe('p360');
    expect(pickOfflineVariant(variants, 'p720')?.rendition).toBe('p720');
    expect(pickOfflineVariant(variants, 'audio')).toBeNull();
    expect(pickOfflineVariant(variants, 'p1080')).toBeNull();
  });

  it('keeps one variant and only the audio group it uses', () => {
    const variant = pickOfflineVariant(parseHlsVariants(MASTER))!;
    const master = singleVariantMaster(MASTER, variant);

    expect(master).toContain('URI="audio/playlist.m3u8"');
    expect(master).not.toContain('dub/playlist.m3u8');
    expect(master).not.toContain('p720/playlist.m3u8');
    expect(master.trim().split('\n').slice(-2)).toEqual([variant.streamInfLine, 'p360/playlist.m3u8']);
  });
});
