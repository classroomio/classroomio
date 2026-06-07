import { describe, expect, it } from 'vitest';
import { computePurchasedTokenOverflow } from '@cio/core/services/agent/usage';

describe('computePurchasedTokenOverflow', () => {
  it('returns 0 when usage stays within allowance', () => {
    expect(
      computePurchasedTokenOverflow({
        allowance: 1000,
        monthlyUsageBefore: 500,
        requestTokens: 400
      })
    ).toBe(0);
  });

  it('returns partial overflow when request crosses allowance boundary', () => {
    expect(
      computePurchasedTokenOverflow({
        allowance: 1000,
        monthlyUsageBefore: 900,
        requestTokens: 200
      })
    ).toBe(100);
  });

  it('charges entire request against credits when allowance already exhausted', () => {
    expect(
      computePurchasedTokenOverflow({
        allowance: 1000,
        monthlyUsageBefore: 1200,
        requestTokens: 50
      })
    ).toBe(50);
  });

  it('handles zero allowance', () => {
    expect(
      computePurchasedTokenOverflow({
        allowance: 0,
        monthlyUsageBefore: 0,
        requestTokens: 10
      })
    ).toBe(10);
  });
});

describe('leaderboard percentage split', () => {
  it('allocates shares that sum to 1', () => {
    const rows = [{ tokens: 30 }, { tokens: 70 }];
    const total = rows.reduce((sum, row) => sum + row.tokens, 0);
    const percentages = rows.map((row) => (total > 0 ? row.tokens / total : 0));

    expect(percentages).toEqual([0.3, 0.7]);
    expect(percentages.reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  });
});
