import { describe, expect, it } from 'vitest';

import { scoreCoverage, type GoldCourse } from './coverage';

const gold: GoldCourse = {
  title: 'Gold',
  sections: [1, 2, 3, 4].map((number) => ({ number, title: `Section ${number}`, lessons: [] }))
};

function verdict(goldNumber: number, value: 'covered' | 'partial' | 'missing' | 'unknown') {
  return { goldNumber, verdict: value, matchedCandidateSections: [], reason: '' };
}

describe('scoreCoverage', () => {
  it('counts covered as 1 and partial as half', () => {
    const result = scoreCoverage(gold, {
      sections: [verdict(1, 'covered'), verdict(2, 'partial'), verdict(3, 'missing'), verdict(4, 'unknown')]
    });

    expect(result.score).toBeCloseTo(1.5 / 4);
    expect(result).toMatchObject({ covered: 1, partial: 1, missing: 1, unknown: 1 });
  });

  it('treats sections the judge skipped as missing and ignores duplicates', () => {
    const result = scoreCoverage(gold, { sections: [verdict(1, 'covered'), verdict(1, 'missing')] });

    expect(result).toMatchObject({ covered: 1, missing: 3 });
    expect(result.score).toBeCloseTo(0.25);
  });
});
