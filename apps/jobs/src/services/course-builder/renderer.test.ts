import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { ALLOW_ALL_ROBOTS, readSource, type DiscoveryFetcher, type FetchResponse } from '@cio/course-builder';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createRenderer, RenderBlockedError, type ManagedRenderer, type RendererPolicy } from './renderer';

const FILLER = 'Every step is explained so that a new administrator can follow along without help. '.repeat(4);
const SHELL = `<html><head><title>Loading</title><script src="/app.js"></script></head><body><div id="app"></div></body></html>`;

let server: Server;
let origin: string;
const received: string[] = [];

function pageFor(path: string, port: number): { type: string; body: string } | null {
  if (path === '/docs/meters') return { type: 'text/html', body: SHELL };
  if (path === '/app.js') {
    return {
      type: 'application/javascript',
      body: `fetch('/api/page').then((r) => r.json()).then((data) => {
        document.querySelector('#app').innerHTML = '<main><h1>' + data.page.title + '</h1>' + data.page.body_html + '</main>';
      });`
    };
  }
  if (path === '/api/page') {
    const page = { title: 'Connect a meter', body_html: `<p>Connect a meter in Acme. ${FILLER}</p>` };

    return { type: 'application/json', body: JSON.stringify({ page }) };
  }
  if (path === '/probe-private') {
    return {
      type: 'text/html',
      body: `<html><body><main><h1>Probe</h1></main><img src="/logo.png"><script>fetch('http://127.0.0.1:${port}/secret').catch(() => {});</script></body></html>`
    };
  }
  if (path === '/secret') return { type: 'application/json', body: '{"secret":true}' };
  if (path === '/logo.png') return { type: 'image/png', body: '' };

  return null;
}

const LOCALHOST_ONLY: RendererPolicy = {
  allowHost: async (hostname) => hostname === 'localhost',
  allowAddress: (_address, hostname) => hostname === 'localhost'
};

const RESOLVES_PUBLIC_BUT_CONNECTS_PRIVATE: RendererPolicy = {
  allowHost: async () => true,
  allowAddress: () => false
};

function localFetcher(): DiscoveryFetcher {
  return {
    async get(url) {
      const response = await fetch(url);
      const body = await response.text();
      const fetched: FetchResponse = {
        url: response.url,
        status: response.status,
        headers: { 'content-type': response.headers.get('content-type') ?? '' },
        body,
        redirects: [],
        truncated: false
      };

      return fetched;
    },
    async robots() {
      return ALLOW_ALL_ROBOTS;
    }
  };
}

beforeAll(async () => {
  server = createServer((request, response) => {
    const path = new URL(request.url ?? '/', 'http://localhost').pathname;
    received.push(path);
    const port = (server.address() as AddressInfo).port;
    const page = pageFor(path, port);
    response.writeHead(page ? 200 : 404, { 'content-type': page?.type ?? 'text/plain' });
    response.end(page?.body ?? 'Not found');
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  origin = `http://localhost:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe('createRenderer', () => {
  let renderer: ManagedRenderer;

  beforeAll(() => {
    renderer = createRenderer({ userAgent: 'CourseBuilderTest/1.0', policy: LOCALHOST_ONLY, recycleAfter: 2 });
  });

  afterAll(async () => {
    await renderer.close();
  });

  it('runs a script shell and returns the rendered page and the JSON it loaded', async () => {
    const rendered = await renderer.render(`${origin}/docs/meters`, { timeoutMs: 20_000 });

    expect(rendered.status).toBe(200);
    expect(rendered.html).toContain('<h1>Connect a meter</h1>');
    expect(rendered.observedJson).toEqual([
      { url: `${origin}/api/page`, body: { page: expect.objectContaining({ title: 'Connect a meter' }) } }
    ]);
  }, 30_000);

  it('refuses requests to private addresses before they are sent, and images', async () => {
    received.length = 0;

    const rendered = await renderer.render(`${origin}/probe-private`, { timeoutMs: 20_000 });

    expect(rendered.html).toContain('<h1>Probe</h1>');
    expect(received).toContain('/probe-private');
    expect(received).not.toContain('/secret');
    expect(received).not.toContain('/logo.png');
  }, 30_000);

  it('keeps working across a browser restart', async () => {
    const first = await renderer.render(`${origin}/docs/meters`, { timeoutMs: 20_000 });
    const second = await renderer.render(`${origin}/docs/meters`, { timeoutMs: 20_000 });

    expect(first.html).toContain('Connect a meter');
    expect(second.html).toContain('Connect a meter');
  }, 60_000);

  it('fails a render whose responses came from a private address after the host check passed', async () => {
    const rebound = createRenderer({
      userAgent: 'CourseBuilderTest/1.0',
      policy: RESOLVES_PUBLIC_BUT_CONNECTS_PRIVATE
    });

    try {
      await expect(rebound.render(`${origin}/docs/meters`, { timeoutMs: 20_000 })).rejects.toBeInstanceOf(
        RenderBlockedError
      );
    } finally {
      await rebound.close();
    }
  }, 30_000);

  it('refuses private hosts with the default policy', async () => {
    const strict = createRenderer({ userAgent: 'CourseBuilderTest/1.0' });
    received.length = 0;

    try {
      await expect(strict.render(`${origin}/docs/meters`, { timeoutMs: 20_000 })).rejects.toThrow();
      expect(received).toEqual([]);
    } finally {
      await strict.close();
    }
  }, 30_000);
});

describe('readSource with the headless renderer', () => {
  it('reads a page that is empty until its scripts run', async () => {
    const renderer = createRenderer({ userAgent: 'CourseBuilderTest/1.0', policy: LOCALHOST_ONLY });
    const url = `${origin}/docs/meters`;

    try {
      const result = await readSource({
        fetcher: localFetcher(),
        renderer,
        source: {
          kind: 'docs',
          url,
          title: 'Acme Docs',
          foundVia: 'site-link',
          foundAt: url,
          redirectChain: [url],
          ownership: 'own',
          evidence: 'linked-from-site',
          access: 'open',
          llmsTxtUrl: null,
          sitemapUrls: []
        },
        brandDomain: 'localhost',
        preferredLocale: 'en',
        maxPages: 10
      });

      expect(result.outcome).toBe('read');
      expect(result.tree.pages[0]).toMatchObject({ title: 'Connect a meter' });
      expect(result.tree.pages[0].content?.text).toContain('Connect a meter in Acme.');
    } finally {
      await renderer.close();
    }
  }, 60_000);
});
