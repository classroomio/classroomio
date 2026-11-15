import { describe, expect, it } from 'vitest';
import { getPartLabel } from '../src/multi-part';

describe('getPartLabel', () => {
  it('labels parts a, b, c in order', () => {
    expect([0, 1, 2].map(getPartLabel)).toEqual(['(a)', '(b)', '(c)']);
  });

  it('continues past z with aa', () => {
    expect(getPartLabel(25)).toBe('(z)');
    expect(getPartLabel(26)).toBe('(aa)');
  });
});
