export interface PageContent {
  format: 'html' | 'markdown';
  text: string;
}

export interface SourcePage {
  /** Unique within the tree. Group ids carry a prefix when the site numbers groups and pages separately. */
  id: string;
  url: string;
  title: string;
  /** A group (an index or listing page, a menu heading, a folder) organises pages and has no body of its own. */
  kind: 'page' | 'group';
  /** The site's own short description of the page, when it publishes one. */
  summary: string | null;
  /** Flags the site itself shows, e.g. `outdated` or `archived`. */
  labels: string[];
  parentId: string | null;
  /** Position among siblings in the order the site shows them. */
  position: number | null;
  /** Reading order across the whole tree: parents before children, siblings by position. */
  order: number;
  depth: number;
  /** Titles of the ancestors, root first. */
  path: string[];
  updatedAt: string | null;
  locale: string | null;
  content: PageContent | null;
}

export interface PageFailure {
  id?: string;
  url: string;
  reason: string;
}

export const COMPLETENESS_THRESHOLD = 0.98;

export interface CompletenessReport {
  /** How many public pages the site says exist, from its own inventories. */
  declared: number | null;
  declaredBy: 'sitemap' | 'site-index' | 'link-closure' | null;
  read: number;
  ratio: number | null;
  status: 'complete' | 'partial' | 'unverified';
}

export interface SourceTree {
  sourceUrl: string;
  /** Distinguishes trees read from one source, such as one per locale. */
  key: string;
  title: string;
  pages: SourcePage[];
  failures: PageFailure[];
  completeness: CompletenessReport;
  /** How the tree compares with the site's sitemap, when it has one. */
  sitemapCheck: SitemapCheck | null;
  notes: string[];
  readAt: string;
}

export interface SitemapCheck {
  sitemapPages: number;
  inTree: number;
  /** Listed in the sitemap but not public (401, 403 or 404). */
  restricted: number;
  /** Public pages that were only in the sitemap and were added to the tree. */
  recovered: number;
  /** Public pages listed in the sitemap that still could not be read. */
  missing: string[];
}

export function assessCompleteness(
  read: number,
  declared: number | null,
  declaredBy: CompletenessReport['declaredBy']
): CompletenessReport {
  if (declared === null || declared === 0) {
    return { declared, declaredBy: declared === null ? null : declaredBy, read, ratio: null, status: 'unverified' };
  }

  const ratio = read / declared;

  return { declared, declaredBy, read, ratio, status: ratio >= COMPLETENESS_THRESHOLD ? 'complete' : 'partial' };
}

interface TreeNode {
  id: string;
  parentId: string | null;
  position: number | null;
  title: string;
}

/**
 * Orders nodes into reading order: each parent before its children, siblings by position, then title. Nodes whose
 * parent is missing become roots. Returns order, depth and ancestor titles per node id.
 */
export function layoutTree(nodes: TreeNode[]): Map<string, { order: number; depth: number; path: string[] }> {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const children = new Map<string | null, TreeNode[]>();

  for (const node of nodes) {
    const parentKey = node.parentId && byId.has(node.parentId) ? node.parentId : null;
    const siblings = children.get(parentKey) ?? [];
    siblings.push(node);
    children.set(parentKey, siblings);
  }

  for (const siblings of children.values()) {
    siblings.sort(
      (left, right) =>
        (left.position ?? Number.MAX_SAFE_INTEGER) - (right.position ?? Number.MAX_SAFE_INTEGER) ||
        left.title.localeCompare(right.title)
    );
  }

  const layout = new Map<string, { order: number; depth: number; path: string[] }>();
  const visit = (root: TreeNode) => {
    const stack: Array<{ node: TreeNode; path: string[] }> = [{ node: root, path: [] }];

    while (stack.length) {
      const { node, path } = stack.pop()!;
      if (layout.has(node.id)) continue;

      layout.set(node.id, { order: layout.size, depth: path.length, path });
      const kids = children.get(node.id) ?? [];
      for (const child of [...kids].reverse()) stack.push({ node: child, path: [...path, node.title] });
    }
  };

  for (const root of children.get(null) ?? []) visit(root);
  for (const node of nodes) if (!layout.has(node.id)) visit(node);

  return layout;
}

export type TreeEntry = Omit<SourcePage, 'order' | 'depth' | 'path'>;

export function contentOf(format: PageContent['format'], text: string | null | undefined): PageContent | null {
  return text ? { format, text } : null;
}

/**
 * Lays entries out in reading order and records every page that has no content as a failure. Returns the pages and
 * how many of them have content.
 */
export function arrangePages(
  entries: TreeEntry[],
  failures: PageFailure[]
): { pages: SourcePage[]; readCount: number } {
  const layout = layoutTree(entries);
  const pages: SourcePage[] = entries.map((entry) => ({ ...entry, ...layout.get(entry.id)! }));
  pages.sort((left, right) => left.order - right.order);

  let readCount = 0;
  for (const page of pages) {
    if (page.kind !== 'page') continue;
    if (page.content) readCount += 1;
    else failures.push({ id: page.id, url: page.url, reason: 'body-missing' });
  }

  return { pages, readCount };
}
