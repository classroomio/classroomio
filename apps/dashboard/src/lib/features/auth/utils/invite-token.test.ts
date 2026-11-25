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

  it('leaves a redirect fragment out of the token', () => {
    const redirect = '/course/intelligenza-artificiale/enroll?invite_token=abc123#details';
    const params = new URLSearchParams({ redirect });

    expect(getInviteTokenFromSignupUrl(params)).toBe('abc123');
  });

  it('reads the token from an absolute redirect URL', () => {
    const redirect = 'https://academy.example.com/course/demo/enroll?invite_token=abc123';
    const params = new URLSearchParams({ redirect });

    expect(getInviteTokenFromSignupUrl(params)).toBe('abc123');
  });

  it('returns null for an unparseable redirect', () => {
    const params = new URLSearchParams({ redirect: 'http://' });

    expect(getInviteTokenFromSignupUrl(params)).toBeNull();
  });

  it('returns null without an invite token', () => {
    expect(getInviteTokenFromSignupUrl(new URLSearchParams('redirect=/courses'))).toBeNull();
    expect(getInviteTokenFromSignupUrl(new URLSearchParams())).toBeNull();
  });
});
