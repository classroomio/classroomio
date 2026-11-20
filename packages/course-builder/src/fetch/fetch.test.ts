import { describe, expect, it } from 'vitest';

import { createGuardedLookup } from './node-fetcher';
import { PoliteFetcher } from './polite-fetcher';
import { parseContentSignals, parseRobots } from './robots';
import { FetchError, type FetchResponse, type Fetcher } from './types';

function response(url: string, status: number, body = '', headers: Record<string, string> = {}): FetchResponse {
  return { url, status, body, headers, redirects: [], truncated: false };
}

describe('robots', () => {
  const robotsText = [
    'User-agent: GPTBot',
    'Disallow: /',
    'Content-Signal: ai-input=no',
    '',
    'User-agent: *',
    'Crawl-delay: 2',
    'Disallow: /private/',
    'Content-Signal: search=yes, ai-train=no',
    '',
    'Sitemap: https://example.com/sitemap-index.xml'
  ].join('\n');

  it('applies only the groups that match our product token', () => {
    const rules = parseRobots('https://example.com/robots.txt', robotsText, 'ClassroomIO-CourseBuilder');

    expect(rules.isAllowed('https://example.com/docs/start')).toBe(true);
    expect(rules.isAllowed('https://example.com/private/x')).toBe(false);
    expect(rules.crawlDelayMs).toBe(2000);
    expect(rules.sitemaps).toEqual(['https://example.com/sitemap-index.xml']);
    expect(rules.contentSignals).toEqual({ search: 'yes', 'ai-train': 'no' });
  });

  it('reads a content signal that applies to every agent', () => {
    expect(parseContentSignals('User-agent: *\nContent-Signal: ai-input=no\nAllow: /', 'Anything')).toEqual({
      'ai-input': 'no'
    });
  });
});

describe('PoliteFetcher', () => {
  function fakeClock() {
    let now = 0;
    const waits: number[] = [];

    return {
      waits,
      now: () => now,
      sleep: async (ms: number) => {
        waits.push(ms);
        now += ms;
      }
    };
  }

  it('refuses URLs that robots.txt disallows', async () => {
    const inner: Fetcher = {
      get: async (url) =>
        url.endsWith('/robots.txt') ? response(url, 200, 'User-agent: *\nDisallow: /admin') : response(url, 200, 'ok')
    };
    const clock = fakeClock();
    const fetcher = new PoliteFetcher(inner, { productToken: 'Test', ...clock });

    await expect(fetcher.get('https://example.com/admin/users')).rejects.toBeInstanceOf(FetchError);
    await expect(fetcher.get('https://example.com/help')).resolves.toMatchObject({ status: 200 });
  });

  it('spaces requests to one host by the crawl delay and retries a 429 after Retry-After', async () => {
    let calls = 0;
    const inner: Fetcher = {
      get: async (url) => {
        if (url.endsWith('/robots.txt')) return response(url, 200, 'User-agent: *\nCrawl-delay: 1');

        calls += 1;

        return calls === 1 ? response(url, 429, '', { 'retry-after': '7' }) : response(url, 200, 'ok');
      }
    };
    const clock = fakeClock();
    const fetcher = new PoliteFetcher(inner, { productToken: 'Test', minGapMs: 100, ...clock });

    const first = await fetcher.get('https://example.com/a');
    await fetcher.get('https://example.com/b');

    expect(first.status).toBe(200);
    expect(clock.waits).toEqual([1000, 7000, 1000]);
  });

  it('treats a robots.txt server error as a full disallow', async () => {
    const inner: Fetcher = { get: async (url) => response(url, url.endsWith('/robots.txt') ? 503 : 200) };
    const fetcher = new PoliteFetcher(inner, { productToken: 'Test', ...fakeClock() });

    await expect(fetcher.get('https://example.com/')).rejects.toMatchObject({ reason: 'robots-disallowed' });
  });

  it('retries a network failure with backoff and returns the page once it answers', async () => {
    let attempts = 0;
    const inner: Fetcher = {
      get: async (url) => {
        if (url.endsWith('/robots.txt')) return response(url, 404);

        attempts += 1;
        if (attempts < 3) throw new FetchError('unreachable', url, 'ECONNRESET');

        return response(url, 200, 'ok');
      }
    };
    const clock = fakeClock();
    const fetcher = new PoliteFetcher(inner, { productToken: 'Test', minGapMs: 0, ...clock });

    await expect(fetcher.get('https://example.com/a')).resolves.toMatchObject({ status: 200 });
    expect(clock.waits).toEqual([2000, 4000]);
  });

  it('gives up on a page that stays unreachable, and never retries a refusal', async () => {
    const unreachable: Fetcher = {
      get: async (url) => {
        if (url.endsWith('/robots.txt')) return response(url, 404);

        throw new FetchError('timeout', url);
      }
    };
    const blocked: Fetcher = {
      get: async (url) => {
        if (url.endsWith('/robots.txt')) return response(url, 404);

        throw new FetchError('blocked-address', url);
      }
    };
    const clock = fakeClock();

    await expect(
      new PoliteFetcher(unreachable, { productToken: 'Test', minGapMs: 0, ...clock }).get('https://example.com/a')
    ).rejects.toMatchObject({ reason: 'timeout' });
    expect(clock.waits).toEqual([2000, 4000, 8000]);
    await expect(
      new PoliteFetcher(blocked, { productToken: 'Test', ...fakeClock() }).get('https://example.com/a')
    ).rejects.toMatchObject({ reason: 'blocked-address' });
  });

  it('treats a robots.txt that cannot be reached as a full disallow', async () => {
    const inner: Fetcher = {
      get: async (url) => {
        if (url.endsWith('/robots.txt')) throw new FetchError('unreachable', url);

        return response(url, 200);
      }
    };
    const fetcher = new PoliteFetcher(inner, { productToken: 'Test', ...fakeClock() });

    await expect(fetcher.get('https://example.com/')).rejects.toMatchObject({ reason: 'robots-disallowed' });
  });

  it('keeps asking for a robots.txt that fails for a while, instead of losing the site', async () => {
    let robotsAttempts = 0;
    const inner: Fetcher = {
      get: async (url) => {
        if (url.endsWith('/robots.txt')) {
          robotsAttempts += 1;
          if (robotsAttempts <= 6) throw new FetchError('unreachable', url);
        }

        return response(url, 200);
      }
    };
    const fetcher = new PoliteFetcher(inner, { productToken: 'Test', ...fakeClock() });

    await expect(fetcher.get('https://example.com/')).resolves.toMatchObject({ status: 200 });
    expect(robotsAttempts).toBe(7);
  });
});

describe('guarded DNS lookup', () => {
  function lookup(lookupImpl: ReturnType<typeof createGuardedLookup>, hostname: string) {
    return new Promise<{ error: NodeJS.ErrnoException | null; address: unknown }>((resolve) =>
      lookupImpl(hostname, {}, (error, address) => resolve({ error, address }))
    );
  }

  it('retries a transient resolver failure and then answers from its cache', async () => {
    const calls: string[] = [];
    let failures = 1;
    const guarded = createGuardedLookup({
      retryDelaysMs: [0, 0],
      resolve: (hostname, _options, callback) => {
        calls.push(hostname);
        if (failures-- > 0) return callback(Object.assign(new Error('again'), { code: 'EAI_AGAIN' }), []);

        callback(null, [{ address: '93.184.216.34', family: 4 }]);
      }
    });

    expect(await lookup(guarded, 'docs.acme.com')).toEqual({ error: null, address: '93.184.216.34' });
    expect(await lookup(guarded, 'docs.acme.com')).toEqual({ error: null, address: '93.184.216.34' });
    expect(calls).toEqual(['docs.acme.com', 'docs.acme.com']);
  });

  it('refuses a private address even when it comes from the cache, and stops retrying a host that does not exist', async () => {
    let resolutions = 0;
    const guarded = createGuardedLookup({
      retryDelaysMs: [0, 0],
      resolve: (hostname, _options, callback) => {
        resolutions += 1;
        if (hostname === 'missing.acme.com') return callback(Object.assign(new Error('nx'), { code: 'ENOTFOUND' }), []);

        callback(null, [{ address: '10.0.0.5', family: 4 }]);
      }
    });

    expect((await lookup(guarded, 'internal.acme.com')).error?.code).toBe('EBLOCKED');
    expect((await lookup(guarded, 'internal.acme.com')).error?.code).toBe('EBLOCKED');
    expect((await lookup(guarded, 'missing.acme.com')).error?.code).toBe('ENOTFOUND');
    expect(resolutions).toBe(4);
  });
});
