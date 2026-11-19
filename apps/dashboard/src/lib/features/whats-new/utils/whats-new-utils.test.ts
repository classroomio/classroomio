import { describe, expect, it } from 'vitest';

import { addSeenId, getUnseenEntries, parseSeenIds } from './whats-new-utils';
import type { WhatsNewEntry } from './types';

const entry = (id: string): WhatsNewEntry => ({
  id,
  title: id,
  summary: null,
  url: 'https://example.com',
  videoId: null,
  coverUrl: null,
  publishedAt: '2026-10-05T10:00:00.000Z',
  tags: []
});

describe('getUnseenEntries', () => {
  const entries = [entry('c'), entry('b'), entry('a')];

  it('returns every entry, newest first, when nothing has been opened', () => {
    expect(getUnseenEntries(entries, []).map((item) => item.id)).toEqual(['c', 'b', 'a']);
  });

  it('moves on to the next entry once one is opened', () => {
    expect(getUnseenEntries(entries, ['c']).map((item) => item.id)).toEqual(['b', 'a']);
  });

  it('is empty once every entry has been opened', () => {
    expect(getUnseenEntries(entries, ['a', 'b', 'c'])).toEqual([]);
  });

  it('puts a newly published entry at the top', () => {
    const withNew = [entry('d'), ...entries];

    expect(getUnseenEntries(withNew, ['a', 'b', 'c']).map((item) => item.id)).toEqual(['d']);
  });
});

describe('parseSeenIds', () => {
  it('reads a stored list of ids', () => {
    expect(parseSeenIds('["a","b"]')).toEqual(['a', 'b']);
  });

  it('ignores missing, malformed or wrongly shaped values', () => {
    expect(parseSeenIds(null)).toEqual([]);
    expect(parseSeenIds('not json')).toEqual([]);
    expect(parseSeenIds('{"a":1}')).toEqual([]);
    expect(parseSeenIds('["a",1,null]')).toEqual(['a']);
  });
});

describe('addSeenId', () => {
  it('appends a new id and ignores a repeat', () => {
    expect(addSeenId(['a'], 'b')).toEqual(['a', 'b']);
    expect(addSeenId(['a', 'b'], 'a')).toEqual(['a', 'b']);
  });

  it('keeps only the most recent ids', () => {
    const many = Array.from({ length: 50 }, (_, index) => `id-${index}`);
    const next = addSeenId(many, 'latest');

    expect(next).toHaveLength(50);
    expect(next[49]).toBe('latest');
    expect(next).not.toContain('id-0');
  });
});
