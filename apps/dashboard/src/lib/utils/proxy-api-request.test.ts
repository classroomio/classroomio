import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildProxiedApiResponse, proxyRequestToApi, shouldForwardToApi } from './proxy-api-request';

describe('shouldForwardToApi', () => {
  it('forwards /proxy and /api/auth paths', () => {
    expect(shouldForwardToApi('/proxy')).toBe(true);
    expect(shouldForwardToApi('/proxy/account')).toBe(true);
    expect(shouldForwardToApi('/api/auth')).toBe(true);
    expect(shouldForwardToApi('/api/auth/get-session')).toBe(true);
  });

  it('does not forward unrelated paths', () => {
    expect(shouldForwardToApi('/login')).toBe(false);
    expect(shouldForwardToApi('/api/csp-report')).toBe(false);
  });
});

describe('buildProxiedApiResponse', () => {
  it('strips content-encoding and content-length so the browser does not re-decode', async () => {
    const upstream = new Response('{"user":null}', {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'content-encoding': 'gzip',
        'content-length': '13',
        'transfer-encoding': 'chunked',
        'set-cookie': 'session=abc; Path=/'
      }
    });

    const proxied = buildProxiedApiResponse(upstream);

    expect(proxied.status).toBe(200);
    expect(proxied.headers.get('content-type')).toBe('application/json');
    expect(proxied.headers.get('set-cookie')).toBe('session=abc; Path=/');
    expect(proxied.headers.get('content-encoding')).toBeNull();
    expect(proxied.headers.get('content-length')).toBeNull();
    expect(proxied.headers.get('transfer-encoding')).toBeNull();
    expect(await proxied.text()).toBe('{"user":null}');
  });
});

describe('proxyRequestToApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('returns 502 when PRIVATE_SERVER_URL is missing', async () => {
    vi.stubEnv('PRIVATE_SERVER_URL', '');

    const response = await proxyRequestToApi(new Request('https://app.example/api/auth/get-session'));

    expect(response.status).toBe(502);
    expect(await response.text()).toBe('API upstream not configured');
  });

  it('requests identity encoding and returns a stripped response', async () => {
    vi.stubEnv('PRIVATE_SERVER_URL', 'http://api.internal:3081');

    const fetchMock = vi.fn().mockResolvedValue(
      new Response('{"session":null}', {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'content-encoding': 'gzip',
          'content-length': '16'
        }
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await proxyRequestToApi(
      new Request('https://dashboard.example/api/auth/get-session', {
        headers: {
          accept: 'application/json',
          'accept-encoding': 'gzip, deflate, br',
          cookie: 'better-auth.session_token=test'
        }
      })
    );

    expect(fetchMock).toHaveBeenCalledOnce();
    const [upstreamUrl, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(String(upstreamUrl)).toBe('http://api.internal:3081/api/auth/get-session');
    expect(init.method).toBe('GET');

    const upstreamHeaders = new Headers(init.headers);
    expect(upstreamHeaders.get('accept-encoding')).toBe('identity');
    expect(upstreamHeaders.get('host')).toBe('api.internal:3081');
    expect(upstreamHeaders.get('x-forwarded-host')).toBe('dashboard.example');
    expect(upstreamHeaders.get('cookie')).toBe('better-auth.session_token=test');

    expect(response.status).toBe(200);
    expect(response.headers.get('content-encoding')).toBeNull();
    expect(response.headers.get('content-length')).toBeNull();
    expect(await response.text()).toBe('{"session":null}');
  });
});
