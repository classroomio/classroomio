import { describe, expect, it } from 'vitest';
import { contentWriteBumpsTimestamp, stampContentUpdatedAt } from '@cio/db/queries/course/content-timestamp';

describe('contentWriteBumpsTimestamp', () => {
  it('ignores order-only writes', () => {
    expect(contentWriteBumpsTimestamp(['order'])).toBe(false);
  });

  it('ignores section moves', () => {
    expect(contentWriteBumpsTimestamp(['sectionId'])).toBe(false);
    expect(contentWriteBumpsTimestamp(['order', 'sectionId'])).toBe(false);
  });

  it('bumps when a content field is included', () => {
    expect(contentWriteBumpsTimestamp(['isUnlocked'])).toBe(true);
    expect(contentWriteBumpsTimestamp(['order', 'isUnlocked'])).toBe(true);
  });
});

describe('stampContentUpdatedAt', () => {
  it('sets updatedAt on question and option writes', () => {
    const stamped = stampContentUpdatedAt({ title: 'Renamed' }, '2026-09-26T00:00:00.000Z');

    expect(stamped).toEqual({ title: 'Renamed', updatedAt: '2026-09-26T00:00:00.000Z' });
  });

  it('replaces a caller-supplied updatedAt', () => {
    const stamped = stampContentUpdatedAt({ updatedAt: '2020-01-01T00:00:00.000Z' }, '2026-09-26T00:00:00.000Z');

    expect(stamped.updatedAt).toBe('2026-09-26T00:00:00.000Z');
  });
});
