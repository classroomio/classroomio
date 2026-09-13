import { describe, expect, it } from 'vitest';
import { formatCompactCount } from '../src/functions/number';

describe('formatCompactCount', () => {
  it('keeps values under 1000 exact', () => {
    expect(formatCompactCount(0)).toBe('0');
    expect(formatCompactCount(1)).toBe('1');
    expect(formatCompactCount(999)).toBe('999');
  });

  it('formats thousands with a lowercase k', () => {
    expect(formatCompactCount(1000)).toBe('1k');
    expect(formatCompactCount(1500)).toBe('1.5k');
    expect(formatCompactCount(12000)).toBe('12k');
  });

  it('formats millions and billions', () => {
    expect(formatCompactCount(1_000_000)).toBe('1m');
    expect(formatCompactCount(2_500_000)).toBe('2.5m');
    expect(formatCompactCount(1_000_000_000)).toBe('1b');
  });
});
