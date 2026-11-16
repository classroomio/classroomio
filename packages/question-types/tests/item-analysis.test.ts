import { describe, expect, it } from 'vitest';

import { assignDiscriminationGroups, computeDiscrimination, computeFacility } from '../src/item-analysis';

describe('computeFacility', () => {
  it('is null without responses', () => {
    expect(computeFacility([])).toBeNull();
  });

  it('is the share of full-credit responses', () => {
    expect(computeFacility([{ ratio: 1 }, { ratio: 1 }, { ratio: 0.5 }, { ratio: 0 }])).toBe(50);
    expect(computeFacility([{ ratio: 1 }, { ratio: 0 }, { ratio: 0 }])).toBe(33.3);
  });
});

describe('assignDiscriminationGroups', () => {
  it('puts the top and bottom 27% into groups', () => {
    const totals = Array.from({ length: 100 }, (_, index) => index + 1);
    const groups = assignDiscriminationGroups(totals);

    expect(groups.filter((group) => group === 'upper')).toHaveLength(27);
    expect(groups.filter((group) => group === 'lower')).toHaveLength(27);
    expect(groups[99]).toBe('upper');
    expect(groups[0]).toBe('lower');
    expect(groups[50]).toBeNull();
  });

  it('leaves everyone out when all totals tie', () => {
    expect(assignDiscriminationGroups([5, 5, 5, 5])).toEqual([null, null, null, null]);
  });
});

describe('computeDiscrimination', () => {
  it('is positive when strong students answer correctly and weak ones do not', () => {
    const responses = Array.from({ length: 10 }, (_, index) => ({
      totalRatio: (index + 1) / 10,
      ratio: index >= 5 ? 1 : 0
    }));

    expect(computeDiscrimination(responses)).toBe(1);
  });

  it('is negative when weak students beat strong ones', () => {
    const responses = Array.from({ length: 10 }, (_, index) => ({
      totalRatio: (index + 1) / 10,
      ratio: index >= 5 ? 0 : 1
    }));

    expect(computeDiscrimination(responses)).toBe(-1);
  });

  it('is null for a group of one student, where no group forms', () => {
    expect(computeDiscrimination([{ totalRatio: 0.5, ratio: 1 }])).toBeNull();
  });
});
