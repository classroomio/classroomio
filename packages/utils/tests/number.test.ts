import { describe, expect, it } from 'vitest';
import {
  formatCompactCount,
  parseBoundedInteger,
  parseBoundedNumber,
  parseNumberInRange
} from '../src/functions/number';

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

  it('supports bounds with only min and no upper cap', () => {
    expect(parseBoundedInteger('5000000', { min: 0 })).toBe(5_000_000);
    expect(parseBoundedInteger('-5', { min: 0 })).toBe(0);
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

describe('parseBoundedNumber', () => {
  it('preserves decimal fractions without integer rounding', () => {
    expect(parseBoundedNumber('12.5', { min: 0, max: 100 })).toBe(12.5);
    expect(parseBoundedNumber('33.33', { min: 0, max: 100 })).toBe(33.33);
  });

  it('clamps values below min and above max', () => {
    expect(parseBoundedNumber('-5.5', { min: 0, max: 100 })).toBe(0);
    expect(parseBoundedNumber('120.75', { min: 0, max: 100 })).toBe(100);
  });

  it('returns undefined for empty or invalid strings', () => {
    expect(parseBoundedNumber('', { min: 0, max: 100 })).toBeUndefined();
    expect(parseBoundedNumber('   ', { min: 0, max: 100 })).toBeUndefined();
    expect(parseBoundedNumber('abc', { min: 0, max: 100 })).toBeUndefined();
  });
});

describe('parseNumberInRange', () => {
  it('returns undefined for empty, whitespace, or invalid input', () => {
    expect(parseNumberInRange('')).toBeUndefined();
    expect(parseNumberInRange('   ')).toBeUndefined();
    expect(parseNumberInRange('abc')).toBeUndefined();
  });

  it('parses valid numbers within bounds', () => {
    expect(parseNumberInRange('50', { min: 0, max: 100 })).toBe(50);
  });

  it('returns undefined for out-of-range numbers', () => {
    expect(parseNumberInRange('150', { min: 0, max: 100 })).toBeUndefined();
    expect(parseNumberInRange('-1', { min: 0 })).toBeUndefined();
  });

  it('enforces integer mode', () => {
    expect(parseNumberInRange('2.5', { integer: true })).toBeUndefined();
    expect(parseNumberInRange('2.5')).toBe(2.5);
  });

  it('supports min-only and max-only bounds', () => {
    expect(parseNumberInRange('5000000', { min: 0 })).toBe(5_000_000);
    expect(parseNumberInRange('50', { max: 100 })).toBe(50);
    expect(parseNumberInRange('150', { max: 100 })).toBeUndefined();
  });

  it('parses scientific notation', () => {
    expect(parseNumberInRange('1e3')).toBe(1000);
  });
});
