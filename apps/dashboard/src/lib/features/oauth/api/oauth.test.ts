import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  authFetch: vi.fn(),
  assignHref: vi.fn()
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
  }
}));

import { oauthApi } from './oauth.svelte';

describe('oauthApi authorization steps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    oauthApi.error = null;
    oauthApi.isLoading = false;
    vi.stubGlobal('window', {
      location: {
        set href(url: string) {
          mocks.assignHref(url);
        }
      }
    });
  });

  it('returns the callback url without navigating itself when the redirectPlugin redirects on consent', async () => {
    const callbackUrl = 'https://zapier.com/dashboard/auth/oauth/return/App249044CLIAPI/?code=abc&state=xyz';

    mocks.authFetch.mockImplementation(async () => {
      window.location.href = callbackUrl;

      return { data: { redirect: true, url: callbackUrl }, error: null };
    });

    const redirectUrl = await oauthApi.submitConsent(true, 'client_id=zapier&sig=123');

    expect(redirectUrl).toBe(callbackUrl);
    expect(oauthApi.error).toBeNull();
    expect(mocks.assignHref).toHaveBeenCalledTimes(1);
    expect(mocks.assignHref).toHaveBeenCalledWith(callbackUrl);
  });

  it('returns the consent url without navigating itself when the redirectPlugin redirects on continue', async () => {
    const consentUrl = '/oauth/consent?client_id=zapier&sig=123';

    mocks.authFetch.mockImplementation(async () => {
      window.location.href = consentUrl;

      return { data: { redirect: true, url: consentUrl }, error: null };
    });

    const consentPageUrl = await oauthApi.continueAfterOrganization('client_id=zapier&sig=123');

    expect(consentPageUrl).toBe(consentUrl);
    expect(oauthApi.error).toBeNull();
    expect(mocks.assignHref).toHaveBeenCalledTimes(1);
    expect(mocks.assignHref).toHaveBeenCalledWith(consentUrl);
  });

  it('sets generic error and returns null when authorization step fails', async () => {
    mocks.authFetch.mockResolvedValue({ data: null, error: { message: 'bad request' } });

    const redirectUrl = await oauthApi.submitConsent(true, 'client_id=zapier&sig=123');

    expect(redirectUrl).toBeNull();
    expect(oauthApi.error).toBe('oauth.error.generic');
    expect(mocks.assignHref).not.toHaveBeenCalled();
  });
});
