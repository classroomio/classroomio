import { describe, expect, it } from 'vitest';

import { getInviteTokenFromSignupUrl } from './invite-token';

describe('getInviteTokenFromSignupUrl', () => {
  it('reads a direct invite_token param', () => {
    const params = new URLSearchParams('invite_token=abc123');

    expect(getInviteTokenFromSignupUrl(params)).toBe('abc123');
  });

  it('reads the token from the redirect target', () => {
    const redirect = '/course/intelligenza-artificiale/enroll?invite_token=abc_123-XYZ';
    const params = new URLSearchParams({ redirect, email: 'luca@example.com' });

    expect(getInviteTokenFromSignupUrl(params)).toBe('abc_123-XYZ');
  });

  it('returns null without an invite token', () => {
    expect(getInviteTokenFromSignupUrl(new URLSearchParams('redirect=/courses'))).toBeNull();
    expect(getInviteTokenFromSignupUrl(new URLSearchParams())).toBeNull();
  });
});
