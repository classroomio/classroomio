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

  it('does not trigger a duplicate navigation when authClient.$fetch redirectPlugin redirects on consent', async () => {
    const callbackUrl = 'https://zapier.com/dashboard/auth/oauth/return/App249044CLIAPI/?code=abc&state=xyz';

    mocks.authFetch.mockImplementation(async () => {
      window.location.href = callbackUrl;

      return { data: { redirect: true, url: callbackUrl }, error: null };
    });

    const redirected = await oauthApi.submitConsent(true, 'client_id=zapier&sig=123');

    expect(redirected).toBe(true);
    expect(oauthApi.error).toBeNull();
    expect(mocks.assignHref).toHaveBeenCalledTimes(1);
    expect(mocks.assignHref).toHaveBeenCalledWith(callbackUrl);
  });

  it('does not trigger a duplicate navigation when authClient.$fetch redirectPlugin redirects on continue', async () => {
    const consentUrl = '/oauth/consent?client_id=zapier&sig=123';

    mocks.authFetch.mockImplementation(async () => {
      window.location.href = consentUrl;

      return { data: { redirect: true, url: consentUrl }, error: null };
    });

    const redirected = await oauthApi.continueAfterOrganization('client_id=zapier&sig=123');

    expect(redirected).toBe(true);
    expect(oauthApi.error).toBeNull();
    expect(mocks.assignHref).toHaveBeenCalledTimes(1);
    expect(mocks.assignHref).toHaveBeenCalledWith(consentUrl);
  });

  it('sets generic error and returns false when authorization step fails', async () => {
    mocks.authFetch.mockResolvedValue({ data: null, error: { message: 'bad request' } });

    const redirected = await oauthApi.submitConsent(true, 'client_id=zapier&sig=123');

    expect(redirected).toBe(false);
    expect(oauthApi.error).toBe('oauth.error.generic');
    expect(mocks.assignHref).not.toHaveBeenCalled();
  });
});
