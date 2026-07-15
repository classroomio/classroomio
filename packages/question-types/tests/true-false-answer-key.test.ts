import { describe, expect, it } from 'vitest';
import { resolveTrueFalseCorrectValue, syncTrueFalseOptions } from '../src';

describe('true/false answer key helpers', () => {
  it('uses settings.correctValue as the canonical answer when present', () => {
    const options = [
      { label: 'True', value: 'true', isCorrect: true },
      { label: 'False', value: 'false', isCorrect: false }
    ];

    expect(resolveTrueFalseCorrectValue({ correctValue: false }, options)).toBe(false);
  });

  it('falls back to the correct option label for legacy questions', () => {
    const options = [
      { label: 'True', value: 'fb6c9fa8-4fd9-4e71-b319-3e969656a935', isCorrect: false },
      { label: 'False', value: '2e191a1e-4aca-4bef-afae-dbd076d0b60b', isCorrect: true }
    ];

    expect(resolveTrueFalseCorrectValue({}, options)).toBe(false);
  });

  it('syncs option correctness from the canonical boolean', () => {
    const options = [
      { label: 'True', value: 'true', isCorrect: true },
      { label: 'False', value: 'false', isCorrect: false }
    ];

    expect(syncTrueFalseOptions(options, false)).toEqual([
      { label: 'True', value: 'true', isCorrect: false },
      { label: 'False', value: 'false', isCorrect: true }
    ]);
  });
});
