import * as cheerio from 'cheerio';

import { normalizePageUrl, type LlmsTxtOutline } from './inventory';

export const STRUCTURE_SIGNALS = [
  'page-data',
  'navigation',
  'index-page',
  'breadcrumb',
  'llms-txt',
  'url-path'
] as const;

export type StructureSignal = (typeof STRUCTURE_SIGNALS)[number];

export interface StructureEdge {
  /** A normalized page URL, or a group id starting with `group:`. */
  childId: string;
  parentId: string | null;
  position: number;
  signal: StructureSignal;
}

export interface StructureGroup {
  id: string;
  title: string;
  url: string | null;
}

export interface StructureResult {
  edges: StructureEdge[];
  groups: StructureGroup[];
}

export interface MergedStructure {
  edges: Map<string, StructureEdge>;
  groups: Map<string, StructureGroup>;
  /** Pages whose two strongest signals named different parents. */
  disagreements: string[];
}

type InScope = (url: string) => boolean;

const RANK: Record<StructureSignal, number> = {
  'page-data': 0,
  navigation: 1,
  'index-page': 2,
  breadcrumb: 3,
  'llms-txt': 4,
  'url-path': 5
};
const UNKNOWN_POSITION = Number.MAX_SAFE_INTEGER;
const MENU_SELECTOR = 'nav, aside, [role=navigation], [class*=sidebar], [class*=toc], [class*=menu]';
const MIN_MENU_LINKS = 3;
const MIN_MENU_IN_SCOPE_SHARE = 0.6;
const MIN_INDEX_LINKS = 3;
const MIN_INDEX_LINK_SHARE = 0.5;

function emptyResult(): StructureResult {
  return { edges: [], groups: [] };
}

function resolve(href: string | undefined, baseUrl: string): string | null {
  if (!href || /^(javascript|mailto|tel|data):/i.test(href)) return null;

  try {
    const url = new URL(href, baseUrl);

    return url.protocol === 'http:' || url.protocol === 'https:' ? normalizePageUrl(url.href) : null;
  } catch {
    return null;
  }
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function groupId(parentId: string | null, title: string): string {
  return `group:${parentId ?? 'root'}/${title}`;
}

/**
 * The tree a navigation menu or table of contents shows on a page: nested lists of in-scope links, in menu order.
 * List items without a link but with children become groups.
 */
export function navigationTree(html: string, pageUrl: string, isInScope: InScope): StructureResult {
  const $ = cheerio.load(html);
  const result = emptyResult();

  const menus = $(MENU_SELECTOR)
    .toArray()
    .map((menu) => {
      const links = $(menu)
        .find('a[href]')
        .toArray()
        .map((link) => resolve($(link).attr('href'), pageUrl));
      const inScope = links.filter((url): url is string => url !== null && isInScope(url));

      return { menu, inScope: inScope.length, total: links.length };
    })
    .filter(
      ({ inScope, total }) => inScope >= MIN_MENU_LINKS && inScope / Math.max(total, 1) >= MIN_MENU_IN_SCOPE_SHARE
    )
    .sort((left, right) => right.inScope - left.inScope);

  const menu = menus[0]?.menu;
  if (!menu) return result;

  const topLists = $(menu)
    .find('ul, ol')
    .toArray()
    .filter((list) => $(list).parentsUntil(menu, 'ul, ol').length === 0);

  const walk = (list: Parameters<typeof $>[0], parentId: string | null) => {
    let position = 0;

    $(list)
      .children('li')
      .each((_, item) => {
        const nested = $(item).find('ul, ol').first();
        const anchor = $(item)
          .find('a[href]')
          .filter((__, link) => $(link).parentsUntil(item, 'ul, ol').length === 0)
          .first();
        const url = resolve(anchor.attr('href'), pageUrl);
        const ownText = cleanText($(item).clone().find('ul, ol').remove().end().text());
        const label = cleanText(anchor.text()) || ownText;
        let nodeId: string | null = null;

        if (url && isInScope(url)) {
          nodeId = url;
        } else if (!url && label && nested.length) {
          nodeId = groupId(parentId, label);
          result.groups.push({ id: nodeId, title: label, url: null });
        }

        if (nodeId) result.edges.push({ childId: nodeId, parentId, position: position++, signal: 'navigation' });

        $(item)
          .children('ul, ol')
          .add($(item).children().children('ul, ol'))
          .each((__, child) => walk(child, nodeId ?? parentId));
      });
  };

  for (const list of topLists) walk(list, null);

  return result;
}

/**
 * When a page's main content is mostly in-scope links, it is an index: its links are its children, in listed order.
 * A page already found to hold no content of its own is an index as soon as it lists one in-scope page (`withoutContent`):
 * small help centres have collections of one or two articles. Pagination links (`rel="next"`) are children too, so
 * their listings join the same parent through the next page.
 */
export function indexPageChildren(
  contentHtml: string,
  pageUrl: string,
  isInScope: InScope,
  withoutContent = false
): StructureEdge[] {
  const $ = cheerio.load(contentHtml);
  const text = cleanText($.root().text());
  const linkText = cleanText($('a[href]').text());
  const self = normalizePageUrl(pageUrl);
  const links = $('a[href]')
    .toArray()
    .map((link) => resolve($(link).attr('href'), pageUrl))
    .filter(
      (url, index, all): url is string => url !== null && url !== self && isInScope(url) && all.indexOf(url) === index
    );

  const pagePath = new URL(self).pathname.replace(/\/$/, '');
  const isAncestor = (url: string) => {
    const path = new URL(url).pathname.replace(/\/$/, '');

    return pagePath === path || pagePath.startsWith(`${path}/`);
  };
  const isIndex = withoutContent
    ? links.some((url) => !isAncestor(url))
    : links.length >= MIN_INDEX_LINKS && linkText.length / Math.max(text.length, 1) >= MIN_INDEX_LINK_SHARE;
  if (!isIndex) return [];

  return links
    .filter((url) => !withoutContent || !isAncestor(url))
    .map((childId, position) => ({ childId, parentId: self, position, signal: 'index-page' }));
}

interface Crumb {
  name: string;
  url: string | null;
}

function jsonLdCrumbs($: cheerio.CheerioAPI, pageUrl: string): Crumb[] {
  const crumbs: Crumb[] = [];

  $('script[type="application/ld+json"]').each((_, element) => {
    if (crumbs.length) return;

    try {
      const data: unknown = JSON.parse($(element).text());
      const nodes = (
        Array.isArray(data) ? data : [data, ...((data as { '@graph'?: unknown[] })?.['@graph'] ?? [])]
      ) as Array<Record<string, unknown>>;
      const list = nodes.find((node) => node?.['@type'] === 'BreadcrumbList');
      const items = (list?.itemListElement as Array<Record<string, unknown>> | undefined) ?? [];
      const ordered = [...items].sort((left, right) => Number(left.position ?? 0) - Number(right.position ?? 0));

      for (const item of ordered) {
        const target = item.item as string | { '@id'?: string; name?: string } | undefined;
        const href = typeof target === 'string' ? target : target?.['@id'];
        const name = String(item.name ?? (typeof target === 'object' ? target?.name : '') ?? '');
        crumbs.push({ name: cleanText(name), url: resolve(href, pageUrl) });
      }
    } catch {
      return;
    }
  });

  return crumbs;
}

function markupCrumbs($: cheerio.CheerioAPI, pageUrl: string): Crumb[] {
  const container = $('nav[aria-label*="breadcrumb" i], [class*=breadcrumb], [itemtype*="BreadcrumbList"]').first();
  if (!container.length) return [];

  const items = container.find('li').length ? container.find('li').toArray() : container.find('a').toArray();

  return items
    .map((item) => {
      const link = $(item).is('a') ? $(item) : $(item).find('a[href]').first();

      return { name: cleanText($(item).text()), url: resolve(link.attr('href'), pageUrl) };
    })
    .filter((crumb) => crumb.name);
}

/** Ancestors from breadcrumbs (schema.org `BreadcrumbList` first, then breadcrumb markup), as a chain of edges. */
export function breadcrumbEdges(html: string, pageUrl: string): StructureResult {
  const $ = cheerio.load(html);
  const self = normalizePageUrl(pageUrl);
  const found = jsonLdCrumbs($, pageUrl);
  const crumbs = (found.length ? found : markupCrumbs($, pageUrl)).filter((crumb) => crumb.url !== self);
  const result = emptyResult();
  let parentId: string | null = null;

  for (const crumb of crumbs) {
    const id: string = crumb.url ?? groupId(parentId, crumb.name);
    if (!crumb.url) result.groups.push({ id, title: crumb.name, url: null });
    result.edges.push({ childId: id, parentId, position: UNKNOWN_POSITION, signal: 'breadcrumb' });
    parentId = id;
  }

  if (crumbs.length) result.edges.push({ childId: self, parentId, position: UNKNOWN_POSITION, signal: 'breadcrumb' });

  return result;
}

const TITLE_KEYS = ['title', 'name', 'label', 'heading', 'text'];
const URL_KEYS = ['url', 'href', 'link', 'path', 'slug', 'permalink', 'html_url', 'htmlUrl'];

function stringField(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value;
  }

  return null;
}

/**
 * A tree hidden in page data: arrays whose items carry a title and a URL of a known page. The array order is the
 * position; the object that holds the array is the parent (a page when it has a known URL, else a group).
 * Schema-free: it matches values against known page URLs, not key names alone.
 */
export function pageDataTree(
  blobs: unknown[],
  pageUrl: string,
  isKnownPage: (url: string) => boolean
): StructureResult {
  const result = emptyResult();
  const seen = new Set<unknown>();

  const nodeIdOf = (record: Record<string, unknown>, parentId: string | null): string | null => {
    const url = resolve(stringField(record, URL_KEYS) ?? undefined, pageUrl);
    if (url && isKnownPage(url)) return url;

    const title = stringField(record, TITLE_KEYS);
    if (!title) return null;

    const id = groupId(parentId, title);
    if (!result.groups.some((group) => group.id === id)) result.groups.push({ id, title, url: null });

    return id;
  };

  const treeArrays = new Map<unknown[], boolean>();
  const records = (array: unknown[]) =>
    array.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object' && !Array.isArray(item));
  const isPageItem = (item: Record<string, unknown>) => {
    const url = resolve(stringField(item, URL_KEYS) ?? undefined, pageUrl);

    return url !== null && isKnownPage(url) && stringField(item, TITLE_KEYS) !== null;
  };
  const isTreeArray = (array: unknown[], depth = 0): boolean => {
    const cached = treeArrays.get(array);
    if (cached !== undefined) return cached;
    if (depth > 8) return false;

    treeArrays.set(array, false);
    const items = records(array);
    const nodes = items.filter(
      (item) =>
        isPageItem(item) ||
        (stringField(item, TITLE_KEYS) !== null &&
          Object.values(item).some((child) => Array.isArray(child) && isTreeArray(child, depth + 1)))
    );
    const result = nodes.length >= 2 || (nodes.length === 1 && items.length <= 3);
    treeArrays.set(array, result);

    return result;
  };

  const visit = (value: unknown, ownerId: string | null): void => {
    if (!value || typeof value !== 'object' || seen.has(value)) return;
    seen.add(value);

    if (Array.isArray(value)) {
      if (isTreeArray(value)) {
        records(value).forEach((item, position) => {
          const id = nodeIdOf(item, ownerId);
          if (id) result.edges.push({ childId: id, parentId: ownerId, position, signal: 'page-data' });
          for (const child of Object.values(item)) visit(child, id ?? ownerId);
        });

        return;
      }

      for (const item of value) visit(item, ownerId);

      return;
    }

    for (const child of Object.values(value as Record<string, unknown>)) visit(child, ownerId);
  };

  for (const blob of blobs) visit(blob, null);

  return pageItemsOnly(result);
}

function pageItemsOnly(result: StructureResult): StructureResult {
  const usedGroups = new Set(result.edges.map((edge) => edge.parentId).filter((id): id is string => !!id));
  const groups = result.groups.filter((group) => usedGroups.has(group.id));
  const groupIds = new Set(groups.map((group) => group.id));
  const edges = result.edges.filter((edge) => !edge.childId.startsWith('group:') || groupIds.has(edge.childId));

  return { edges, groups };
}

/** Groups from llms.txt headings, with their in-scope links as children in listed order. */
export function llmsTxtStructure(outline: LlmsTxtOutline, isInScope: InScope): StructureResult {
  const result = emptyResult();

  outline.sections.forEach((section, sectionPosition) => {
    const links = section.links.filter((link) => isInScope(link.url));
    if (!links.length) return;

    const parentId = section.heading ? groupId(null, section.heading) : null;
    if (parentId) {
      result.groups.push({ id: parentId, title: section.heading, url: null });
      result.edges.push({ childId: parentId, parentId: null, position: sectionPosition, signal: 'llms-txt' });
    }

    links.forEach((link, position) => {
      result.edges.push({ childId: normalizePageUrl(link.url), parentId, position, signal: 'llms-txt' });
    });
  });

  return result;
}

/** The last resort: each page's parent is the nearest ancestor path that is a known page; position is listing order. */
export function urlPathStructure(pages: Array<{ url: string; listedAt: number }>): StructureResult {
  const known = new Set(pages.map((page) => normalizePageUrl(page.url)));
  const edges = pages.map((page): StructureEdge => {
    const url = new URL(normalizePageUrl(page.url));
    const segments = url.pathname.split('/').filter(Boolean);
    let parentId: string | null = null;

    for (let depth = segments.length - 1; depth >= 0 && !parentId; depth -= 1) {
      const candidate = normalizePageUrl(`${url.origin}/${segments.slice(0, depth).join('/')}`);
      if (candidate !== url.href && known.has(candidate)) parentId = candidate;
    }

    return { childId: url.href, parentId, position: page.listedAt, signal: 'url-path' };
  });

  return { edges, groups: [] };
}

/** Keeps the strongest signal's edge for every node, and records pages whose strongest signals disagree. */
export function mergeStructure(results: StructureResult[]): MergedStructure {
  const edges = new Map<string, StructureEdge>();
  const groups = new Map<string, StructureGroup>();
  const disagreements = new Set<string>();

  for (const result of results) {
    for (const group of result.groups) if (!groups.has(group.id)) groups.set(group.id, group);

    for (const edge of result.edges) {
      if (edge.childId === edge.parentId) continue;

      const current = edges.get(edge.childId);
      if (!current) {
        edges.set(edge.childId, edge);
        continue;
      }

      const stronger = RANK[edge.signal] < RANK[current.signal];
      const fillsPosition = RANK[edge.signal] === RANK[current.signal] && current.position === UNKNOWN_POSITION;
      if (stronger && current.parentId !== edge.parentId) disagreements.add(edge.childId);
      if (stronger || fillsPosition) edges.set(edge.childId, edge);
    }
  }

  return { edges, groups, disagreements: [...disagreements] };
}
