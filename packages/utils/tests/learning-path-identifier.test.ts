import { describe, expect, it } from 'vitest';

import { ZLearningPathIdentifier } from '../src/validation/learning-path/learning-path';

describe('ZLearningPathIdentifier', () => {
  it.each(['../x', 'a?b', 'a#b', '', 'too-long-public-id', 'ABC'])('rejects %s', (value) => {
    expect(ZLearningPathIdentifier.safeParse(value).success).toBe(false);
  });

  it.each(['22222222-2222-4222-8222-222222222222', 'AbC123Xy', '12345678'])('accepts %s', (value) => {
    expect(ZLearningPathIdentifier.safeParse(value).success).toBe(true);
  });
});
