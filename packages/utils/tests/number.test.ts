import { describe, expect, it } from 'vitest';
import { formatCompactCount, parseBoundedInteger } from '../src/functions/number';

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

describe('parseBoundedInteger', () => {
  it('parses valid integer strings within bounds', () => {
    expect(parseBoundedInteger('50', { min: 0, max: 100 })).toBe(50);
    expect(parseBoundedInteger('0', { min: 0, max: 100 })).toBe(0);
    expect(parseBoundedInteger('100', { min: 0, max: 100 })).toBe(100);
  });

  it('clamps values below min and above max', () => {
    expect(parseBoundedInteger('-10', { min: 0, max: 100 })).toBe(0);
    expect(parseBoundedInteger('150', { min: 0, max: 100 })).toBe(100);
  });

  it('rounds decimal strings to nearest integer', () => {
    expect(parseBoundedInteger('85.4', { min: 0, max: 100 })).toBe(85);
    expect(parseBoundedInteger('85.6', { min: 0, max: 100 })).toBe(86);
  });

  it('returns undefined for empty strings, whitespace, or invalid numbers', () => {
    expect(parseBoundedInteger('', { min: 0, max: 100 })).toBeUndefined();
    expect(parseBoundedInteger('   ', { min: 0, max: 100 })).toBeUndefined();
    expect(parseBoundedInteger('abc', { min: 0, max: 100 })).toBeUndefined();
  });
});
