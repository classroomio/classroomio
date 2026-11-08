import { describe, expect, it } from 'vitest';

import {
  BLOCK_DEFINITIONS,
  BLOCK_TYPES,
  ZBlockCreate,
  getBlockAssetId,
  parseBlockData,
  toPublicBlockData
} from '../src/validation/block';

const ASSET_ID = '7f3c6c2e-3a7b-4d5e-9f10-1a2b3c4d5e6f';

describe('block registry', () => {
  it('keys every definition by its own type', () => {
    for (const [key, definition] of Object.entries(BLOCK_DEFINITIONS)) {
      expect(definition.key).toBe(key);
    }
  });

  it('accepts a create payload for every registered type', () => {
    const samples = {
      note: { type: 'note', data: { style: 'tip' }, content: '<p>Hi</p>' },
      video: { type: 'video', data: { type: 'youtube', link: 'https://youtu.be/abc' } },
      slides: {
        type: 'slides',
        data: { src: 'https://www.canva.com/design/DAH/abc/view?embed', platform: 'canva' }
      },
      document: { type: 'document', data: { type: 'pdf', name: 'a.pdf', link: '/a.pdf', key: 'a' } },
      image: { type: 'image', data: { url: 'https://example.com/a.png', fit: 'contain' } }
    };

    expect(Object.keys(samples).sort()).toEqual([...BLOCK_TYPES].sort());

    for (const sample of Object.values(samples)) {
      expect(ZBlockCreate.safeParse(sample).success).toBe(true);
    }
  });

  it('persists the note style and rejects unknown note fields', () => {
    expect(parseBlockData('note', { style: 'warning' })).toEqual({ style: 'warning' });
    expect(parseBlockData('note', { style: 'loud' })).toBeNull();
    expect(parseBlockData('note', { color: 'red' })).toBeNull();
  });

  it('reads asset ids only from media types', () => {
    expect(getBlockAssetId('video', { assetId: ASSET_ID })).toBe(ASSET_ID);
    expect(getBlockAssetId('document', { assetId: ASSET_ID })).toBe(ASSET_ID);
    expect(getBlockAssetId('image', { assetId: ASSET_ID })).toBeNull();
    expect(getBlockAssetId('unknown', { assetId: ASSET_ID })).toBeNull();
  });

  it('keeps documents off public pages and strips video metadata', () => {
    expect(toPublicBlockData('document', { type: 'pdf', name: 'a.pdf', link: '/a.pdf', key: 'a' })).toBeNull();
    expect(
      toPublicBlockData('video', {
        type: 'youtube',
        link: 'https://youtu.be/abc',
        metadata: { thumbnailUrl: 'https://img/a.jpg', internal: 'secret' }
      })
    ).toEqual({
      type: 'youtube',
      link: 'https://youtu.be/abc',
      assetId: undefined,
      metadata: { thumbnailUrl: 'https://img/a.jpg' }
    });
  });
});
