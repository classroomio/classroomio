import { describe, expect, it } from 'vitest';
import { normalizeThumbsQuestion } from '../src';

describe('thumbs question helpers', () => {
  it('normalizes answer-key fields out of thumbs questions', () => {
    expect(
      normalizeThumbsQuestion({
        settings: { correctValue: true },
        options: [
          { id: 1, label: 'Yes', value: 'true', isCorrect: true },
          { id: 2, label: 'No', value: 'false', isCorrect: false }
        ]
      })
    ).toEqual({
      settings: {},
      options: [
        { id: 1, label: 'Yes', value: 'true', isCorrect: false },
        { id: 2, label: 'No', value: 'false', isCorrect: false }
      ]
    });
  });
});
