import nock from 'nock';
import { createAppTester } from 'zapier-platform-core';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import App from '../src/index';

const APP_ORIGIN = 'https://app.example.test';
const API_ORIGIN = 'https://api.example.test';
const appTester = createAppTester(App);

beforeAll(() => {
  process.env.CIO_APP_ORIGIN = APP_ORIGIN;
  process.env.CIO_API_ORIGIN = API_ORIGIN;
  process.env.CLIENT_ID = 'test-client-id';
  process.env.CLIENT_SECRET = 'test-client-secret';
});

afterEach(() => nock.cleanAll());

describe('authentication', () => {
  it('always shows the consent screen so reconnects can narrow the grant', () => {
    const authorizeUrl = (App.authentication as any).oauth2Config.authorizeUrl;

    expect(authorizeUrl.params.prompt).toBe('consent');
  });

  it('exchanges authorization code with PKCE code_verifier and resource', async () => {
    const scope = nock(APP_ORIGIN)
      .post('/api/auth/oauth2/token', {
        grant_type: 'authorization_code',
        code: 'auth-code-123',
        redirect_uri: 'https://zapier.com/dashboard/auth/oauth/return/App123/',
        code_verifier: 'verifier-456',
        client_id: 'test-client-id',
        client_secret: 'test-client-secret',
        resource: `${API_ORIGIN}/public-api/v1`
      })
      .reply(200, {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token'
      });

    const getAccessToken = (App.authentication as any).oauth2Config.getAccessToken;
    const result = await appTester(getAccessToken, {
      inputData: {
        code: 'auth-code-123',
        redirect_uri: 'https://zapier.com/dashboard/auth/oauth/return/App123/',
        code_verifier: 'verifier-456'
      }
    });

    expect(result).toEqual({
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token'
    });
    expect(scope.isDone()).toBe(true);
  });

  it('refreshes token with resource and client credentials without sending stale bearer header', async () => {
    const scope = nock(APP_ORIGIN, { badheaders: ['authorization'] })
      .post('/api/auth/oauth2/token', {
        grant_type: 'refresh_token',
        refresh_token: 'existing-refresh-token',
        client_id: 'test-client-id',
        client_secret: 'test-client-secret',
        resource: `${API_ORIGIN}/public-api/v1`
      })
      .reply(200, {
        access_token: 'refreshed-access-token',
        refresh_token: 'rotated-refresh-token'
      });

    const refreshAccessToken = (App.authentication as any).oauth2Config.refreshAccessToken;
    const result = await appTester(refreshAccessToken, {
      authData: {
        access_token: 'expired-access-token',
        refresh_token: 'existing-refresh-token'
      }
    });

    expect(result).toEqual({
      access_token: 'refreshed-access-token',
      refresh_token: 'rotated-refresh-token'
    });
    expect(scope.isDone()).toBe(true);
  });

  it('sends token grants to CIO_OAUTH_TOKEN_ORIGIN when the app origin is browser-only', async () => {
    const tokenOrigin = 'https://tunnel.example.test';
    process.env.CIO_OAUTH_TOKEN_ORIGIN = `${tokenOrigin}/`;

    const scope = nock(tokenOrigin)
      .post('/api/auth/oauth2/token', (body) => body.grant_type === 'authorization_code')
      .reply(200, { access_token: 'tunnel-access-token', refresh_token: 'tunnel-refresh-token' });

    try {
      const getAccessToken = (App.authentication as any).oauth2Config.getAccessToken;
      const result = await appTester(getAccessToken, {
        inputData: {
          code: 'auth-code-123',
          redirect_uri: 'https://zapier.com/dashboard/auth/oauth/return/App123/',
          code_verifier: 'verifier-456'
        }
      });

      expect(result).toEqual({ access_token: 'tunnel-access-token', refresh_token: 'tunnel-refresh-token' });
      expect(scope.isDone()).toBe(true);
    } finally {
      delete process.env.CIO_OAUTH_TOKEN_ORIGIN;
    }
  });

  it('labels a connection without write access as read-only', async () => {
    const connectionLabel = (App.authentication as any).connectionLabel;
    const meResponse = {
      success: true,
      data: {
        organization: { id: 'org-1', name: 'Acme Academy' },
        connection: { scopes: ['audience:read', 'webhook:subscription:read', 'webhook:subscription:write'] }
      }
    };

    await expect(appTester(connectionLabel, { inputData: meResponse })).resolves.toBe('Acme Academy (read-only)');
  });

  it('tests connection via GET /public-api/v1/me', async () => {
    const scope = nock(API_ORIGIN)
      .get('/public-api/v1/me')
      .reply(200, {
        success: true,
        data: {
          user: { id: 'usr-1', email: 'admin@example.com' },
          organization: { id: 'org-1', name: 'Acme Academy' }
        }
      });

    const testFn = (App.authentication as any).test;
    const result = await appTester(testFn, {
      authData: {
        access_token: 'valid-token'
      }
    });

    expect(result).toMatchObject({
      success: true,
      data: {
        organization: { name: 'Acme Academy' }
      }
    });
    expect(scope.isDone()).toBe(true);

    const connectionLabel = (App.authentication as any).connectionLabel;
    const label = await appTester(connectionLabel, { inputData: result as Record<string, unknown> });

    expect(label).toBe('Acme Academy');
  });
});
