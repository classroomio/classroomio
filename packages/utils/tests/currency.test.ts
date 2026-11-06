import { describe, expect, it } from 'vitest';
import { ZCourseUpdate } from '../src/validation/course/course';
import { getCurrencyFormatter } from '../src/functions/currency';

describe('getCurrencyFormatter', () => {
  it('formats BRL as Brazilian real', () => {
    const out = getCurrencyFormatter('BRL').format(1234.5);
    expect(out).toContain('R$');
    expect(out).toContain('1.234,50');
  });

  it('keeps USD and NGN output', () => {
    expect(getCurrencyFormatter('USD').format(10)).toBe('$10.00');
    expect(getCurrencyFormatter('NGN').format(10)).toBe('₦10.00');
  });

  it('falls back to USD for unknown or missing currencies', () => {
    expect(getCurrencyFormatter('EUR').format(10)).toBe('$10.00');
    expect(getCurrencyFormatter(undefined).format(10)).toBe('$10.00');
  });
});

describe('course currency validation', () => {
  it('accepts BRL, USD and NGN and rejects others', () => {
    for (const currency of ['BRL', 'USD', 'NGN']) {
      expect(ZCourseUpdate.safeParse({ currency }).success).toBe(true);
    }
    expect(ZCourseUpdate.safeParse({ currency: 'EUR' }).success).toBe(false);
  });
});
