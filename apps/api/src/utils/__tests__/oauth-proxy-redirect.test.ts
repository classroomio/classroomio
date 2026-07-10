import { afterEach, describe, expect, it } from 'vitest';

import {
  resolveOAuthBrowserOrigin,
  rewriteAuthRequestUrl,
  rewriteOAuthProxyCallbackLocation,
  shouldRewriteOAuthProxyCallbackLocation,
  stripBackendPortFromHost
} from '../oauth-proxy-redirect';

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('stripBackendPortFromHost', () => {
  it('removes a port that matches PRIVATE_SERVER_URL', () => {
    process.env.PRIVATE_SERVER_URL = 'http://cio-api-vymh:10000';

    expect(stripBackendPortFromHost('my.fastlearner.io:10000')).toBe('my.fastlearner.io');
  });

  it('keeps non-backend ports such as local dev', () => {
    process.env.PRIVATE_SERVER_URL = 'http://localhost:3002';

    expect(stripBackendPortFromHost('localhost:5173')).toBe('localhost:5173');
  });
});

describe('rewriteAuthRequestUrl', () => {
  it('clears the internal upstream port from the rewritten request URL', () => {
    process.env.PRIVATE_SERVER_URL = 'http://cio-api-vymh:10000';

    const request = new Request('http://cio-api-vymh:10000/api/auth/sign-in/social', { method: 'POST' });
    const rewritten = rewriteAuthRequestUrl(request, {
      forwardedHost: 'my.fastlearner.io',
      forwardedProto: 'https'
    });

    expect(new URL(rewritten.url).href).toBe('https://my.fastlearner.io/api/auth/sign-in/social');
  });
});

describe('resolveOAuthBrowserOrigin', () => {
  it('prefers x-forwarded-host without the backend port', () => {
    process.env.PRIVATE_SERVER_URL = 'http://cio-api-vymh:10000';

    expect(
      resolveOAuthBrowserOrigin({
        forwardedHost: 'my.fastlearner.io:10000',
        forwardedProto: 'https'
      })
    ).toBe('https://my.fastlearner.io');
  });

  it('falls back to DASHBOARD_ORIGIN when forwarded host is absent', () => {
    process.env.DASHBOARD_ORIGIN = 'https://my.fastlearner.io';

    expect(resolveOAuthBrowserOrigin({})).toBe('https://my.fastlearner.io');
  });
});

describe('rewriteOAuthProxyCallbackLocation', () => {
  it('rewrites backend host to the public dashboard origin', () => {
    const location =
      'https://my.fastlearner.io:10000/api/auth/oauth-proxy-callback?callbackURL=https%3A%2F%2Fmy.fastlearner.io%2Fcourse%2Ffoo%2Fenroll&token=abc';

    expect(shouldRewriteOAuthProxyCallbackLocation(location, 'https://my.fastlearner.io')).toBe(true);
    expect(rewriteOAuthProxyCallbackLocation(location, 'https://my.fastlearner.io')).toBe(
      'https://my.fastlearner.io/api/auth/oauth-proxy-callback?callbackURL=https%3A%2F%2Fmy.fastlearner.io%2Fcourse%2Ffoo%2Fenroll&token=abc'
    );
  });
});
