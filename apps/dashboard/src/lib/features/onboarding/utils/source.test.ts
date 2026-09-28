import { describe, expect, it } from 'vitest';

import { AI_PROVIDERS, AI_SOURCE_VALUE } from './constants';
import { resolveOnboardingSource } from './source';

describe('resolveOnboardingSource', () => {
  it.each(AI_PROVIDERS)('saves $value as the source when AI is selected', ({ value }) => {
    expect(resolveOnboardingSource(AI_SOURCE_VALUE, value)).toBe(value);
  });

  it('keeps a non-AI source unchanged', () => {
    expect(resolveOnboardingSource('search-engine', 'ChatGPT')).toBe('search-engine');
  });

  it('returns an empty source until an AI provider is selected', () => {
    expect(resolveOnboardingSource(AI_SOURCE_VALUE, '')).toBe('');
  });
});
