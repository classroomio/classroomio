import { describe, expect, it } from 'vitest';

import type { CorpusPage, ExclusionReason } from '../corpus/types';
import { usefulnessGate } from './gate';

function page(words: number, excluded: ExclusionReason | null = null, referenceOnly = false): CorpusPage {
  return {
    pageId: `page-${words}-${excluded ?? 'live'}-${referenceOnly}`,
    url: 'https://acme.com/docs/dashboards',
    title: 'Dashboards',
    path: [],
    order: 0,
    contentHash: 'hash',
    blocks: [],
    wordCount: words,
    excluded,
    referenceOnly
  };
}

describe('usefulness gate', () => {
  it('passes on a corpus with enough teachable pages and words', () => {
    const result = usefulnessGate([page(600), page(600), page(600)], ['read']);

    expect(result).toEqual({ passed: true, teachablePages: 3, words: 1800, reason: 'enough-material' });
  });

  it('counts only pages that may be taught', () => {
    const result = usefulnessGate(
      [page(600), page(600), page(600), page(9000, 'duplicate'), page(9000, 'release-notes', true)],
      ['read']
    );

    expect(result.teachablePages).toBe(3);
    expect(result.words).toBe(1800);
  });

  it('stops a site with too few pages or too few words', () => {
    expect(usefulnessGate([page(600), page(600)], ['read'])).toMatchObject({
      passed: false,
      reason: 'too-few-pages'
    });
    expect(usefulnessGate([page(100), page(100), page(100)], ['read'])).toMatchObject({
      passed: false,
      reason: 'too-few-words'
    });
  });

  it('names a blocked or login-only site as the reason nothing was built', () => {
    expect(usefulnessGate([], ['blocked', 'blocked'])).toMatchObject({ passed: false, reason: 'all-sources-blocked' });
    expect(usefulnessGate([], ['needs-login'])).toMatchObject({ passed: false, reason: 'login-only' });
  });

  it('takes thresholds from the caller so they can be tuned on development sites', () => {
    const pages = [page(50), page(50)];

    expect(usefulnessGate(pages, ['read'], { minPages: 2, minWords: 100 }).passed).toBe(true);
  });
});
