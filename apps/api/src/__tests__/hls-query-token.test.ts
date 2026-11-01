import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const ASSET_ID = '414807ff-909b-47a3-ad82-48233a501fc3';
const OTHER_ASSET_ID = '9d1c3f50-0b7a-4c55-9a8e-2f1f6b3c7d10';

const objects = new Map<string, string>([
  [
    `${ASSET_ID}/master.m3u8`,
    [
      '#EXTM3U',
      '#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="aud",NAME="English",URI="audio/index.m3u8"',
      '#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360,AUDIO="aud"',
      'p360/index.m3u8',
      '#EXT-X-STREAM-INF:BANDWIDTH=2400000,RESOLUTION=1280x720',
      'https://cdn.example.com/p720/index.m3u8'
    ].join('\n')
  ],
  [
    `${ASSET_ID}/p360/index.m3u8`,
    [
      '#EXTM3U',
      '#EXT-X-MAP:URI="init.mp4"',
      '#EXTINF:4.0,',
      'seg-0.m4s',
      '#EXTINF:4.0,',
      'seg-1.m4s?v=2',
      '#EXT-X-ENDLIST'
    ].join('\n')
  ],
  [`${ASSET_ID}/p360/seg-0.m4s`, 'segment-bytes']
]);

const mocks = vi.hoisted(() => ({
  getAssetById: vi.fn(),
  send: vi.fn()
}));

vi.mock('@cio/db/queries/assets', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();

  return { ...actual, getAssetById: mocks.getAssetById };
});

vi.mock('@cio/core/config/storage', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();

  return {
    ...actual,
    getStorageConfig: () => ({ bucketVideos: 'videos' }),
    getS3Client: () => ({ send: mocks.send })
  };
});

function bodyOf(text: string) {
  const bytes = new TextEncoder().encode(text);
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    }
  });

  return Object.assign(stream, { transformToString: async () => text });
}

import { Hono } from 'hono';
import { mintHlsToken } from '@cio/core/services/assets/assets';
import { appendTokenToPlaylist } from '@api/utils/hls-playlist';
import { hlsRouter } from '@api/routes/hls/hls';

const app = new Hono().route('/hls', hlsRouter);

beforeAll(() => {
  process.env.HLS_SIGNING_SECRET = 'test-secret';
});

beforeEach(() => {
  mocks.send.mockReset();
  mocks.send.mockImplementation(async (command: { input: { Key: string } }) => {
    const text = objects.get(command.input.Key);
    if (text === undefined) {
      throw Object.assign(new Error('missing'), { name: 'NoSuchKey' });
    }

    return { Body: bodyOf(text), ContentLength: text.length };
  });
});

describe('appendTokenToPlaylist', () => {
  it('adds the token to relative stream, segment and URI attribute references only', () => {
    const rewritten = appendTokenToPlaylist(objects.get(`${ASSET_ID}/master.m3u8`)!, 'a.b');

    expect(rewritten).toContain('URI="audio/index.m3u8?t=a.b"');
    expect(rewritten).toContain('\np360/index.m3u8?t=a.b\n');
    expect(rewritten).toContain('\nhttps://cdn.example.com/p720/index.m3u8');
    expect(rewritten).toContain('#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360,AUDIO="aud"');
  });

  it('appends to an existing query string', () => {
    const rewritten = appendTokenToPlaylist('#EXTINF:4.0,\nseg-1.m4s?v=2', 'tok');

    expect(rewritten).toBe('#EXTINF:4.0,\nseg-1.m4s?v=2&t=tok');
  });
});

describe('GET /hls/:assetId/* with a t query token', () => {
  it('serves the master playlist, a variant playlist and a segment with only the token', async () => {
    const { token } = await mintHlsToken(ASSET_ID, 600);
    const t = encodeURIComponent(token);

    const master = await app.request(`/hls/${ASSET_ID}/master.m3u8?t=${t}`);
    expect(master.status).toBe(200);
    const masterBody = await master.text();
    expect(masterBody).toContain(`p360/index.m3u8?t=${t}`);
    expect(master.headers.get('cache-control')).toBe('private, no-cache');

    const variantUri = masterBody.split('\n').find((line) => line.startsWith('p360/'))!;
    const variant = await app.request(`/hls/${ASSET_ID}/${variantUri}`);
    expect(variant.status).toBe(200);
    const variantBody = await variant.text();
    expect(variantBody).toContain(`URI="init.mp4?t=${t}"`);

    const segmentUri = variantBody.split('\n').find((line) => line.startsWith('seg-0'))!;
    const segment = await app.request(`/hls/${ASSET_ID}/p360/${segmentUri}`);
    expect(segment.status).toBe(200);
    expect(await segment.text()).toBe('segment-bytes');
  });

  it('rejects a token minted for another asset', async () => {
    const { token } = await mintHlsToken(OTHER_ASSET_ID, 600);

    const response = await app.request(`/hls/${ASSET_ID}/master.m3u8?t=${encodeURIComponent(token)}`);

    expect(response.status).toBe(403);
  });

  it('rejects a tampered token and a request with no credentials', async () => {
    const { token } = await mintHlsToken(ASSET_ID, 600);

    expect((await app.request(`/hls/${ASSET_ID}/master.m3u8?t=${encodeURIComponent(`${token}x`)}`)).status).toBe(403);
    expect((await app.request(`/hls/${ASSET_ID}/master.m3u8`)).status).toBe(403);
  });

  it('keeps the cookie path unchanged and does not rewrite cookie-authorized playlists', async () => {
    const { token, cookieName } = await mintHlsToken(ASSET_ID, 600);

    const response = await app.request(`/hls/${ASSET_ID}/master.m3u8`, {
      headers: { cookie: `${cookieName}=${token}` }
    });

    expect(response.status).toBe(200);
    expect(await response.text()).toBe(objects.get(`${ASSET_ID}/master.m3u8`));
  });
});
