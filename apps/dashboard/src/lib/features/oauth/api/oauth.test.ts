import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  authFetch: vi.fn(),
  nonNavigatingAuthFetch: vi.fn()
}));

vi.mock('$lib/utils/services/api', () => {
  class BaseApiWithErrors {
    isLoading = false;
    error: string | null = null;
  }

  return { BaseApiWithErrors, classroomio: {} };
});

vi.mock('$lib/utils/services/auth/client', () => ({
  authClient: {
    $fetch: mocks.authFetch
  },
  nonNavigatingAuthClient: {
    $fetch: mocks.nonNavigatingAuthFetch
  }
}));

import { oauthApi } from './oauth.svelte';

describe('oauthApi authorization steps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    oauthApi.error = null;
    oauthApi.isLoading = false;
  });

  it('posts consent through the non-navigating client and returns the callback url', async () => {
    const callbackUrl = 'https://zapier.com/dashboard/auth/oauth/return/App249044CLIAPI/?code=abc&state=xyz';
    mocks.nonNavigatingAuthFetch.mockResolvedValue({ data: { redirect: true, url: callbackUrl }, error: null });

    const redirectUrl = await oauthApi.submitConsent(true, 'client_id=zapier&sig=123', ['course:read']);

    expect(redirectUrl).toBe(callbackUrl);
    expect(oauthApi.error).toBeNull();
    expect(mocks.authFetch).not.toHaveBeenCalled();
    expect(mocks.nonNavigatingAuthFetch).toHaveBeenCalledWith('/oauth2/consent', {
      method: 'POST',
      body: { accept: true, oauth_query: 'client_id=zapier&sig=123', scope: 'course:read' }
    });
  });

  it('continues after the post-login gate through the non-navigating client and returns the next url', async () => {
    const consentUrl = '/oauth/consent?client_id=zapier&sig=456';
    mocks.nonNavigatingAuthFetch.mockResolvedValue({ data: { redirect: true, url: consentUrl }, error: null });

    const nextUrl = await oauthApi.continueAfterOrganization('client_id=zapier&sig=123');

    expect(nextUrl).toBe(consentUrl);
    expect(mocks.authFetch).not.toHaveBeenCalled();
    expect(mocks.nonNavigatingAuthFetch).toHaveBeenCalledWith('/oauth2/continue', {
      method: 'POST',
      body: { postLogin: true, oauth_query: 'client_id=zapier&sig=123' }
    });
  });

  it('sets generic error and returns null when authorization step fails', async () => {
    mocks.nonNavigatingAuthFetch.mockResolvedValue({ data: null, error: { message: 'bad request' } });

    const redirectUrl = await oauthApi.submitConsent(true, 'client_id=zapier&sig=123');

    expect(redirectUrl).toBeNull();
    expect(oauthApi.error).toBe('oauth.error.generic');
  });
});
