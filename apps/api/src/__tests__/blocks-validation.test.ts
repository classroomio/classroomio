import { describe, expect, it } from 'vitest';

import { ZBlockCreate, ZBlockUpdate, ZPlacementMove, parseBlockData } from '@cio/utils/validation/block';
import { positionForAnchor } from '@cio/core/services/block/positions';

describe('block data schemas', () => {
  it('accepts an uploaded video without a link because it is signed on read', () => {
    expect(
      parseBlockData('video', { type: 'upload', link: '', key: 'org/a.mp4', assetId: crypto.randomUUID() })
    ).not.toBe(null);
  });

  it('rejects an external video with a script link', () => {
    expect(parseBlockData('video', { type: 'youtube', link: 'javascript:alert(1)' })).toBeNull();
  });

  it('rejects slides whose platform does not match the embed host', () => {
    expect(
      parseBlockData('slides', { src: 'https://docs.google.com/presentation/d/e/abc/embed', platform: 'canva' })
    ).toBeNull();
  });

  it('keeps note data empty because the body lives in the locale row', () => {
    expect(parseBlockData('note', {})).toEqual({});
    expect(parseBlockData('note', { content: '<p>x</p>' })).toBeNull();
  });
});

describe('block request schemas', () => {
  it('requires a single anchor on create', () => {
    const anchor = crypto.randomUUID();
    const base = { type: 'note', data: {} } as const;

    expect(ZBlockCreate.safeParse(base).success).toBe(true);
    expect(ZBlockCreate.safeParse({ ...base, afterPlacementId: anchor }).success).toBe(true);
    expect(ZBlockCreate.safeParse({ ...base, afterPlacementId: anchor, beforePlacementId: anchor }).success).toBe(
      false
    );
  });

  it('rejects an unknown block type', () => {
    expect(ZBlockCreate.safeParse({ type: 'flashcards', data: {} }).success).toBe(false);
  });

  it('needs an expected version to update a block', () => {
    expect(ZBlockUpdate.safeParse({ data: {} }).success).toBe(false);
    expect(ZBlockUpdate.safeParse({ data: {}, expectedVersion: 1 }).success).toBe(true);
  });

  it('needs an anchor to move a placement', () => {
    expect(ZPlacementMove.safeParse({}).success).toBe(false);
    expect(ZPlacementMove.safeParse({ beforePlacementId: crypto.randomUUID() }).success).toBe(true);
  });
});

describe('positionForAnchor', () => {
  const ordered = [
    { id: 'a', position: 'a0' },
    { id: 'b', position: 'a1' },
    { id: 'c', position: 'a2' }
  ];

  it('appends after the last placement without an anchor', () => {
    expect(positionForAnchor(ordered, {}) > 'a2').toBe(true);
    expect(positionForAnchor([], {})).toBeTruthy();
  });

  it('sorts between the anchor and its neighbour', () => {
    const after = positionForAnchor(ordered, { afterPlacementId: 'a' });
    const before = positionForAnchor(ordered, { beforePlacementId: 'c' });

    expect(after > 'a0' && after < 'a1').toBe(true);
    expect(before > 'a1' && before < 'a2').toBe(true);
  });

  it('sorts before the first placement', () => {
    expect(positionForAnchor(ordered, { beforePlacementId: 'a' }) < 'a0').toBe(true);
  });

  it('fails for an anchor outside the lesson', () => {
    expect(() => positionForAnchor(ordered, { afterPlacementId: 'zzz' })).toThrowError(
      expect.objectContaining({ statusCode: 404 })
    );
  });
});
