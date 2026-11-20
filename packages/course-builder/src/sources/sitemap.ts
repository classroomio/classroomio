import type { Fetcher } from '../fetch/types';
import type { PageFailure } from './types';

export interface SitemapReadOptions {
  fetcher: Fetcher;
  maxUrls?: number;
  maxFiles?: number;
  /** Skip child sitemaps of an index, e.g. other locales. */
  includeChild?: (childSitemapUrl: string) => boolean;
}

export interface SitemapRead {
  urls: string[];
  failures: PageFailure[];
}

const LOC = /<loc>\s*(?:<!\[CDATA\[)?\s*([^<\]]+?)\s*(?:\]\]>)?\s*<\/loc>/gi;

function decodeXml(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

export function parseSitemap(xml: string): { kind: 'index' | 'urlset' | 'unknown'; locations: string[] } {
  const head = xml.slice(0, 4096);
  const kind = /<sitemapindex\b/i.test(head) ? 'index' : /<urlset\b/i.test(head) ? 'urlset' : 'unknown';
  const locations = [...xml.matchAll(LOC)].map((match) => decodeXml(match[1]));

  return { kind, locations };
}

/** Every page URL listed in a sitemap, following sitemap indexes. Unreadable or gzipped files are recorded as failures. */
export async function readSitemapUrls(sitemapUrl: string, options: SitemapReadOptions): Promise<SitemapRead> {
  const maxUrls = options.maxUrls ?? 50_000;
  const maxFiles = options.maxFiles ?? 50;
  const urls = new Set<string>();
  const failures: PageFailure[] = [];
  const queue = [sitemapUrl];
  const seen = new Set<string>();

  while (queue.length && seen.size < maxFiles && urls.size < maxUrls) {
    const current = queue.shift()!;
    if (seen.has(current)) continue;
    seen.add(current);

    if (/\.gz($|\?)/i.test(current)) {
      failures.push({ url: current, reason: 'gzipped-sitemap' });
      continue;
    }

    try {
      const response = await options.fetcher.get(current, {
        accept: 'application/xml,text/xml',
        maxBytes: 50 * 1024 * 1024
      });
      if (response.status !== 200) {
        failures.push({ url: current, reason: `status-${response.status}` });
        continue;
      }

      const sitemap = parseSitemap(response.body);
      if (sitemap.kind === 'index') {
        queue.push(...sitemap.locations.filter((child) => options.includeChild?.(child) ?? true));
        continue;
      }

      for (const location of sitemap.locations) {
        if (urls.size >= maxUrls) break;
        urls.add(location);
      }
    } catch (error) {
      failures.push({ url: current, reason: String(error) });
    }
  }

  return { urls: [...urls], failures };
}
