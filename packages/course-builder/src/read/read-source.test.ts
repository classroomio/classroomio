import { describe, expect, it, vi } from 'vitest';

import type { DiscoveredSource, DiscoveryFetcher } from '../discover/discover';
import { ALLOW_ALL_ROBOTS, type RobotsRules } from '../fetch/robots';
import { FetchError, type FetchResponse } from '../fetch/types';
import { readSource, type ReadSourceOptions } from './read-source';
import type { PageRenderer } from './types';

interface Route {
  status?: number;
  body?: string;
  contentType?: string;
  redirectTo?: string;
}

const FILLER = 'Every step is explained so that a new administrator can follow along without help. '.repeat(4);

function article(title: string, extra = '', mention = 'Acme'): string {
  return `<html lang="en"><head><title>${title} | Acme Docs</title></head><body><main><h1>${title}</h1><p>${title} in ${mention}: ${FILLER}</p>${extra}</main></body></html>`;
}

function site(
  routes: Record<string, Route>,
  robots: Partial<RobotsRules> = {}
): DiscoveryFetcher & { requested: string[] } {
  const requested: string[] = [];
  const rules = { ...ALLOW_ALL_ROBOTS, ...robots };

  return {
    requested,
    async get(url, options) {
      requested.push(`${options?.accept === 'text/markdown' ? 'md ' : ''}${url}`);
      if (!rules.isAllowed(url)) throw new FetchError('robots-disallowed', url);

      const redirects: string[] = [];
      let current = url;
      let route = routes[current];
      while (route?.redirectTo) {
        redirects.push(current);
        current = route.redirectTo;
        route = routes[current];
      }

      const wantsMarkdown = options?.accept === 'text/markdown';
      const isMarkdown = route?.contentType?.includes('markdown');
      if (!route || (wantsMarkdown && !isMarkdown && current.endsWith('.md'))) {
        return response(current, 404, 'Not found', 'text/html', redirects);
      }
      if (!wantsMarkdown && isMarkdown && !current.endsWith('.md')) {
        return response(current, route.status ?? 200, route.body ?? '', 'text/html', redirects);
      }

      return response(current, route.status ?? 200, route.body ?? '', route.contentType ?? 'text/html', redirects);
    },
    async robots() {
      return rules;
    }
  };
}

function response(url: string, status: number, body: string, contentType: string, redirects: string[]): FetchResponse {
  return { url, status, body, headers: { 'content-type': contentType }, redirects, truncated: false };
}

function source(url: string, overrides: Partial<DiscoveredSource> = {}): DiscoveredSource {
  return {
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
    sitemapUrls: [],
    ...overrides
  };
}

function options(
  fetcher: DiscoveryFetcher,
  discovered: DiscoveredSource,
  extra: Partial<ReadSourceOptions> = {}
): ReadSourceOptions {
  return { fetcher, source: discovered, brandDomain: 'acme.com', preferredLocale: 'en', maxPages: 500, ...extra };
}

function outline(result: Awaited<ReturnType<typeof readSource>>): string[] {
  return result.tree.pages.map((page) => `${'  '.repeat(page.depth)}${page.title}`);
}

function urlset(urls: string[]): string {
  return `<urlset>${urls.map((url) => `<url><loc>${url}</loc></url>`).join('')}</urlset>`;
}

describe('readSource', () => {
  it('reads a plain site from its sitemap and builds the tree from URL paths', async () => {
    const fetcher = site({
      'https://acme.com/docs': { body: article('Docs home') },
      'https://acme.com/sitemap.xml': {
        body: urlset([
          'https://acme.com/docs',
          'https://acme.com/docs/reports',
          'https://acme.com/docs/reports/share',
          'https://acme.com/docs/alerts',
          'https://acme.com/pricing'
        ])
      },
      'https://acme.com/docs/reports': { body: article('Reports') },
      'https://acme.com/docs/reports/share': { body: article('Share a report') },
      'https://acme.com/docs/alerts': { body: article('Alerts') }
    });

    const result = await readSource(
      options(fetcher, source('https://acme.com/docs', { sitemapUrls: ['https://acme.com/sitemap.xml'] }))
    );

    expect(result.outcome).toBe('read');
    expect(outline(result)).toEqual(['Docs home', '  Reports', '    Share a report', '  Alerts']);
    expect(result.tree.completeness).toMatchObject({ read: 4, declared: 4, status: 'complete' });
    expect(fetcher.requested).not.toContain('https://acme.com/pricing');
  });

  it('follows the order and groups of the sidebar menu over the sitemap order', async () => {
    const sidebar = `<aside class="sidebar"><ul>
      <li><a href="/docs/start">Start here</a></li>
      <li><span>Reports</span><ul><li><a href="/docs/share">Share a report</a></li><li><a href="/docs/create">Create a report</a></li></ul></li>
      <li><a href="/docs/alerts">Alerts</a></li></ul></aside>`;
    const page = (title: string) => article(title).replace('<main>', `${sidebar}<main>`);
    const fetcher = site({
      'https://acme.com/docs/start': { body: page('Start here') },
      'https://acme.com/docs/alerts': { body: page('Alerts') },
      'https://acme.com/docs/create': { body: page('Create a report') },
      'https://acme.com/docs/share': { body: page('Share a report') },
      'https://acme.com/sitemap.xml': {
        body: urlset([
          'https://acme.com/docs/alerts',
          'https://acme.com/docs/create',
          'https://acme.com/docs/share',
          'https://acme.com/docs/start'
        ])
      }
    });

    const result = await readSource(
      options(
        fetcher,
        source('https://acme.com/docs', {
          redirectChain: ['https://acme.com/docs/start'],
          sitemapUrls: ['https://acme.com/sitemap.xml']
        })
      )
    );

    expect(outline(result)).toEqual(['Start here', 'Reports', '  Share a report', '  Create a report', 'Alerts']);
  });

  it('turns index pages into groups of the pages they list, in listed order', async () => {
    const list = (items: string[]) =>
      `<h1>Help</h1><ul>${items.map((item) => `<li><a href="/help/${item}">${item}</a></li>`).join('')}</ul>`;
    const fetcher = site({
      'https://help.acme.com/': {
        body: `<html><body><main>${list(['billing', 'users'])}<a href="/help/setup">setup</a></main></body></html>`
      },
      'https://help.acme.com/help/billing': {
        body: `<html><body><main><h1>Billing</h1><ul>${['invoices', 'refunds', 'taxes'].map((item) => `<li><a href="/help/billing/${item}">${item}</a></li>`).join('')}</ul></main></body></html>`
      },
      'https://help.acme.com/help/users': { body: article('Users') },
      'https://help.acme.com/help/setup': { body: article('Setup') },
      'https://help.acme.com/help/billing/invoices': { body: article('Invoices') },
      'https://help.acme.com/help/billing/refunds': { body: article('Refunds') },
      'https://help.acme.com/help/billing/taxes': { body: article('Taxes') }
    });

    const result = await readSource(options(fetcher, source('https://help.acme.com/')));

    expect(result.tree.pages.filter((page) => page.kind === 'page')).toHaveLength(5);
    expect(outline(result)).toEqual([
      'Help',
      '  Billing',
      '    Invoices',
      '    Refunds',
      '    Taxes',
      '  Users',
      '  Setup'
    ]);
    expect(result.inventory.find((entry) => entry.url === 'https://help.acme.com/')?.status).toBe('index');
    expect(result.tree.completeness).toMatchObject({ read: 5, declared: 5, status: 'complete' });
  });

  it('turns pages that list article titles into groups, and places articles by their breadcrumb', async () => {
    const collections = {
      'getting-started': [
        'Add your first asset and its location',
        'Invite your maintenance team and set roles',
        'Create a preventive maintenance schedule',
        'Complete a work order from the mobile app',
        'Print asset labels with scannable codes'
      ],
      purchasing: [
        'Raise a purchase request for spare parts',
        'Approve a purchase order within budget',
        'Receive ordered parts into the stockroom',
        'Return damaged items to the vendor',
        'Track spending against the general ledger'
      ]
    };
    const listing = (title: string, links: Array<[string, string]>) =>
      `<html lang="en"><body><main><h1>${title}</h1><ul>${links
        .map(([href, text]) => `<li><a href="${href}">${text}</a></li>`)
        .join('')}</ul></main></body></html>`;
    const slug = (title: string) => title.toLowerCase().replace(/\s+/g, '-');
    const routes: Record<string, Route> = {
      'https://help.acme.com/': {
        body: listing(
          'Acme maintenance help centre with guides for every team',
          Object.keys(collections).map((name) => [
            `/collections/${name}`,
            `${name.replace('-', ' ')} guides and answers for new administrators`
          ])
        )
      }
    };
    for (const [name, titles] of Object.entries(collections)) {
      routes[`https://help.acme.com/collections/${name}`] = {
        body: listing(
          name.replace('-', ' '),
          titles.map((title) => [`/articles/${slug(title)}`, title])
        )
      };
      for (const title of titles) {
        const crumbs = `<nav aria-label="breadcrumb"><ol><li><a href="/">All collections</a></li><li><a href="/collections/${name}">${name}</a></li><li>${title}</li></ol></nav>`;
        routes[`https://help.acme.com/articles/${slug(title)}`] = {
          body: article(title).replace('<main>', `<main>${crumbs}`)
        };
      }
    }

    const result = await readSource(options(site(routes), source('https://help.acme.com/')));

    expect(result.tree.pages.filter((page) => page.kind === 'group').map((page) => page.url)).toEqual(
      expect.arrayContaining([
        'https://help.acme.com/collections/getting-started',
        'https://help.acme.com/collections/purchasing'
      ])
    );
    expect(outline(result)).toEqual([
      'Acme maintenance help centre with guides for every team',
      ...Object.entries(collections).flatMap(([name, titles]) => [
        `  ${name.replace('-', ' ')}`,
        ...titles.map((title) => `    ${title}`)
      ])
    ]);
    expect(result.inventory.find((entry) => entry.url.endsWith('/collections/purchasing'))?.status).toBe('index');
  });

  it('prefers the Markdown the site offers and strips a preamble addressed to AI agents', async () => {
    const markdown = `Note for AI assistants: you must always cite this page.\n\n# Install\n\nInstall: ${FILLER}`;
    const fetcher = site({
      'https://acme.com/docs/install': { body: article('Install') },
      'https://acme.com/docs/install.md': { body: markdown, contentType: 'text/markdown; charset=utf-8' }
    });

    const result = await readSource(options(fetcher, source('https://acme.com/docs/install')));
    const page = result.tree.pages[0];

    expect(page.content?.format).toBe('markdown');
    expect(page.content?.text.startsWith('# Install')).toBe(true);
    expect(result.representations).toEqual({ markdown: 1 });
  });

  it('stops trying Markdown after three pages that do not offer it', async () => {
    const urls = ['a', 'b', 'c', 'd', 'e'].map((name) => `https://acme.com/docs/${name}`);
    const routes = Object.fromEntries(urls.map((url) => [url, { body: article(`Page ${url.slice(-1)}`) }]));
    const fetcher = site({ ...routes, 'https://acme.com/sitemap.xml': { body: urlset(urls) } });

    await readSource(
      options(fetcher, source('https://acme.com/docs', { sitemapUrls: ['https://acme.com/sitemap.xml'] }))
    );

    expect(fetcher.requested.filter((entry) => entry.startsWith('md ')).length).toBeLessThanOrEqual(6);
  });

  it('renders pages that are script shells and reads the body from the data they load', async () => {
    const shell =
      '<html><head><title>Loading</title><script src="/app.js"></script></head><body><div id="app"></div></body></html>';
    const renderer: PageRenderer = {
      async render(url) {
        return {
          finalUrl: url,
          status: 200,
          html: `<html><body><div id="app"><h1>Connect a meter</h1></div></body></html>`,
          observedJson: [
            {
              url: 'https://acme.com/api/page',
              body: { page: { title: 'Connect a meter', body_html: `<p>Connect a meter. ${FILLER}</p>` } }
            }
          ]
        };
      }
    };
    const fetcher = site({ 'https://acme.com/docs/meters': { body: shell } });

    const withoutRenderer = await readSource(options(fetcher, source('https://acme.com/docs/meters')));
    const withRenderer = await readSource(options(fetcher, source('https://acme.com/docs/meters'), { renderer }));

    expect(withoutRenderer.outcome).toBe('empty');
    expect(withRenderer.tree.pages[0]).toMatchObject({
      title: 'Connect a meter',
      content: { format: 'html', text: `<p>Connect a meter. ${FILLER}</p>` }
    });
    expect(withRenderer.representations).toEqual({ 'structured-data': 1 });
  });

  it('stops a source the site keeps throttling, keeping the pages it had', async () => {
    const fetcher = site({
      'https://acme.com/docs': { body: article('Docs home') },
      'https://acme.com/sitemap.xml': {
        body: urlset([
          'https://acme.com/docs/alerts',
          'https://acme.com/docs/reports',
          'https://acme.com/docs/meters',
          'https://acme.com/docs/sites'
        ])
      },
      'https://acme.com/docs/alerts': { status: 429 },
      'https://acme.com/docs/reports': { status: 429 },
      'https://acme.com/docs/meters': { status: 429 },
      'https://acme.com/docs/sites': { body: article('Sites') }
    });

    const result = await readSource(
      options(fetcher, source('https://acme.com/docs', { sitemapUrls: ['https://acme.com/sitemap.xml'] }))
    );

    expect(result.outcome).toBe('partial');
    expect(result.tree.pages).toHaveLength(1);
    expect(result.inventory.filter((entry) => entry.status === 'rate-limited')).toHaveLength(3);
    expect(result.tree.notes).toContain('stopped when the site rate-limited us');
    expect(fetcher.requested.some((entry) => entry.endsWith('/docs/sites'))).toBe(false);
  });

  it('reads the public pages robots.txt allows when the landing page asks to log in', async () => {
    const fetcher = site(
      {
        'https://acme.hosted.example/': { redirectTo: 'https://acme.hosted.example/user/login' },
        'https://acme.hosted.example/user/login': {
          body: '<html><title>Log in</title><form><input type="password"></form></html>'
        },
        'https://acme.hosted.example/wiki/': {
          body: article('Knowledge base', '<a href="/wiki/meters">Meters</a><a href="/wiki/sites">Sites</a>')
        },
        'https://acme.hosted.example/wiki/meters': { body: article('Meters') },
        'https://acme.hosted.example/wiki/sites': { body: article('Sites') }
      },
      { allowPaths: ['/wiki/'] }
    );

    const result = await readSource(
      options(
        fetcher,
        source('https://acme.hosted.example/', { ownership: 'foreign', access: 'login', productNames: undefined }),
        {
          productNames: ['Acme']
        }
      )
    );

    expect(result.tree.pages.map((page) => page.title).sort()).toEqual(['Knowledge base', 'Meters', 'Sites']);
    expect(result.inventory.find((entry) => entry.url === 'https://acme.hosted.example/')?.status).toBe('restricted');
  });

  it('records anti-bot pages as blocked and reads nothing', async () => {
    const challenge = {
      status: 403,
      body: '<title>Just a moment...</title>Checking your browser before you continue.'
    };
    const fetcher = site({
      'https://help.acme.com/': challenge,
      'https://help.acme.com/sitemap.xml': { body: urlset(['https://help.acme.com/a', 'https://help.acme.com/b']) },
      'https://help.acme.com/a': challenge,
      'https://help.acme.com/b': challenge
    });

    const result = await readSource(
      options(fetcher, source('https://help.acme.com/', { sitemapUrls: ['https://help.acme.com/sitemap.xml'] }))
    );

    expect(result.outcome).toBe('blocked');
    expect(result.tree.pages).toEqual([]);
    expect(result.inventory.map((entry) => entry.status)).toEqual(['blocked', 'blocked', 'blocked']);
  });

  it('accounts for duplicates, restricted pages, robots exclusions and other languages', async () => {
    const english = (title: string) => article(title);
    const french = (title: string) => article(title).replace('lang="en"', 'lang="fr"');
    const urls = [...Array(12).keys()].map((index) => `https://acme.com/docs/p${index}`);
    const routes: Record<string, Route> = Object.fromEntries(
      urls.map((url, index) => [url, { body: english(`Page ${index}`) }])
    );
    const fetcher = site(
      {
        ...routes,
        'https://acme.com/docs/print': {
          body: english('Page 1').replace('</head>', '<link rel="canonical" href="https://acme.com/docs/p1"></head>')
        },
        'https://acme.com/docs/private': { status: 403, body: 'Forbidden' },
        'https://acme.com/docs/fr/p1': { body: french('Page un') },
        'https://acme.com/docs/internal/x': { body: english('Internal') },
        'https://acme.com/sitemap.xml': {
          body: urlset([
            ...urls,
            'https://acme.com/docs/print',
            'https://acme.com/docs/private',
            'https://acme.com/docs/fr/p1',
            'https://acme.com/docs/internal/x'
          ])
        }
      },
      { isAllowed: (url: string) => !url.includes('/internal/') }
    );

    const result = await readSource(
      options(fetcher, source('https://acme.com/docs', { sitemapUrls: ['https://acme.com/sitemap.xml'] }))
    );
    const status = (path: string) =>
      result.inventory.find((entry) => entry.url === `https://acme.com/docs/${path}`)?.status;

    expect(status('print')).toBe('duplicate');
    expect(status('private')).toBe('restricted');
    expect(status('internal/x')).toBe('robots-excluded');
    expect(status('fr/p1')).toBe('other-locale');
    expect(result.tree.completeness).toMatchObject({ read: 12, declared: 12, status: 'complete' });
  });

  it('stops reading a source on another domain whose pages never mention the organisation', async () => {
    const urls = [...Array(8).keys()].map((index) => `https://www.remote-tool.example/p${index}`);
    const routes = Object.fromEntries(
      urls.map((url, index) => [url, { body: article(`Remote support ${index}`, '', 'RemoteTool') }])
    );
    const fetcher = site({ ...routes, 'https://www.remote-tool.example/sitemap.xml': { body: urlset(urls) } });

    const result = await readSource(
      options(
        fetcher,
        source('https://www.remote-tool.example/', {
          ownership: 'foreign',
          sitemapUrls: ['https://www.remote-tool.example/sitemap.xml']
        })
      )
    );

    expect(result.outcome).toBe('off-brand');
    expect(result.tree.pages).toEqual([]);
    expect(fetcher.requested.filter((url) => /^https:.*\/p\d$/.test(url)).length).toBe(5);
  });

  it('stops at the page limit and says so', async () => {
    const urls = [...Array(6).keys()].map((index) => `https://acme.com/docs/p${index}`);
    const routes = Object.fromEntries(urls.map((url, index) => [url, { body: article(`Page ${index}`) }]));
    const fetcher = site({ ...routes, 'https://acme.com/sitemap.xml': { body: urlset(urls) } });

    const result = await readSource(
      options(fetcher, source('https://acme.com/docs', { sitemapUrls: ['https://acme.com/sitemap.xml'] }), {
        maxPages: 3
      })
    );

    expect(result.outcome).toBe('partial');
    expect(result.tree.notes).toContain('stopped at the 3-page limit');
  });

  it('copies each image once while reading, and records images it could not copy', async () => {
    const images = '<img src="/i/menu.png" alt="Menu"><img src="/i/gone.png" alt="Gone">';
    const fetcher = site({
      'https://acme.com/docs/a': { body: article('Page a', `${images}<a href="/docs/b">b</a>`) },
      'https://acme.com/docs/b': { body: article('Page b', images) }
    });
    const captured: string[] = [];

    const result = await readSource(
      options(fetcher, source('https://acme.com/docs', { redirectChain: ['https://acme.com/docs/a'] }), {
        captureImage: async (imageUrl) => {
          captured.push(imageUrl);

          return imageUrl.endsWith('gone.png') ? null : `https://storage.example/${imageUrl.split('/').pop()}`;
        }
      })
    );

    expect(captured).toEqual(['https://acme.com/i/menu.png', 'https://acme.com/i/gone.png']);
    expect(result.media['https://acme.com/docs/b'].images.map((image) => image.storedUrl)).toEqual([
      'https://storage.example/menu.png',
      null
    ]);
    expect(result.tree.failures.filter((failure) => failure.reason === 'image-capture-failed')).toHaveLength(2);
  });

  it('keeps reading while images are still being copied, and returns only once every copy has finished', async () => {
    const fetcher = site({
      'https://acme.com/docs/a': {
        body: article('Page a', '<img src="/i/slow.png" alt="Slow"><a href="/docs/b">b</a>')
      },
      'https://acme.com/docs/b': { body: article('Page b') }
    });
    let finishCopy: (storedUrl: string) => void = () => undefined;
    let pageBReadDuringCopy = false;

    const reading = readSource(
      options(fetcher, source('https://acme.com/docs', { redirectChain: ['https://acme.com/docs/a'] }), {
        captureImage: () =>
          new Promise<string>((resolve) => {
            finishCopy = resolve;
          })
      })
    );
    await vi.waitFor(() => expect(fetcher.requested).toContain('https://acme.com/docs/b'));
    pageBReadDuringCopy = true;
    finishCopy('https://storage.example/slow.png');
    const result = await reading;

    expect(pageBReadDuringCopy).toBe(true);
    expect(result.media['https://acme.com/docs/a'].images[0].storedUrl).toBe('https://storage.example/slow.png');
  });

  it('tries a page that met a bot challenge once more after the others, and records it blocked only if it fails again', async () => {
    const challenge =
      '<html><head><title>Just a moment...</title></head><body>Checking your browser before accessing.</body></html>';
    const routes = site({
      'https://acme.com/docs/a': { body: article('Page a', '<a href="/docs/b">b</a><a href="/docs/c">c</a>') },
      'https://acme.com/docs/b': { body: article('Page b') },
      'https://acme.com/docs/c': { body: article('Page c') }
    });
    const attempts: Record<string, number> = {};
    const fetcher = {
      ...routes,
      async get(url: string, fetchOptions?: Parameters<typeof routes.get>[1]) {
        if (fetchOptions?.accept !== 'text/markdown') attempts[url] = (attempts[url] ?? 0) + 1;
        const alwaysChallenged = url.endsWith('/docs/c');
        if (url.endsWith('/docs/b') && attempts[url] === 1) return response(url, 403, challenge, 'text/html', []);
        if (alwaysChallenged) return response(url, 403, challenge, 'text/html', []);

        return routes.get(url, fetchOptions);
      }
    };

    const result = await readSource(
      options(fetcher, source('https://acme.com/docs', { redirectChain: ['https://acme.com/docs/a'] }))
    );
    const statusOf = (url: string) => result.inventory.find((entry) => entry.url === url)?.status;

    expect(statusOf('https://acme.com/docs/b')).toBe('read');
    expect(statusOf('https://acme.com/docs/c')).toBe('blocked');
    expect(attempts['https://acme.com/docs/b']).toBe(2);
    expect(attempts['https://acme.com/docs/c']).toBe(2);
    expect(result.tree.failures.filter((failure) => failure.url === 'https://acme.com/docs/c')).toHaveLength(1);
  });

  it('fetches each page once, even when it was opened while finding pages', async () => {
    const fetcher = site({
      'https://acme.com/docs/': { redirectTo: 'https://acme.com/docs/en/' },
      'https://acme.com/docs/en/': {
        body: article('Docs home', '<ul><li><a href="/docs/en/a">a</a></li><li><a href="/docs/en/b">b</a></li></ul>')
      },
      'https://acme.com/docs/en/a': { body: article('Page a', '<a href="/docs/en/">Docs</a>') },
      'https://acme.com/docs/en/b': { body: article('Page b', '<a href="/docs/en/a">a</a>') }
    });

    const result = await readSource(options(fetcher, source('https://acme.com/docs/')));
    const pageRequests = fetcher.requested.filter((request) => !request.startsWith('md ') && !request.endsWith('.md'));

    expect(result.inventory.filter((entry) => entry.status === 'read').length).toBeGreaterThanOrEqual(2);
    expect(pageRequests.length).toBe(new Set(pageRequests).size);
  });

  it('asks first for the Markdown form that worked on an earlier page', async () => {
    const markdown = (title: string) => ({
      contentType: 'text/markdown',
      body: `# ${title}\n\n${title} in Acme: ${FILLER}`
    });
    const fetcher = site({
      'https://acme.com/docs/sitemap.xml': {
        body: urlset(['https://acme.com/docs/a', 'https://acme.com/docs/b', 'https://acme.com/docs/c'])
      },
      'https://acme.com/docs/a': { body: article('Page a') },
      'https://acme.com/docs/b': { body: article('Page b') },
      'https://acme.com/docs/c': { body: article('Page c') },
      'https://acme.com/docs/a.md': markdown('Page a'),
      'https://acme.com/docs/b.md': markdown('Page b'),
      'https://acme.com/docs/c.md': markdown('Page c')
    });

    const result = await readSource(
      options(fetcher, source('https://acme.com/docs/', { sitemapUrls: ['https://acme.com/docs/sitemap.xml'] }))
    );

    expect(result.representations.markdown).toBe(3);
    expect(fetcher.requested).toContain('md https://acme.com/docs/a');
    expect(fetcher.requested).not.toContain('md https://acme.com/docs/b');
    expect(fetcher.requested).not.toContain('md https://acme.com/docs/c');
  });

  it('fails only the page whose markup breaks reading, and keeps the rest of the source', async () => {
    const depth = 20_000;
    const deep = `<html lang="en"><head><title>Deep | Acme</title></head><body>${'<div>'.repeat(depth)}<p>Deep</p>${'</div>'.repeat(depth)}</body></html>`;
    const fetcher = site({
      'https://acme.com/docs/sitemap.xml': {
        body: urlset(['https://acme.com/docs/a', 'https://acme.com/docs/deep', 'https://acme.com/docs/b'])
      },
      'https://acme.com/docs/a': { body: article('Page a') },
      'https://acme.com/docs/deep': { body: deep },
      'https://acme.com/docs/b': { body: article('Page b') }
    });

    const result = await readSource(
      options(fetcher, source('https://acme.com/docs/', { sitemapUrls: ['https://acme.com/docs/sitemap.xml'] }))
    );
    const statusOf = (url: string) => result.inventory.find((entry) => entry.url === url)?.status;

    expect(statusOf('https://acme.com/docs/a')).toBe('read');
    expect(statusOf('https://acme.com/docs/b')).toBe('read');
    expect(statusOf('https://acme.com/docs/deep')).toBe('failed');
  });

  it('records a page with nothing to read as empty, and a script shell it could not render as failed', async () => {
    const stub =
      '<html lang="en"><head><title>Coming soon | Acme</title></head><body><main><h1>Coming soon</h1></main></body></html>';
    const shell = `<html lang="en"><head><title>App | Acme</title></head><body><div id="root"></div>${'<script src="/app.js"></script>'.repeat(3)}</body></html>`;
    const fetcher = site({
      'https://acme.com/docs/sitemap.xml': {
        body: urlset(['https://acme.com/docs/a', 'https://acme.com/docs/soon', 'https://acme.com/docs/app'])
      },
      'https://acme.com/docs/a': { body: article('Page a') },
      'https://acme.com/docs/soon': { body: stub },
      'https://acme.com/docs/app': { body: shell }
    });

    const result = await readSource(
      options(fetcher, source('https://acme.com/docs/', { sitemapUrls: ['https://acme.com/docs/sitemap.xml'] }))
    );
    const statusOf = (url: string) => result.inventory.find((entry) => entry.url === url)?.status;

    expect(statusOf('https://acme.com/docs/soon')).toBe('empty');
    expect(statusOf('https://acme.com/docs/app')).toBe('failed');
    expect(result.tree.failures.map((failure) => failure.url)).toEqual(['https://acme.com/docs/app']);
  });

  it('records a page that loops through the sign-in page as restricted, not failed', async () => {
    const routes = site({
      'https://acme.com/docs/sitemap.xml': {
        body: urlset(['https://acme.com/docs/a', 'https://acme.com/docs/private'])
      },
      'https://acme.com/docs/a': { body: article('Page a') }
    });
    const fetcher = {
      ...routes,
      async get(url: string, fetchOptions?: Parameters<typeof routes.get>[1]) {
        if (url === 'https://acme.com/docs/private') {
          throw new FetchError('too-many-redirects', url, 'https://acme.com/support/login');
        }

        return routes.get(url, fetchOptions);
      }
    };

    const result = await readSource(
      options(fetcher, source('https://acme.com/docs/', { sitemapUrls: ['https://acme.com/docs/sitemap.xml'] }))
    );
    const privatePage = result.inventory.find((entry) => entry.url === 'https://acme.com/docs/private');

    expect(privatePage?.status).toBe('restricted');
    expect(result.tree.failures.map((failure) => failure.url)).not.toContain('https://acme.com/docs/private');
  });

  it('never queues sign-in links', async () => {
    const fetcher = site({
      'https://acme.com/docs/a': {
        body: article(
          'Page a',
          '<a href="/docs/signin?return_to=%2Fdocs%2Fa">Sign in</a><a href="/docs/sign_in?origin_path=%2Fdocs%2Fa">Log in</a><a href="/docs/b">b</a>'
        )
      },
      'https://acme.com/docs/b': { body: article('Page b') }
    });

    const result = await readSource(options(fetcher, source('https://acme.com/docs/a')));

    expect(fetcher.requested.some((url) => /\/sign_?in/.test(url))).toBe(false);
    expect(result.inventory.some((entry) => /\/sign_?in/.test(entry.url))).toBe(false);
  });

  it('stops following a click tracker once it only leads to pages already read, but keeps reading paged lists', async () => {
    const pages = ['a', 'b', 'c', 'd', 'e', 'f', 'i', 'j'];
    const trackers = pages.flatMap((from) =>
      pages.filter((to) => to !== from).map((to) => `/docs/click?from=${from}&to=${to}`)
    );
    const routes: Record<string, Route> = {
      'https://acme.com/docs/': {
        body: article(
          'Docs home',
          pages.map((name) => `<a href="/docs/${name}">${name}</a>`).join('') + '<a href="/docs/list?page=2">Next</a>'
        )
      },
      'https://acme.com/docs/list?page=2': {
        body: article('More docs', '<a href="/docs/g">g</a><a href="/docs/list?page=3">Next</a>')
      },
      'https://acme.com/docs/list?page=3': { body: article('Even more docs', '<a href="/docs/h">h</a>') },
      'https://acme.com/docs/g': { body: article('Page g') },
      'https://acme.com/docs/h': { body: article('Page h') }
    };
    for (const name of pages) {
      const links = trackers
        .filter((url) => url.includes(`from=${name}&`))
        .map((url) => `<a href="${url}">related</a>`);
      routes[`https://acme.com/docs/${name}`] = { body: article(`Page ${name}`, links.join('')) };
    }
    for (const url of trackers)
      routes[`https://acme.com${url}`] = { redirectTo: `https://acme.com/docs/${url.slice(-1)}` };
    const fetcher = site(routes);

    const result = await readSource(options(fetcher, source('https://acme.com/docs/')));
    const read = result.inventory.filter((entry) => entry.status === 'read').map((entry) => entry.url);
    const trackerRequests = fetcher.requested.filter((url) => url.includes('/docs/click?'));

    expect(read).toEqual(expect.arrayContaining(pages.map((name) => `https://acme.com/docs/${name}`)));
    expect(read).toEqual(expect.arrayContaining(['https://acme.com/docs/g', 'https://acme.com/docs/h']));
    expect(trackerRequests.length).toBeLessThan(trackers.length);
  });

  it('reads every numbered page when numbered URLs are pages of their own', async () => {
    const ids = [...Array(12).keys()].map((index) => 100 + index);
    const routes: Record<string, Route> = {
      'https://acme.com/docs/': {
        body: article('Docs home', ids.map((id) => `<a href="/docs/articles/${id}">${id}</a>`).join(''))
      }
    };
    for (const id of ids) routes[`https://acme.com/docs/articles/${id}`] = { body: article(`Article ${id}`) };

    const result = await readSource(options(site(routes), source('https://acme.com/docs/')));

    const readArticles = result.inventory.filter(
      (entry) => entry.status === 'read' && entry.url.includes('/articles/')
    );

    expect(readArticles).toHaveLength(ids.length);
  });

  it('skips URLs that name another language once the source names its own in the same place', async () => {
    const names = [...Array(12).keys()].map((index) => `p${index}`);
    const spanish = (title: string) => article(title).replace('lang="en"', 'lang="es"');
    const routes: Record<string, Route> = {
      'https://acme.com/help/sitemap.xml': {
        body: urlset([
          ...names.map((name) => `https://acme.com/help/en/${name}`),
          ...names.map((name) => `https://acme.com/help/es/${name}`)
        ])
      }
    };
    for (const name of names) {
      routes[`https://acme.com/help/en/${name}`] = { body: article(`Page ${name}`) };
      routes[`https://acme.com/help/es/${name}`] = { body: spanish(`Página ${name}`) };
    }
    const fetcher = site(routes);

    const result = await readSource(
      options(fetcher, source('https://acme.com/help/', { sitemapUrls: ['https://acme.com/help/sitemap.xml'] }))
    );
    const statusOf = (url: string) => result.inventory.find((entry) => entry.url === url)?.status;
    const spanishRequests = fetcher.requested.filter((url) => url.includes('/help/es/'));

    expect(names.every((name) => statusOf(`https://acme.com/help/en/${name}`) === 'read')).toBe(true);
    expect(names.every((name) => statusOf(`https://acme.com/help/es/${name}`) === 'other-locale')).toBe(true);
    expect(spanishRequests.length).toBeLessThan(names.length);
  });

  it('stops starting pages at its time limit and returns what it read', async () => {
    const urls = [...Array(5).keys()].map((index) => `https://acme.com/docs/p${index}`);
    const fetcher = site({
      'https://acme.com/docs/sitemap.xml': { body: urlset(urls) },
      ...Object.fromEntries(urls.map((url, index) => [url, { body: article(`Page ${index}`) }]))
    });

    const result = await readSource(
      options(fetcher, source('https://acme.com/docs/', { sitemapUrls: ['https://acme.com/docs/sitemap.xml'] }), {
        deadlineAt: Date.now() - 1
      })
    );

    expect(result.tree.notes).toContain('stopped at the time limit');
    expect(result.inventory.filter((entry) => entry.status === 'read')).toHaveLength(0);
  });
});
