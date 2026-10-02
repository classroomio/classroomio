import { describe, expect, it } from 'vitest';

import { ZOnboardingUpdateMetadata } from '../src/validation/onboarding/onboarding';

describe('ZOnboardingUpdateMetadata', () => {
  it('accepts Grok as an onboarding source', () => {
    const result = ZOnboardingUpdateMetadata.safeParse({
      fullname: 'Ada Lovelace',
      goal: 'employees',
      source: 'Grok'
    });

    expect(result.success).toBe(true);
  });

  it('rejects an empty onboarding source', () => {
    const result = ZOnboardingUpdateMetadata.safeParse({
      fullname: 'Ada Lovelace',
      goal: 'employees',
      source: ''
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('onboarding.ai_required');
    }
  });
});
