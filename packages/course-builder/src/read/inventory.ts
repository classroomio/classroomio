import type { PageLink } from '../discover/homepage';
import type { InventoryEntry, InventoryOrigin, InventoryStatus } from './types';

const TRACKING_PARAMETER = /^(utm_|ref$|source$|fbclid$|gclid$|_gl$|mc_cid$|mc_eid$|hsa_)/i;
const NOT_PUBLIC: ReadonlySet<InventoryStatus> = new Set([
  'restricted',
  'out-of-scope',
  'other-locale',
  'duplicate',
  'robots-excluded',
  'not-found',
  'index',
  'empty'
]);

/** One spelling per page: no fragment, no tracking parameters, no trailing slash except on the root. */
export function normalizePageUrl(url: string): string {
  const parsed = new URL(url);
  parsed.hash = '';
  for (const name of [...parsed.searchParams.keys()]) {
    if (TRACKING_PARAMETER.test(name)) parsed.searchParams.delete(name);
  }
  if (parsed.pathname !== '/' && parsed.pathname.endsWith('/')) parsed.pathname = parsed.pathname.slice(0, -1);

  return parsed.href;
}

/** Every page a source is known to have, with how each was learned and what became of it. */
export class Inventory {
  private readonly entries = new Map<string, InventoryEntry>();
  private readonly pending: string[] = [];

  add(url: string, origin: InventoryOrigin): InventoryEntry {
    const key = normalizePageUrl(url);
    const existing = this.entries.get(key);
    if (existing) {
      existing.origins.add(origin);

      return existing;
    }

    const entry: InventoryEntry = {
      key,
      url,
      origins: new Set([origin]),
      status: 'pending',
      listedAt: this.entries.size
    };
    this.entries.set(key, entry);
    this.pending.push(key);

    return entry;
  }

  mark(url: string, status: InventoryStatus, detail?: string): void {
    const entry = this.entries.get(normalizePageUrl(url)) ?? this.add(url, 'link');
    entry.status = status;
    if (detail) entry.detail = detail;
  }

  /** Queues a page again, after every page already waiting. */
  retry(url: string): void {
    const entry = this.entries.get(normalizePageUrl(url));
    if (!entry) return;

    entry.status = 'pending';
    this.pending.push(entry.key);
  }

  get(url: string): InventoryEntry | undefined {
    return this.entries.get(normalizePageUrl(url));
  }

  has(url: string): boolean {
    return this.entries.has(normalizePageUrl(url));
  }

  nextPending(): InventoryEntry | undefined {
    while (this.pending.length) {
      const entry = this.entries.get(this.pending.shift()!);
      if (entry?.status === 'pending') return entry;
    }

    return undefined;
  }

  all(): InventoryEntry[] {
    return [...this.entries.values()];
  }

  /**
   * Pages a complete reader should have read: everything not restricted, missing, excluded, a duplicate, an index or
   * empty.
   */
  publicCount(): number {
    return this.all().filter((entry) => !NOT_PUBLIC.has(entry.status)).length;
  }

  countBy(status: InventoryStatus): number {
    return this.all().filter((entry) => entry.status === status).length;
  }
}

export interface LlmsTxtOutline {
  title: string | null;
  sections: Array<{ heading: string; links: Array<PageLink & { note: string }> }>;
  links: PageLink[];
}

/** The headings and links of an llms.txt file, in order. */
export function parseLlmsTxt(text: string): LlmsTxtOutline {
  const sections: LlmsTxtOutline['sections'] = [];
  let title: string | null = null;
  let current: LlmsTxtOutline['sections'][number] = { heading: '', links: [] };

  for (const line of text.split('\n')) {
    const topHeading = line.match(/^#\s+(.+)/);
    if (topHeading && title === null) {
      title = topHeading[1].trim();
      continue;
    }

    const heading = line.match(/^#{2,6}\s+(.+)/);
    if (heading) {
      if (current.links.length || current.heading) sections.push(current);
      current = { heading: heading[1].trim(), links: [] };
      continue;
    }

    const link = line.match(/^\s*[-*]\s+\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)(?::\s*(.*))?/);
    if (link) current.links.push({ text: link[1], url: link[2], note: link[3] ?? '' });
  }
  if (current.links.length || current.heading) sections.push(current);

  return { title, sections, links: sections.flatMap((section) => section.links) };
}
