import { afterEach, describe, expect, it, vi } from 'vitest';
import { proxyRequestToPosthog, shouldForwardToPosthog } from './proxy-posthog-request';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('PostHog proxy', () => {
  it('matches only the ingest path segment', () => {
    for (const pathname of ['/ingest', '/ingest/', '/ingest/e/', '/ingest/flags/']) {
      expect(shouldForwardToPosthog(pathname)).toBe(true);
    }

    for (const pathname of ['/ingestion', '/ingest-other/e/', '/login', '/proxy/ingest/e/']) {
      expect(shouldForwardToPosthog(pathname)).toBe(false);
    }
  });

  it('forwards compressed event bytes and query parameters without tenant credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('1'));
    vi.stubGlobal('fetch', fetchMock);
    const eventBytes = new Uint8Array([31, 139, 8, 0, 255]);
    const request = new Request('https://my.fastlearner.io/ingest/e/?ip=0&compression=gzip-js', {
      method: 'POST',
      body: eventBytes,
      headers: {
        host: 'my.fastlearner.io',
        cookie: 'session=private',
        authorization: 'Bearer private',
        'content-type': 'application/octet-stream',
        'content-encoding': 'gzip',
        'cf-connecting-ip': '203.0.113.1'
      }
    });

    const response = await proxyRequestToPosthog(request);
    const [upstreamUrl, init] = fetchMock.mock.calls[0];

    expect(upstreamUrl.toString()).toBe('https://eu.i.posthog.com/e/?ip=0&compression=gzip-js');
    expect(init.method).toBe('POST');
    expect(new Uint8Array(init.body)).toEqual(eventBytes);
    expect(init.headers.get('content-encoding')).toBe('gzip');
    expect(init.headers.get('content-type')).toBe('application/octet-stream');
    expect(init.headers.get('x-forwarded-for')).toBe('203.0.113.1');
    expect(init.headers.get('cookie')).toBeNull();
    expect(init.headers.get('authorization')).toBeNull();
    expect(init.headers.get('host')).toBeNull();
    expect(await response.text()).toBe('1');
  });

  it.each([
    ['/ingest/flags/?v=2&config=true&ip=0', 'https://eu.i.posthog.com/flags/?v=2&config=true&ip=0'],
    ['/ingest/static/recorder.js?v=1', 'https://eu-assets.i.posthog.com/static/recorder.js?v=1'],
    ['/ingest/array/project/config', 'https://eu-assets.i.posthog.com/array/project/config'],
    ['/ingest', 'https://eu.i.posthog.com/']
  ])('routes %s to its EU upstream without forwarding the local port', async (path, expectedUrl) => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}'));
    vi.stubGlobal('fetch', fetchMock);

    await proxyRequestToPosthog(new Request(`http://localhost:5173${path}`));
    const [upstreamUrl, init] = fetchMock.mock.calls[0];

    expect(upstreamUrl.toString()).toBe(expectedUrl);
    expect(init.body).toBeUndefined();
    expect(init.redirect).toBe('manual');
  });

  it('preserves upstream errors and removes stale transport headers and cookies', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('{"error":"invalid token"}', {
        status: 400,
        headers: {
          'content-type': 'application/json',
          'content-encoding': 'gzip',
          'content-length': '100',
          connection: 'keep-alive',
          'set-cookie': 'upstream=private'
        }
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await proxyRequestToPosthog(new Request('https://my.fastlearner.io/ingest/flags/'));

    expect(response.status).toBe(400);
    expect(response.headers.get('content-type')).toBe('application/json');
    expect(response.headers.get('content-encoding')).toBeNull();
    expect(response.headers.get('content-length')).toBeNull();
    expect(response.headers.get('connection')).toBeNull();
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(await response.json()).toEqual({ error: 'invalid token' });
  });
});
