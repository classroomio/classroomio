import { describe, expect, it } from 'vitest';

import { getTerminalClaimErrorKey } from './claim-utils';

describe('getTerminalClaimErrorKey', () => {
  it('maps every permanent claim failure to a translation key', () => {
    expect(getTerminalClaimErrorKey('EARLY_ADOPTER_CLAIM_INVALID')).toBe('early_adopter_claim.errors.invalid');
    expect(getTerminalClaimErrorKey('EARLY_ADOPTER_CLAIM_EXPIRED')).toBe('early_adopter_claim.errors.expired');
    expect(getTerminalClaimErrorKey('EARLY_ADOPTER_CLAIM_UNAVAILABLE')).toBe('early_adopter_claim.errors.unavailable');
    expect(getTerminalClaimErrorKey('EARLY_ADOPTER_PLAN_CONFLICT')).toBe('early_adopter_claim.errors.conflict');
  });

  it('treats other failures as temporary so the token is kept', () => {
    expect(getTerminalClaimErrorKey('ORG_TEAM_NOT_AUTHORIZED')).toBeNull();
    expect(getTerminalClaimErrorKey('EARLY_ADOPTER_CLAIM_FAILED')).toBeNull();
    expect(getTerminalClaimErrorKey(undefined)).toBeNull();
  });
});
