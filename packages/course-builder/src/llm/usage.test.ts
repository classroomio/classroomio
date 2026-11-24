import { describe, expect, it } from 'vitest';

import { resolveRoleModels } from './models';
import { UsageLedger, costOfUsage } from './usage';

const empty = { inputTokens: 0, cacheWrite5mTokens: 0, cacheWrite1hTokens: 0, cacheReadTokens: 0, outputTokens: 0 };

describe('costOfUsage', () => {
  it('prices each token kind at the model list price', () => {
    const cost = costOfUsage('claude-sonnet-5-5', {
      ...empty,
      inputTokens: 1_000_000,
      cacheReadTokens: 1_000_000,
      cacheWrite5mTokens: 1_000_000,
      outputTokens: 1_000_000
    });

    expect(cost).toBeCloseTo(2 + 0.1 + 2.5 + 10);
  });

  it('applies Haiku long-prompt prices to every token once the prompt passes 100k tokens', () => {
    const short = costOfUsage('claude-haiku-5-5', { ...empty, inputTokens: 100_000, outputTokens: 1_000 });
    const long = costOfUsage('claude-haiku-5-5', {
      ...empty,
      inputTokens: 60_000,
      cacheReadTokens: 40_001,
      outputTokens: 1_000
    });

    expect(short).toBeCloseTo((100_000 * 0.1 + 1_000 * 0.5) / 1_000_000);
    expect(long).toBeCloseTo((60_000 * 0.5 + 40_001 * 0.05 + 1_000 * 2.5) / 1_000_000);
  });

  it('treats an unknown model as free instead of failing', () => {
    expect(costOfUsage('some-other-model', { ...empty, inputTokens: 5_000 })).toBe(0);
  });
});

describe('UsageLedger', () => {
  it('sums cost and tokens by role', () => {
    const ledger = new UsageLedger();
    ledger.add('writer', 'claude-sonnet-5-5', { ...empty, inputTokens: 1_000, outputTokens: 500 }, 10);
    ledger.add('writer', 'claude-sonnet-5-5', { ...empty, cacheReadTokens: 1_000, outputTokens: 500 }, 10);

    const writer = ledger.byRole().writer;
    expect(writer.calls).toBe(2);
    expect(writer.inputTokens).toBe(2_000);
    expect(ledger.totalCostUsd).toBeCloseTo((1_000 * 2 + 1_000 * 0.1 + 1_000 * 10) / 1_000_000);
  });
});

describe('resolveRoleModels', () => {
  it('keeps defaults and applies partial overrides', () => {
    const models = resolveRoleModels({ writer: { model: 'claude-opus-5-5' } });

    expect(models.writer).toEqual({ model: 'claude-opus-5-5', effort: 'high' });
    expect(models.planner.model).toBe('claude-opus-5-5');
  });
});
