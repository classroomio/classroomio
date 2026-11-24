import { describe, expect, it } from 'vitest';

import type { FetchResponse, Fetcher } from '../fetch/types';
import { parseSitemap, readSitemapUrls } from './sitemap';
import { arrangePages, assessCompleteness, layoutTree, type PageFailure, type TreeEntry } from './types';

function xmlFetcher(routes: Record<string, string>): Fetcher {
  return {
    async get(url): Promise<FetchResponse> {
      const body = routes[url];

      return {
        url,
        status: body === undefined ? 404 : 200,
        body: body ?? '',
        headers: { 'content-type': 'application/xml' },
        redirects: [],
        truncated: false
      };
    }
  };
}

function urlset(urls: string[]): string {
  return `<?xml version="1.0"?><urlset>${urls.map((url) => `<url><loc>${url}</loc></url>`).join('')}</urlset>`;
}

function entry(id: string, title: string, parentId: string | null, position: number | null, text?: string): TreeEntry {
  return {
    id,
    url: `https://acme.com/${id}`,
    title,
    kind: text === undefined ? 'group' : 'page',
    summary: null,
    labels: [],
    parentId,
    position,
    updatedAt: null,
    locale: null,
    content: text ? { format: 'html', text } : null
  };
}

describe('sitemaps', () => {
  it('follows sitemap indexes and skips children the caller excludes', async () => {
    const fetcher = xmlFetcher({
      'https://x.com/sitemap.xml':
        '<sitemapindex><sitemap><loc>https://x.com/en.xml</loc></sitemap><sitemap><loc>https://x.com/fr.xml</loc></sitemap></sitemapindex>',
      'https://x.com/en.xml': urlset(['https://x.com/en/a', 'https://x.com/en/b?x=1&amp;y=2']),
      'https://x.com/fr.xml': urlset(['https://x.com/fr/a'])
    });

    const result = await readSitemapUrls('https://x.com/sitemap.xml', {
      fetcher,
      includeChild: (child) => !child.endsWith('/fr.xml')
    });

    expect(result.urls).toEqual(['https://x.com/en/a', 'https://x.com/en/b?x=1&y=2']);
    expect(parseSitemap('<urlset><url><loc><![CDATA[https://x.com/c]]></loc></url></urlset>').locations).toEqual([
      'https://x.com/c'
    ]);
  });
});

describe('page trees', () => {
  it('lays pages out parents first, siblings by position, and records pages without content', () => {
    const failures: PageFailure[] = [];
    const { pages, readCount } = arrangePages(
      [
        entry('reports', 'Reports', 'home', 2),
        entry('home', 'Home', null, 0),
        entry('dashboards', 'Dashboards', 'home', 1),
        entry('custom', 'Custom dashboards', 'dashboards', 0, '<p>Custom</p>'),
        entry('schedules', 'Schedules', 'reports', 0, '<p>Schedules</p>'),
        { ...entry('empty', 'Empty', 'reports', 1, ''), kind: 'page' }
      ],
      failures
    );

    expect(pages.map((page) => `${'  '.repeat(page.depth)}${page.title}`)).toEqual([
      'Home',
      '  Dashboards',
      '    Custom dashboards',
      '  Reports',
      '    Schedules',
      '    Empty'
    ]);
    expect(pages.find((page) => page.id === 'schedules')?.path).toEqual(['Home', 'Reports']);
    expect(readCount).toBe(2);
    expect(failures).toEqual([{ id: 'empty', url: 'https://acme.com/empty', reason: 'body-missing' }]);
  });

  it('keeps nodes caught in a parent cycle instead of dropping them', () => {
    const layout = layoutTree([
      { id: 'a', parentId: 'b', position: 1, title: 'A' },
      { id: 'b', parentId: 'a', position: 2, title: 'B' }
    ]);

    expect(layout.size).toBe(2);
  });

  it('passes completeness at 98% of the declared inventory', () => {
    expect(assessCompleteness(98, 100, 'sitemap').status).toBe('complete');
    expect(assessCompleteness(97, 100, 'sitemap').status).toBe('partial');
    expect(assessCompleteness(10, null, null).status).toBe('unverified');
  });
});
