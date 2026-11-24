import { describe, expect, it } from 'vitest';

import { ALLOW_ALL_ROBOTS, type RobotsRules } from '../fetch/robots';
import { FetchError, type FetchResponse } from '../fetch/types';
import { hostOwnership, identifiesAsBrand, mentionsBrand } from './brand';
import { discoverSources, type DiscoveryFetcher } from './discover';
import { clientRedirectTarget, isBotChallenge, isLoginWall } from './page-signals';

interface Route {
  status?: number;
  body?: string;
  headers?: Record<string, string>;
  redirectTo?: string;
}

const LONG_TEXT = 'Learn how to set up dashboards, metrics and reports. '.repeat(20);
const DOCS_SIDEBAR = Array.from({ length: 12 }, (_, index) => `<a href="/docs/topic-${index}">Topic ${index}</a>`).join(
  ''
);

function fakeFetcher(
  routes: Record<string, Route>,
  robots: Record<string, Partial<RobotsRules>> = {}
): DiscoveryFetcher {
  return {
    async get(url) {
      const redirects: string[] = [];
      let current = url;
      let route = routes[current];

      while (route?.redirectTo) {
        redirects.push(current);
        current = route.redirectTo;
        route = routes[current];
      }

      if (!route) throw new FetchError('unreachable', current, 'ENOTFOUND');

      return {
        url: current,
        status: route.status ?? 200,
        body: route.body ?? '',
        headers: route.headers ?? {},
        redirects,
        truncated: false
      };
    },
    async robots(origin) {
      return { ...ALLOW_ALL_ROBOTS, ...robots[origin] };
    }
  };
}

function html(title: string, body = LONG_TEXT): string {
  return `<html><head><title>${title}</title></head><body>${body}</body></html>`;
}

function page(body: string, url = 'https://support.acme.com/', status = 200): FetchResponse {
  return { url, status, body, headers: {}, redirects: [], truncated: false };
}

describe('brand checks', () => {
  it('treats only the brand registrable domain as its own', () => {
    expect(hostOwnership('help.acme.co.uk', 'acme.co.uk')).toBe('own');
    expect(hostOwnership('acme.hosted-help.net', 'acme.co.uk')).toBe('foreign');
  });

  it('tells a site named after the brand from one named after someone else', () => {
    expect(identifiesAsBrand(html('Acme Help Center'), 'acme.com')).toBe(true);
    expect(
      identifiesAsBrand('<meta property="og:site_name" content="Acme Docs"><title>Start</title>', 'acme.com')
    ).toBe(true);
    expect(identifiesAsBrand(html('KB', 'Powered by Acme'), 'acme.com')).toBe(false);
    expect(mentionsBrand(html('Log in', '<script>{"tenant":"acmecloud"}</script>'), 'acme.cloud')).toBe(true);
    expect(mentionsBrand(html('Remote support software'), 'acme.com')).toBe(false);
  });
});

describe('page signals', () => {
  it('reads a meta refresh target', () => {
    const target = clientRedirectTarget(
      page('<meta http-equiv="refresh" content="0; url=https://acme.hosted-help.net/portal" />')
    );

    expect(target).toBe('https://acme.hosted-help.net/portal');
  });

  it('spots login pages and anti-bot interstitials without knowing who serves them', () => {
    expect(isLoginWall(page(html('Portal'), 'https://acme.hosted-help.net/customer/user/login'))).toBe(true);
    expect(isBotChallenge(page('<title>Just a moment...</title>Checking your browser', undefined, 403))).toBe(true);
    expect(isBotChallenge(page(html('Help'), undefined, 403))).toBe(false);
    expect(isBotChallenge(page(html('Help'), undefined, 200))).toBe(false);
  });
});

describe('discoverSources', () => {
  it('accepts a help site that a guessed subdomain redirects to, when the page there mentions the brand', async () => {
    const fetcher = fakeFetcher({
      'https://acme.cloud/': { body: html('Acme.Cloud') },
      'https://acme.cloud/llms.txt': {
        body: '# Acme\n- [Platform](https://acme.cloud/platform)',
        headers: { 'content-type': 'text/plain' }
      },
      'https://acme.cloud/sitemap-index.xml': { body: '<?xml version="1.0"?><sitemapindex></sitemapindex>' },
      'https://support.acme.cloud/': {
        body: '<meta http-equiv="refresh" content="0; url=https://acmecloud.hosted-help.net/portal" />'
      },
      'https://acmecloud.hosted-help.net/portal': {
        redirectTo: 'https://acmecloud.hosted-help.net/customer/user/login?next=portal'
      },
      'https://acmecloud.hosted-help.net/customer/user/login?next=portal': {
        body: html('Service portal', '<div id="root" data-tenant="acmecloud"></div>')
      }
    });

    const map = await discoverSources('https://acme.cloud', { fetcher, wildcardLabel: 'random-x' });

    expect(map.brandDomain).toBe('acme.cloud');
    expect(map.sources.map((source) => [source.kind, source.url, source.evidence, source.access])).toEqual([
      ['product-site', 'https://acme.cloud/', 'input', 'open'],
      ['help-center', 'https://acmecloud.hosted-help.net/', 'redirect-from-own-name', 'login']
    ]);
    expect(map.sources[0].llmsTxtUrl).toBe('https://acme.cloud/llms.txt');
    expect(map.sources[0].sitemapUrls).toEqual(['https://acme.cloud/sitemap-index.xml']);
    expect(map.sources[1].redirectChain).toContain('https://support.acme.cloud/');
    expect(map.skipped.every((entry) => entry.reason === 'unreachable')).toBe(true);
  });

  it('ignores answers from wildcard DNS', async () => {
    const shell = { body: html('Acme app') };
    const fetcher = fakeFetcher({
      'https://acme.com/': { body: html('Acme') },
      'https://help.acme.com/': shell,
      'https://docs.acme.com/': shell,
      'https://random-x.acme.com/': shell
    });

    const map = await discoverSources('https://acme.com/', {
      fetcher,
      probeLabels: ['help', 'docs'],
      wildcardLabel: 'random-x'
    });

    expect(map.sources).toHaveLength(1);
    expect(map.skipped.map((entry) => entry.reason)).toEqual(['wildcard-dns', 'wildcard-dns']);
  });

  it('holds back a guessed subdomain that names itself after someone else, such as a customer space', async () => {
    const fetcher = fakeFetcher({
      'https://acme.com/': { body: html('Acme') },
      'https://kb.acme.com/': { body: html('KB', `${LONG_TEXT} Powered by Acme`) },
      'https://docs.acme.com/': { body: html('Acme Developer Docs') },
      'https://random-x.acme.com/': { status: 404, body: html('Not found') }
    });

    const map = await discoverSources('https://acme.com/', {
      fetcher,
      probeLabels: ['kb', 'docs'],
      wildcardLabel: 'random-x'
    });

    expect(map.sources.map((source) => [source.url, source.evidence])).toEqual([
      ['https://acme.com/', 'input'],
      ['https://docs.acme.com/', 'names-itself-after-brand']
    ]);
    expect(map.needsConfirmation.map((source) => [source.url, source.evidence])).toEqual([
      ['https://kb.acme.com/', 'probe-only']
    ]);
  });

  it('skips a redirect to another company whose page never mentions the brand', async () => {
    const fetcher = fakeFetcher({
      'https://acme.com/': { body: html('Acme') },
      'https://support.acme.com/': { redirectTo: 'https://www.remote-tool.example/' },
      'https://www.remote-tool.example/': { body: html('Remote support software') }
    });

    const map = await discoverSources('https://acme.com/', {
      fetcher,
      probeLabels: ['support'],
      wildcardLabel: 'random-x'
    });

    expect(map.sources.map((source) => source.kind)).toEqual(['product-site']);
    expect(map.skipped).toContainEqual(
      expect.objectContaining({ url: 'https://support.acme.com/', reason: 'off-brand' })
    );
  });

  it('reads help paths linked on the site, including links listed in llms.txt, once per source', async () => {
    const fetcher = fakeFetcher({
      'https://acme.com/': {
        body: html(
          'Acme',
          `<a href="/docs/getting-started">Docs</a><a href="/docs/api">API</a><a href="/pricing">Pricing</a>${LONG_TEXT}`
        )
      },
      'https://acme.com/llms.txt': {
        body: '# Acme\n- [Help center](https://help.acme-support.example/acme/)',
        headers: { 'content-type': 'text/plain' }
      },
      'https://acme.com/docs/getting-started': { body: html('Getting started', `${DOCS_SIDEBAR}${LONG_TEXT}`) },
      'https://help.acme-support.example/acme/': { body: html('Acme help', `${LONG_TEXT} Acme`) },
      'https://help.acme.com/': { redirectTo: 'https://acme.com/' }
    });

    const map = await discoverSources('https://acme.com/', {
      fetcher,
      probeLabels: ['help'],
      wildcardLabel: 'random-x'
    });

    expect(map.sources.map((source) => [source.kind, source.url, source.evidence])).toEqual([
      ['product-site', 'https://acme.com/', 'input'],
      ['docs', 'https://acme.com/docs', 'linked-from-site'],
      ['help-center', 'https://help.acme-support.example/', 'linked-from-site']
    ]);
    expect(map.skipped).toContainEqual(expect.objectContaining({ reason: 'same-as-homepage' }));
  });

  it('follows a product-site support page to the help centre it links to, without taking the page as a source', async () => {
    const fetcher = fakeFetcher({
      'https://acme.com/': { body: html('Acme', `<a href="/support">Support</a>${LONG_TEXT}`) },
      'https://acme.com/support': {
        body: html('Support', `<a href="https://kb.acme-help.example/">Visit the knowledge base</a>${LONG_TEXT}`)
      },
      'https://kb.acme-help.example/': { body: html('Acme knowledge base', `${LONG_TEXT} Acme`) }
    });

    const map = await discoverSources('https://acme.com/', { fetcher, probeLabels: [], wildcardLabel: 'random-x' });

    expect(map.sources.map((source) => [source.kind, source.url])).toEqual([
      ['product-site', 'https://acme.com/'],
      ['help-center', 'https://kb.acme-help.example/']
    ]);
    expect(map.skipped).toContainEqual(
      expect.objectContaining({ reason: 'hub-page', url: 'https://acme.com/support' })
    );
  });

  it('keeps a help centre whose landing fills itself in with scripts, for the reader to render', async () => {
    const fetcher = fakeFetcher({
      'https://acme.com/': { body: html('Acme', `<a href="https://help.acme.com/">Help</a>${LONG_TEXT}`) },
      'https://help.acme.com/': {
        body: '<html><head><title>Acme Help</title><script src="/app.js"></script></head><body><div id="root"></div></body></html>'
      }
    });

    const map = await discoverSources('https://acme.com/', { fetcher, probeLabels: [], wildcardLabel: 'random-x' });

    expect(map.sources.map((source) => source.url)).toContain('https://help.acme.com/');
  });

  it('ignores headlines that merely contain a documentation word, and copies of the homepage on other hosts', async () => {
    const fetcher = fakeFetcher({
      'https://acme.com/': {
        body: html(
          'Acme',
          `<a href="https://news.example/acme-launch">Acme launches a camera to help fleets avoid collisions</a>` +
            `<a href="https://acme-staging.example.app/">Guides</a>${LONG_TEXT}`
        )
      },
      'https://news.example/acme-launch': { body: html('Acme launches', `${LONG_TEXT} Acme`) },
      'https://acme-staging.example.app/': { body: html('Acme', `${LONG_TEXT} Acme`) }
    });

    const map = await discoverSources('https://acme.com/', { fetcher, probeLabels: [], wildcardLabel: 'random-x' });

    expect(map.sources.map((source) => source.url)).toEqual(['https://acme.com/']);
    expect(map.skipped).toContainEqual(expect.objectContaining({ reason: 'same-as-homepage' }));
  });

  it("finds the organisation's other documentation linked from a help centre, but not the help centre's vendor", async () => {
    const fetcher = fakeFetcher({
      'https://acme.com/': { body: html('Acme', `<a href="https://help.acme.com/">Help</a>${LONG_TEXT}`) },
      'https://help.acme.com/': {
        body: html(
          'Acme Help',
          `<a href="https://developers.acme.com/">Developers</a><a href="https://docs.helpdesk-vendor.example/">Docs</a>` +
            `<a href="https://www.youtube.com/@acme">Tutorials</a>${LONG_TEXT}`
        )
      },
      'https://developers.acme.com/': { body: html('Acme developers', `${LONG_TEXT} Acme`) },
      'https://docs.helpdesk-vendor.example/': { body: html('Vendor docs', `${LONG_TEXT} acme`) }
    });

    const map = await discoverSources('https://acme.com/', { fetcher, probeLabels: [], wildcardLabel: 'random-x' });

    expect(map.sources.map((source) => source.url)).toEqual([
      'https://acme.com/',
      'https://help.acme.com/',
      'https://developers.acme.com/'
    ]);
  });

  it('skips a copy of the product site on another host that names the site as its canonical address', async () => {
    const fetcher = fakeFetcher({
      'https://acme.com/': {
        body: html('Acme', `<a href="https://acme-git-staging.example.app/">Docs</a>${LONG_TEXT}`)
      },
      'https://acme-git-staging.example.app/': {
        body: `<html><head><title>Acme staging</title><link rel="canonical" href="https://acme.com/"></head><body>${LONG_TEXT} Acme</body></html>`
      }
    });

    const map = await discoverSources('https://acme.com/', { fetcher, probeLabels: [], wildcardLabel: 'random-x' });

    expect(map.sources.map((source) => source.url)).toEqual(['https://acme.com/']);
  });

  it('keeps a linked source whose pages are behind an anti-bot interstitial, marked as such', async () => {
    const fetcher = fakeFetcher({
      'https://acme.com/': { body: html('Acme', `<a href="https://support.acme.com/">Help center</a>${LONG_TEXT}`) },
      'https://support.acme.com/': { status: 403, body: '<title>Just a moment...</title>Verify you are human' }
    });

    const map = await discoverSources('https://acme.com/', { fetcher, probeLabels: [], wildcardLabel: 'random-x' });

    expect(map.sources[1]).toMatchObject({ url: 'https://support.acme.com/', access: 'challenge' });
  });

  it('stops when the site opts out of AI input', async () => {
    const fetcher = fakeFetcher(
      { 'https://acme.com/': { body: html('Acme') } },
      { 'https://acme.com': { contentSignals: { 'ai-input': 'no' } } }
    );

    const map = await discoverSources('https://acme.com/', { fetcher, wildcardLabel: 'random-x' });

    expect(map.sources).toEqual([]);
    expect(map.skipped).toEqual([expect.objectContaining({ reason: 'ai-input-disallowed' })]);
  });
});
