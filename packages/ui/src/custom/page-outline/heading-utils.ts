import type { PageOutlineItem, PageOutlineLevel } from './types';

const HEADING_RE = /<h([1-3])(\s[^>]*)?>([\s\S]*?)<\/h\1>/gi;

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function slugifyHeading(text: string): string {
  const slug = text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  return slug || 'section';
}

function uniqueId(base: string, used: Set<string>): string {
  let id = base;
  let suffix = 2;

  while (used.has(id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }

  used.add(id);

  return id;
}

function readExistingId(attrs: string): string | null {
  const match = /\bid\s*=\s*(["'])(.*?)\1/i.exec(attrs);
  const value = match?.[2]?.trim();

  return value ? value : null;
}

/**
 * Walk h1–h3 tags in an HTML fragment, assign unique ids, and return both
 * the rewritten HTML and the outline entries in document order.
 */
export function injectHeadingIds(html: string): { html: string; items: PageOutlineItem[] } {
  const used = new Set<string>();
  const items: PageOutlineItem[] = [];

  const nextHtml = html.replace(HEADING_RE, (_full, levelStr: string, rawAttrs: string | undefined, inner: string) => {
    const level = Number(levelStr) as PageOutlineLevel;
    const title = stripHtml(inner);

    if (!title) return _full;

    const attrs = rawAttrs ?? '';
    const existing = readExistingId(attrs);
    const id = existing ? uniqueId(existing, used) : uniqueId(slugifyHeading(title), used);

    items.push({ id, title, level });

    if (existing === id) {
      return _full;
    }

    const withoutId = attrs.replace(/\s*\bid\s*=\s*(["']).*?\1/i, '');

    return `<h${level}${withoutId} id="${id}">${inner}</h${level}>`;
  });

  return { html: nextHtml, items };
}

/** Prefix the page title as a level-1 entry when the body has section headings. */
export function withPageTitle(title: string, bodyItems: PageOutlineItem[]): PageOutlineItem[] {
  if (bodyItems.length === 0) return [];

  const used = new Set(bodyItems.map((item) => item.id));
  const id = uniqueId(slugifyHeading(title) || 'page-title', used);

  return [{ id, title, level: 1 }, ...bodyItems];
}

/** Build an outline from a page title plus named subsections (e.g. exercise questions). */
export function outlineFromSections(
  pageTitle: string,
  sections: Array<{ id: string; title: string }>
): PageOutlineItem[] {
  if (sections.length === 0) return [];

  const used = new Set<string>();
  const titleId = uniqueId(slugifyHeading(pageTitle) || 'page-title', used);
  const items: PageOutlineItem[] = [{ id: titleId, title: pageTitle, level: 1 }];

  for (const section of sections) {
    const base = section.id.trim() || slugifyHeading(section.title);
    const id = uniqueId(base || 'section', used);

    items.push({ id, title: section.title, level: 2 });
  }

  return items;
}
