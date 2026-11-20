import type { PageContent, SourceTree } from '../sources/types';
import type { PageLink } from '../discover/homepage';
import type { PageMedia } from './media';
import type { StructureSignal } from './structure';

export const INVENTORY_STATUSES = [
  'pending',
  'read',
  'index',
  'empty',
  'restricted',
  'not-found',
  'blocked',
  'duplicate',
  'other-locale',
  'robots-excluded',
  'out-of-scope',
  'failed'
] as const;

export type InventoryStatus = (typeof INVENTORY_STATUSES)[number];

export const INVENTORY_ORIGINS = ['sitemap', 'llms-txt', 'feed', 'link', 'robots-allow', 'root'] as const;

export type InventoryOrigin = (typeof INVENTORY_ORIGINS)[number];

export interface InventoryEntry {
  /** The page's normalized URL, unique in the inventory. */
  key: string;
  /** The URL as first learned, used to fetch it. Servers may treat spellings differently. */
  url: string;
  origins: Set<InventoryOrigin>;
  status: InventoryStatus;
  detail?: string;
  /** Position in the order the site listed it (sitemap or llms.txt), used when nothing better orders it. */
  listedAt: number;
}

export const REPRESENTATIONS = ['markdown', 'structured-data', 'html-main', 'rendered'] as const;

export type Representation = (typeof REPRESENTATIONS)[number];

/** One page as read, before it is placed in the tree. */
export interface ReadPage {
  url: string;
  canonicalUrl: string;
  title: string;
  content: PageContent;
  representation: Representation;
  /** The full HTML, used for structure and media. */
  html: string;
  locale: string | null;
  updatedAt: string | null;
  labels: string[];
  links: PageLink[];
  /** JSON the page's own scripts loaded from the same site, when it was rendered. */
  observedJson: unknown[];
}

/** A page with no teachable content of its own that still lists other pages: a home or category page. */
export interface NavigationPage {
  url: string;
  canonicalUrl: string;
  title: string;
  html: string;
}

export interface PageOutcome {
  status: Exclude<InventoryStatus, 'pending' | 'read' | 'index'>;
  detail?: string;
  navigation?: NavigationPage;
  /** The page answered with an HTTP redirect to a page already read. */
  redirected?: boolean;
}

/** Supplied by the host: a headless browser with private networks blocked. */
export interface PageRenderer {
  render(
    url: string,
    options: { timeoutMs: number }
  ): Promise<{
    finalUrl: string;
    status: number;
    html: string;
    observedJson: Array<{ url: string; body: unknown }>;
  }>;
}

export const SOURCE_OUTCOMES = ['read', 'partial', 'needs-login', 'blocked', 'off-brand', 'empty'] as const;

export type SourceOutcome = (typeof SOURCE_OUTCOMES)[number];

export interface ReadSourceResult {
  outcome: SourceOutcome;
  tree: SourceTree;
  inventory: InventoryEntry[];
  /** Images and videos of each page, keyed by page id. Images must be copied in the same build: some links expire. */
  media: Record<string, PageMedia>;
  representations: Partial<Record<Representation, number>>;
  /** How many pages each structure signal placed in the tree; `none` means a page sits at the top with no parent found. */
  placedBy: Partial<Record<StructureSignal | 'none', number>>;
}
