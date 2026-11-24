import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { FetchResponse, Fetcher } from '@cio/course-builder';

const uploads = vi.hoisted(() => [] as Array<{ key: string; contentType: string; bytes: number }>);

vi.mock('../../config/storage', () => ({ getStorageConfig: () => ({ mediaPublicBaseUrl: null }) }));

vi.mock('../../utils/storage', () => ({
  mediaBucket: () => 'media',
  uploadBufferToBucket: vi.fn(async (_bucket: string, key: string, buffer: Buffer, contentType: string) => {
    uploads.push({ key, contentType, bytes: buffer.length });
  })
}));

import { createImageCapturer } from './capture-image';

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32)]);

function fetcherAnswering(answer: Partial<FetchResponse>): Fetcher {
  return {
    get: async (url) => ({ url, status: 200, headers: {}, body: '', redirects: [], truncated: false, ...answer })
  };
}

beforeEach(() => {
  uploads.length = 0;
});

describe('createImageCapturer', () => {
  it('stores a raster image under the organisation and returns its public URL', async () => {
    const capture = createImageCapturer(
      fetcherAnswering({ headers: { 'content-type': 'image/png' }, bytes: PNG }),
      'https://media.example.com/'
    );

    const url = await capture('https://help.acme.com/shot.png', 'org-1');

    expect(url).toMatch(/^https:\/\/media\.example\.com\/course-build\/org-1\/[0-9a-f]{40}\.png$/);
    expect(uploads).toEqual([
      { key: url!.replace('https://media.example.com/', ''), contentType: 'image/png', bytes: PNG.length }
    ]);
  });

  it.each([
    ['an SVG', { headers: { 'content-type': 'image/svg+xml' }, bytes: Buffer.from('<svg onload="x()"/>') }],
    ['HTML labelled as an image', { headers: { 'content-type': 'image/png' }, bytes: Buffer.from('<html></html>') }],
    ['a truncated image', { headers: { 'content-type': 'image/png' }, bytes: PNG, truncated: true }],
    ['a missing image', { status: 404, headers: { 'content-type': 'image/png' }, bytes: PNG }]
  ])('stores nothing for %s', async (_label, answer) => {
    const capture = createImageCapturer(fetcherAnswering(answer), 'https://media.example.com');

    expect(await capture('https://help.acme.com/x', 'org-1')).toBeNull();
    expect(uploads).toHaveLength(0);
  });
});
