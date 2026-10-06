import { describe, expect, it } from 'vitest';

import { ZOnboardingUpdateMetadata } from '../src/validation/onboarding/onboarding';

const basePayload = {
  fullname: 'Ada Lovelace',
  useCases: ['team-training'],
  learningMethod: 'self-serve',
  companySize: '2-9',
  jobRole: 'founder'
};

describe('ZOnboardingUpdateMetadata', () => {
  it('accepts a complete questionnaire without an optional source', () => {
    const result = ZOnboardingUpdateMetadata.safeParse(basePayload);

    expect(result.success).toBe(true);
  });

  it('treats blank source and provider values as explicit clears', () => {
    const result = ZOnboardingUpdateMetadata.safeParse({ ...basePayload, source: '', aiProvider: '' });

    expect(result.success).toBe(true);
    expect(result.data?.source).toBeNull();
    expect(result.data?.aiProvider).toBeNull();
  });

  it('accepts an AI source with a provider', () => {
    const result = ZOnboardingUpdateMetadata.safeParse({
      ...basePayload,
      source: 'ai',
      aiProvider: 'grok'
    });

    expect(result.success).toBe(true);
  });

  it('rejects an empty use case selection', () => {
    const result = ZOnboardingUpdateMetadata.safeParse({ ...basePayload, useCases: [] });

    expect(result.success).toBe(false);
  });

  it('requires free text when the "other" use case is selected', () => {
    const result = ZOnboardingUpdateMetadata.safeParse({ ...basePayload, useCases: ['other'] });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.join('.') === 'useCaseOther')).toBe(true);
    }
  });

  it('requires an AI provider when the AI source is selected', () => {
    const result = ZOnboardingUpdateMetadata.safeParse({ ...basePayload, source: 'ai' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.join('.') === 'aiProvider')).toBe(true);
    }
  });
});
