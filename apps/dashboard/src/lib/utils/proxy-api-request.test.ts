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
        'transfer-encoding': 'chunked'
      }
    });

    const proxied = buildProxiedApiResponse(upstream);

    expect(proxied.status).toBe(200);
    expect(proxied.headers.get('content-type')).toBe('application/json');
    expect(proxied.headers.get('content-encoding')).toBeNull();
    expect(proxied.headers.get('content-length')).toBeNull();
    expect(proxied.headers.get('transfer-encoding')).toBeNull();
    expect(await proxied.text()).toBe('{"user":null}');
  });

  it('preserves multiple Set-Cookie headers without collapsing Expires commas', async () => {
    const upstreamHeaders = new Headers({
      'content-type': 'application/json',
      'content-encoding': 'gzip'
    });
    upstreamHeaders.append(
      'set-cookie',
      'better-auth.session_token=abc; Path=/; HttpOnly; Expires=Wed, 21 Oct 2026 07:28:00 GMT'
    );
    upstreamHeaders.append(
      'set-cookie',
      'better-auth.csrf_token=xyz; Path=/; HttpOnly; Expires=Thu, 22 Oct 2026 07:28:00 GMT'
    );

    const proxied = buildProxiedApiResponse(
      new Response('{"ok":true}', {
        status: 200,
        headers: upstreamHeaders
      })
    );

    expect(proxied.headers.getSetCookie()).toEqual([
      'better-auth.session_token=abc; Path=/; HttpOnly; Expires=Wed, 21 Oct 2026 07:28:00 GMT',
      'better-auth.csrf_token=xyz; Path=/; HttpOnly; Expires=Thu, 22 Oct 2026 07:28:00 GMT'
    ]);
    expect(proxied.headers.get('content-encoding')).toBeNull();
    expect(await proxied.text()).toBe('{"ok":true}');
  });
});

describe('proxyRequestToApi', () => {
  const originalPrivateServerUrl = process.env.PRIVATE_SERVER_URL;
  const originalFetch = global.fetch;

  afterEach(() => {
    if (originalPrivateServerUrl === undefined) {
      delete process.env.PRIVATE_SERVER_URL;
    } else {
      process.env.PRIVATE_SERVER_URL = originalPrivateServerUrl;
    }

    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('returns 502 when PRIVATE_SERVER_URL is missing', async () => {
    delete process.env.PRIVATE_SERVER_URL;

    const response = await proxyRequestToApi(new Request('https://app.example/api/auth/get-session'));

    expect(response.status).toBe(502);
    expect(await response.text()).toBe('API upstream not configured');
  });

  it('requests identity encoding and returns a stripped response', async () => {
    process.env.PRIVATE_SERVER_URL = 'http://api.internal:3081';

    const fetchMock = jest.fn().mockResolvedValue(
      new Response('{"session":null}', {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'content-encoding': 'gzip',
          'content-length': '16'
        }
      })
    );
    global.fetch = fetchMock as typeof fetch;

    const response = await proxyRequestToApi(
      new Request('https://dashboard.example/api/auth/get-session', {
        headers: {
          accept: 'application/json',
          'accept-encoding': 'gzip, deflate, br',
          cookie: 'better-auth.session_token=test'
        }
      })
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
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
