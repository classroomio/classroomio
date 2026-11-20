import * as cheerio from 'cheerio';

import type { DiscoveredSource, DiscoveryFetcher } from '../discover/discover';
import { isBotChallenge, isLoginUrl, isLoginWall } from '../discover/page-signals';
import { FetchError, type FetchResponse } from '../fetch/types';
import { inScope, sourceScope, type SourceScope } from '../scope/scope';
import { readSitemapUrls } from '../sources/sitemap';
import { arrangePages, assessCompleteness, type PageContent, type PageFailure, type TreeEntry } from '../sources/types';
import { Inventory, normalizePageUrl, parseLlmsTxt, type LlmsTxtOutline } from './inventory';
import { alternateFor, chooseLocale, pageLocale, sameLanguage, urlLanguageAt, urlLanguagePosition } from './locale';
import { pageMedia, type PageMedia } from './media';
import { isRelevant, RELEVANCE_SAMPLE_SIZE } from './relevance';
import {
  canonicalOf,
  holdsLittleText,
  isShell,
  labelsOf,
  listingHtml,
  mainContent,
  markdownVersion,
  pageHeading,
  type MarkdownForm,
  pageLinks,
  plainText,
  structuredDataBody,
  stripAgentPreamble,
  updatedAtOf,
  verifyContent
} from './representations';
import {
  breadcrumbEdges,
  indexPageChildren,
  llmsTxtStructure,
  mergeStructure,
  navigationTree,
  pageDataTree,
  urlPathStructure,
  type MergedStructure,
  type StructureResult,
  type StructureSignal
} from './structure';
import type {
  NavigationPage,
  PageOutcome,
  PageRenderer,
  ReadPage,
  ReadSourceResult,
  Representation,
  SourceOutcome
} from './types';

export interface ReadSourceOptions {
  fetcher: DiscoveryFetcher;
  /** A headless browser for pages that only fill themselves in with scripts. Without one, such pages fail. */
  renderer?: PageRenderer | null;
  source: DiscoveredSource;
  brandDomain: string;
  /** Names the organisation's product goes by, for the relevance check on other domains. */
  productNames?: string[];
  preferredLocale: string;
  maxPages: number;
  /** A time (ms since epoch) after which no new page is started; the source is returned as read so far. */
  deadlineAt?: number;
  include?: string[];
  exclude?: string[];
  onPage?: (page: ReadPage, media: PageMedia) => void;
  /**
   * Copies an image into the host's storage and returns the stored URL. Called while the page is read, because some
   * sites sign image URLs that expire. Each image URL is captured once per source.
   */
  captureImage?: (imageUrl: string, pageUrl: string) => Promise<string | null>;
  signal?: AbortSignal;
}

const PROBED_REPRESENTATIONS = ['markdown', 'structured-data'] as const;
const REPRESENTATION_PROBE_PAGES = 3;
const MAX_SITEMAP_URLS = 100_000;
const RENDER_TIMEOUT_MS = 30_000;
const FEED_TYPES = /application\/(rss\+xml|atom\+xml|feed\+json)/i;

type ProbedRepresentation = (typeof PROBED_REPRESENTATIONS)[number];

/** A read page once its structure, links and media are taken: the raw HTML is not kept, so memory stays flat. */
type StoredPage = Omit<ReadPage, 'html' | 'links' | 'observedJson'>;

const RECENT_RESPONSES = 32;

/**
 * Remembers the last few responses of one read, so a page fetched while finding pages (the root, an index, a probe)
 * is not downloaded again moments later. Only successful answers are kept, so a challenged page is fetched afresh when
 * it is tried again. Bounded, so memory stays flat on large sources.
 */
function withRecentResponses(fetcher: DiscoveryFetcher): DiscoveryFetcher {
  const recent = new Map<string, Promise<FetchResponse>>();

  return {
    robots: (origin) => fetcher.robots(origin),
    get(url, options) {
      const key = `${options?.accept ?? ''} ${url}`;
      const cached = recent.get(key);
      if (cached) return cached;

      const response = fetcher.get(url, options);
      recent.set(key, response);
      response.then(
        (answer) => {
          if (answer.status !== 200 || isBotChallenge(answer)) recent.delete(key);
        },
        () => recent.delete(key)
      );
      if (recent.size > RECENT_RESPONSES) recent.delete(recent.keys().next().value!);

      return response;
    }
  };
}

interface ReaderState {
  options: ReadSourceOptions;
  scope: SourceScope;
  inventory: Inventory;
  llms: LlmsTxtOutline | null;
  pages: Map<string, StoredPage>;
  media: Record<string, PageMedia>;
  structures: StructureResult[];
  failures: PageFailure[];
  probes: Record<ProbedRepresentation, { tried: number; won: number }>;
  /** Where this source's Markdown was found last, tried first on the next page. */
  markdownForm: MarkdownForm | null;
  locale: string | null;
  seenLocales: Array<string | null>;
  feedsRead: boolean;
  indexes: Map<string, { url: string; listedAt: number }>;
  capturedImages: Map<string, Promise<string | null>>;
  /** Image copies still running. Reading never waits for them; the result does. */
  imageWork: Array<Promise<void>>;
  /** Pages that met a bot challenge once. Challenges come and go, so each gets one more try later. */
  retriedChallenges: Set<string>;
  /** Pages whose links, structure or media could not be taken from their markup. */
  partlyParsed: Set<string>;
  /** Per path whose URLs differ only by query: how many redirected to a page already read; -Infinity once one did not. */
  redirectors: Map<string, number>;
  stoppedByTime: boolean;
  /** The path position where this source's URLs name their language, once its own pages prove it. */
  urlLanguagePosition: number | null;
  /** Pages whose URL and content agree on their language, by `<path position>:<language>`. */
  urlLanguageVotes: Map<string, number>;
}

function isProbeWorthwhile(state: ReaderState, representation: ProbedRepresentation): boolean {
  const probe = state.probes[representation];

  return probe.won > 0 || probe.tried < REPRESENTATION_PROBE_PAGES;
}

async function seedInventory(state: ReaderState): Promise<void> {
  const { inventory, scope, options } = state;
  const { fetcher, source } = options;
  const add = (url: string, origin: Parameters<Inventory['add']>[1]) => {
    if (inScope(url, scope)) inventory.add(url, origin);
  };

  add(source.url, 'root');
  const landing = source.redirectChain[source.redirectChain.length - 1];
  if (landing) add(landing, 'root');

  for (const sitemapUrl of source.sitemapUrls) {
    const sitemap = await readSitemapUrls(sitemapUrl, { fetcher, maxUrls: MAX_SITEMAP_URLS });
    for (const url of sitemap.urls) add(url, 'sitemap');
    for (const failure of sitemap.failures)
      state.failures.push({ url: failure.url, reason: `sitemap-${failure.reason}` });
  }

  if (source.llmsTxtUrl) {
    try {
      const response = await fetcher.get(source.llmsTxtUrl, { accept: 'text/plain,text/markdown' });
      if (response.status === 200) {
        state.llms = parseLlmsTxt(stripAgentPreamble(response.body));
        for (const link of state.llms.links) add(link.url, 'llms-txt');
      }
    } catch {
      state.failures.push({ url: source.llmsTxtUrl, reason: 'llms-txt-unreadable' });
    }
  }

  const robots = await fetcher.robots(new URL(scope.root).origin);
  for (const path of robots.allowPaths) add(new URL(path, scope.root).href, 'robots-allow');
}

function feedEntryUrls(body: string): string[] {
  const trimmed = body.trim();
  if (trimmed.startsWith('{')) {
    try {
      const feed = JSON.parse(trimmed) as { items?: Array<{ url?: string }> };

      return (feed.items ?? []).map((item) => item.url).filter((url): url is string => !!url);
    } catch {
      return [];
    }
  }

  const $ = cheerio.load(trimmed, { xml: true });
  const rss = $('item > link')
    .toArray()
    .map((link) => $(link).text().trim());
  const atom = $('entry > link')
    .toArray()
    .map((link) => $(link).attr('href') ?? '');

  return [...rss, ...atom].filter(Boolean);
}

async function readFeeds(state: ReaderState, html: string, pageUrl: string): Promise<void> {
  state.feedsRead = true;
  const $ = cheerio.load(html);
  const feeds = $('link[rel="alternate"]')
    .toArray()
    .filter((link) => FEED_TYPES.test($(link).attr('type') ?? ''))
    .map((link) => $(link).attr('href'))
    .filter((href): href is string => !!href);

  for (const href of feeds) {
    try {
      const response = await state.options.fetcher.get(new URL(href, pageUrl).href, {
        accept: 'application/rss+xml,application/atom+xml,application/feed+json'
      });
      if (response.status !== 200) continue;

      for (const url of feedEntryUrls(response.body)) {
        if (inScope(url, state.scope)) state.inventory.add(url, 'feed');
      }
    } catch {
      continue;
    }
  }
}

function outcomeForResponse(response: FetchResponse): PageOutcome | null {
  if (isBotChallenge(response)) return { status: 'blocked' };
  if (response.status === 401 || response.status === 403) return { status: 'restricted', detail: `${response.status}` };
  if (response.status === 404 || response.status === 410) return { status: 'not-found' };
  if (response.status !== 200) return { status: 'failed', detail: `${response.status}` };
  if (isLoginWall(response)) return { status: 'restricted', detail: 'login' };

  return null;
}

async function renderShell(state: ReaderState, response: FetchResponse) {
  const renderer = state.options.renderer;
  if (!renderer || !isShell(response)) return null;

  const rendered = await renderer.render(response.url, { timeoutMs: RENDER_TIMEOUT_MS });
  const siteHost = new URL(response.url).host;
  const observedJson = rendered.observedJson
    .filter((entry) => {
      try {
        return new URL(entry.url).host === siteHost;
      } catch {
        return false;
      }
    })
    .map((entry) => entry.body);
  const renderedResponse: FetchResponse = {
    ...response,
    url: rendered.finalUrl,
    status: rendered.status,
    body: rendered.html
  };

  return { response: renderedResponse, observedJson };
}

async function chooseContent(
  state: ReaderState,
  response: FetchResponse,
  title: string,
  observedJson: unknown[],
  rendered: boolean
): Promise<{ content: PageContent; representation: Representation } | null> {
  const html = response.body;

  if (isProbeWorthwhile(state, 'markdown')) {
    state.probes.markdown.tried += 1;
    const markdown = await markdownVersion(state.options.fetcher, response.url, html, state.markdownForm);
    const content = markdown?.content;
    if (content && verifyContent(response, content, title)) {
      state.probes.markdown.won += 1;
      state.markdownForm = markdown.form;

      return { content, representation: 'markdown' };
    }
  }

  if (isProbeWorthwhile(state, 'structured-data') || observedJson.length) {
    state.probes['structured-data'].tried += 1;
    const content = structuredDataBody(html, title, observedJson);
    if (content && verifyContent(response, content, title)) {
      state.probes['structured-data'].won += 1;

      return { content, representation: 'structured-data' };
    }
  }

  const content = mainContent(html, response.url);
  if (content && verifyContent(response, content, title)) {
    return { content, representation: rendered ? 'rendered' : 'html-main' };
  }

  return null;
}

/**
 * URLs of one shape (same path, differing only in their query string, or in a last segment that is only a number) that
 * each redirect to a page already read are a redirector: a click tracker, or short links like `/articles/123` for
 * `/articles/123-title`. After this many such answers, the rest of that shape are skipped: they lead only to known pages.
 * One URL of the shape that is a page of its own turns the rule off for that shape.
 */
const REDIRECTOR_PROOF = 5;

function redirectorOf(url: string): string | null {
  const parsed = new URL(url);
  const segments = parsed.pathname.split('/');
  const last = segments[segments.length - 1];
  if (/^\d+$/.test(last))
    return `${parsed.origin}${segments.slice(0, -1).join('/')}/{number}${parsed.search ? '?' : ''}`;

  return parsed.search ? `${parsed.origin}${parsed.pathname}?` : null;
}

/** Reads one page; an unexpected error fails that page only, never the whole source. */
async function readPageSafely(state: ReaderState, url: string): Promise<ReadPage | PageOutcome> {
  try {
    return await readPage(state, url);
  } catch (error) {
    state.options.signal?.throwIfAborted();

    return { status: 'failed', detail: `error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/** Runs one step on a page already read. If the page's markup breaks it, the page is kept and the step is noted. */
function withinPage<T>(state: ReaderState, url: string, step: () => T): T | null {
  try {
    return step();
  } catch {
    state.partlyParsed.add(url);

    return null;
  }
}

/** Reads one page into its best verified version, or says why it can't be read. */
async function readPage(state: ReaderState, url: string): Promise<ReadPage | PageOutcome> {
  let response: FetchResponse;
  try {
    response = await state.options.fetcher.get(url);
  } catch (error) {
    if (error instanceof FetchError && error.reason === 'robots-disallowed') return { status: 'robots-excluded' };
    if (error instanceof FetchError && error.reason === 'too-many-redirects' && isLoginUrl(error.detail ?? '')) {
      return { status: 'restricted', detail: 'login' };
    }

    return { status: 'failed', detail: error instanceof Error ? error.message : String(error) };
  }

  const early = outcomeForResponse(response);
  if (early) return early;

  const finalUrl = normalizePageUrl(response.url);
  if (!inScope(finalUrl, state.scope)) return { status: 'out-of-scope', detail: finalUrl };
  if (finalUrl !== normalizePageUrl(url) && state.pages.has(finalUrl)) {
    return { status: 'duplicate', detail: finalUrl, redirected: true };
  }

  const rendered = await renderShell(state, response).catch(() => null);
  const page = rendered?.response ?? response;
  const renderedOutcome = rendered ? outcomeForResponse(page) : null;
  if (renderedOutcome) return renderedOutcome;

  const html = page.body;
  const canonical = normalizePageUrl(canonicalOf(html, page.url));
  if (canonical !== finalUrl && inScope(canonical, state.scope)) {
    state.inventory.add(canonical, 'link');

    return { status: 'duplicate', detail: canonical };
  }

  const locale = pageLocale(html, page.url);
  if (!sameLanguage(locale, state.locale)) {
    const alternate = alternateFor(html, page.url, state.locale!);
    if (alternate && inScope(alternate, state.scope)) state.inventory.add(alternate, 'link');

    return { status: 'other-locale', detail: locale ?? undefined };
  }

  const title = pageHeading(html, page.url) ?? page.url;
  const chosen = await chooseContent(state, page, title, rendered?.observedJson ?? [], !!rendered);
  if (!chosen) {
    const navigation = { url: page.url, canonicalUrl: finalUrl, title, html };
    const unrenderedShell = !rendered && isShell(response);
    if (!unrenderedShell && holdsLittleText(html, page.url)) return { status: 'empty', navigation };

    return { status: 'failed', detail: 'no-verified-content', navigation };
  }

  return {
    url: page.url,
    canonicalUrl: finalUrl,
    title,
    content: chosen.content,
    representation: chosen.representation,
    html,
    locale,
    updatedAt: updatedAtOf(html, page.headers),
    labels: labelsOf(html, title),
    links: pageLinks(html, page.url),
    observedJson: rendered?.observedJson ?? []
  };
}

function jsonBlobs(html: string): unknown[] {
  const $ = cheerio.load(html);
  const blobs: unknown[] = [];
  $('script[type="application/ld+json"], script[type="application/json"]').each((_, element) => {
    try {
      blobs.push(JSON.parse($(element).text()));
    } catch {
      return;
    }
  });

  return blobs;
}

function pageStructure(
  state: ReaderState,
  page: NavigationPage,
  observedJson: unknown[],
  withoutContent = false
): StructureResult[] {
  const isInScope = (url: string) => inScope(url, state.scope);
  const isKnown = (url: string) => isInScope(url) && state.inventory.has(url);
  const indexEdges = indexPageChildren(listingHtml(page.html), page.canonicalUrl, isInScope, withoutContent);
  const indexGroups =
    indexEdges.length && !state.pages.has(page.canonicalUrl)
      ? [{ id: page.canonicalUrl, title: page.title, url: page.url }]
      : [];

  return [
    pageDataTree([...jsonBlobs(page.html), ...observedJson], page.url, isKnown),
    navigationTree(page.html, page.url, isInScope),
    { edges: indexEdges, groups: indexGroups },
    breadcrumbEdges(page.html, page.canonicalUrl)
  ];
}

/** Queues the page's in-scope links. Sign-in links are never pages: one per page of the site, all leading to a form. */
function followLinks(state: ReaderState, html: string, pageUrl: string): void {
  for (const link of pageLinks(html, pageUrl))
    if (inScope(link.url, state.scope) && !isLoginUrl(link.url)) state.inventory.add(link.url, 'link');
}

/** A page with nothing to teach that lists other pages becomes a group of them; anything else is a failure. */
function recordNavigationPage(state: ReaderState, entryUrl: string, page: NavigationPage): boolean {
  followLinks(state, page.html, page.url);
  const structures = pageStructure(state, page, [], true);
  const isIndex = structures[2].edges.length > 0;
  state.structures.push(...structures);
  if (!isIndex) return false;

  state.indexes.set(page.canonicalUrl, {
    url: page.canonicalUrl,
    listedAt: state.inventory.get(entryUrl)?.listedAt ?? 0
  });
  state.inventory.mark(entryUrl, 'index');

  return true;
}

function captureImages(state: ReaderState, media: PageMedia, pageUrl: string): void {
  const capture = state.options.captureImage;
  if (!capture) return;

  for (const image of media.images) {
    let pending = state.capturedImages.get(image.url);
    if (!pending) {
      pending = capture(image.url, pageUrl).catch(() => null);
      state.capturedImages.set(image.url, pending);
    }

    const stored = pending.then((storedUrl) => {
      image.storedUrl = storedUrl;
      if (!storedUrl) state.failures.push({ url: image.url, reason: 'image-capture-failed' });
    });
    state.imageWork.push(stored);
  }
}

/** Read pages in the chosen language that name it in their URL, at the same path position, before URLs are trusted. */
const URL_LANGUAGE_PROOF = 5;

/**
 * Whether a queued URL names another language than the source's, so it need not be fetched to find out. Only once the
 * source's own pages name their language at that path position, and only for real language codes.
 */
function inAnotherLanguage(state: ReaderState, url: string): boolean {
  if (!state.locale || state.urlLanguagePosition === null) return false;

  const language = urlLanguageAt(url, state.urlLanguagePosition);

  return language !== null && language !== state.locale;
}

function learnUrlLanguage(state: ReaderState, page: StoredPage): void {
  if (state.urlLanguagePosition !== null) return;

  const position = urlLanguagePosition(page.url);
  const language = position === null ? null : urlLanguageAt(page.url, position);
  if (position !== null && language && sameLanguage(page.locale, language)) {
    const key = `${position}:${language}`;
    state.urlLanguageVotes.set(key, (state.urlLanguageVotes.get(key) ?? 0) + 1);
  }
  if (!state.locale) return;

  for (const [key, votes] of state.urlLanguageVotes) {
    const [votedPosition, votedLanguage] = key.split(':');
    if (votedLanguage === state.locale && votes >= URL_LANGUAGE_PROOF)
      state.urlLanguagePosition = Number(votedPosition);
  }
}

function decideLocale(state: ReaderState, page: ReadPage): void {
  if (state.locale) return;

  state.seenLocales.push(page.locale);
  state.locale = chooseLocale(state.seenLocales, state.options.preferredLocale);
  if (!state.locale) return;

  for (const [id, readPage] of state.pages) {
    if (sameLanguage(readPage.locale, state.locale)) continue;

    state.pages.delete(id);
    delete state.media[id];
    state.inventory.mark(id, 'other-locale', readPage.locale ?? undefined);
  }
}

function resolveParent(
  id: string,
  merged: MergedStructure,
  present: Set<string>,
  fallback: MergedStructure
): string | null {
  const parentId = merged.edges.get(id)?.parentId ?? null;
  if (!parentId || present.has(parentId)) return parentId;

  const pathParent = fallback.edges.get(id)?.parentId ?? null;

  return pathParent && present.has(pathParent) ? pathParent : null;
}

function buildEntries(state: ReaderState): {
  entries: TreeEntry[];
  disagreements: number;
  placedBy: Partial<Record<StructureSignal | 'none', number>>;
} {
  const isInScope = (url: string) => inScope(url, state.scope);
  const listed = [
    ...[...state.pages.values()].map((page) => ({
      url: page.canonicalUrl,
      listedAt: state.inventory.get(page.canonicalUrl)?.listedAt ?? Number.MAX_SAFE_INTEGER
    })),
    ...state.indexes.values()
  ];
  const fallback = mergeStructure([urlPathStructure(listed)]);
  const merged = mergeStructure([
    ...state.structures,
    state.llms ? llmsTxtStructure(state.llms, isInScope) : { edges: [], groups: [] },
    urlPathStructure(listed)
  ]);

  const present = new Set(state.pages.keys());
  let addedGroup = true;
  while (addedGroup) {
    addedGroup = false;
    for (const edge of merged.edges.values()) {
      const parent = edge.parentId;
      if (!parent || present.has(parent) || !merged.groups.has(parent) || !present.has(edge.childId)) continue;

      present.add(parent);
      addedGroup = true;
    }
  }

  const entries: TreeEntry[] = [];
  const placedBy: Partial<Record<StructureSignal | 'none', number>> = {};
  for (const id of present) {
    const page = state.pages.get(id);
    const edge = merged.edges.get(id);
    const parentId = resolveParent(id, merged, present, fallback);
    const position = edge && edge.parentId === parentId ? edge.position : (fallback.edges.get(id)?.position ?? null);
    const signal = edge && edge.parentId === parentId ? edge.signal : parentId ? 'url-path' : 'none';
    if (page) placedBy[signal] = (placedBy[signal] ?? 0) + 1;

    if (page) {
      entries.push({
        id,
        url: page.url,
        title: page.title,
        kind: 'page',
        summary: null,
        labels: page.labels,
        parentId,
        position,
        updatedAt: page.updatedAt,
        locale: page.locale,
        content: page.content
      });
      continue;
    }

    const group = merged.groups.get(id)!;
    entries.push({
      id,
      url: group.url ?? state.scope.root,
      title: group.title,
      kind: 'group',
      summary: null,
      labels: [],
      parentId,
      position,
      updatedAt: null,
      locale: null,
      content: null
    });
  }

  return { entries, disagreements: merged.disagreements.length, placedBy };
}

function sourceOutcome(state: ReaderState, complete: boolean, offBrand: boolean): SourceOutcome {
  if (offBrand) return 'off-brand';
  if (state.pages.size > 0) return complete ? 'read' : 'partial';

  const blocked = state.inventory.countBy('blocked');
  const restricted = state.inventory.countBy('restricted');
  if (blocked > 0 && blocked >= restricted) return 'blocked';
  if (restricted > 0) return 'needs-login';

  return 'empty';
}

/**
 * Reads every public page of one discovered source into the site's own tree, in the site's order, then checks
 * completeness against everything the site said exists. Never works around logins or anti-bot pages; records them.
 */
export async function readSource(options: ReadSourceOptions): Promise<ReadSourceResult> {
  const state: ReaderState = {
    options: { ...options, fetcher: withRecentResponses(options.fetcher) },
    scope: sourceScope(options.source.url, { include: options.include, exclude: options.exclude }),
    inventory: new Inventory(),
    llms: null,
    pages: new Map(),
    media: {},
    structures: [],
    failures: [],
    probes: { markdown: { tried: 0, won: 0 }, 'structured-data': { tried: 0, won: 0 } },
    markdownForm: null,
    locale: null,
    seenLocales: [],
    feedsRead: false,
    indexes: new Map(),
    capturedImages: new Map(),
    imageWork: [],
    retriedChallenges: new Set(),
    partlyParsed: new Set(),
    redirectors: new Map(),
    stoppedByTime: false,
    urlLanguagePosition: null,
    urlLanguageVotes: new Map()
  };
  const representations: Partial<Record<Representation, number>> = {};
  let offBrand = false;
  let relevanceChecked = options.source.ownership !== 'foreign';

  await seedInventory(state);

  for (let entry = state.inventory.nextPending(); entry; entry = state.inventory.nextPending()) {
    options.signal?.throwIfAborted();
    if (state.pages.size >= options.maxPages) break;
    if (options.deadlineAt !== undefined && Date.now() >= options.deadlineAt) {
      state.stoppedByTime = true;
      break;
    }

    if (inAnotherLanguage(state, entry.url)) {
      state.inventory.mark(entry.url, 'other-locale', 'from its URL');
      continue;
    }

    const redirector = redirectorOf(entry.url);
    if (redirector && (state.redirectors.get(redirector) ?? 0) >= REDIRECTOR_PROOF) {
      state.inventory.mark(entry.url, 'duplicate', 'redirects to pages already read');
      continue;
    }

    const outcome = await readPageSafely(state, entry.url);
    if (redirector) {
      const leadsToKnownPage = !('content' in outcome) && outcome.status === 'duplicate' && !!outcome.redirected;
      state.redirectors.set(redirector, leadsToKnownPage ? (state.redirectors.get(redirector) ?? 0) + 1 : -Infinity);
    }
    if (!('content' in outcome)) {
      const navigation = outcome.navigation;
      if (navigation && withinPage(state, entry.url, () => recordNavigationPage(state, entry.url, navigation)))
        continue;
      if (outcome.status === 'blocked' && !state.retriedChallenges.has(entry.key)) {
        state.retriedChallenges.add(entry.key);
        state.inventory.retry(entry.url);
        continue;
      }

      state.inventory.mark(entry.url, outcome.status, outcome.detail);
      if (outcome.status === 'failed' || outcome.status === 'blocked') {
        state.failures.push({
          url: entry.url,
          reason: outcome.detail ? `${outcome.status}: ${outcome.detail}` : outcome.status
        });
      }
      continue;
    }

    const { html: _html, links: _links, observedJson: _observedJson, ...stored } = outcome;
    state.pages.set(outcome.canonicalUrl, stored);
    state.inventory.mark(entry.url, 'read');
    if (outcome.canonicalUrl !== normalizePageUrl(entry.url)) state.inventory.mark(outcome.canonicalUrl, 'read');
    representations[outcome.representation] = (representations[outcome.representation] ?? 0) + 1;

    const media = withinPage(state, outcome.url, () => pageMedia(outcome.content, outcome.html, outcome.url)) ?? {
      images: [],
      videos: [],
      oembedUrl: null
    };
    captureImages(state, media, outcome.url);
    state.media[outcome.canonicalUrl] = media;
    options.onPage?.(outcome, media);

    if (!state.feedsRead) await readFeeds(state, outcome.html, outcome.url).catch(() => undefined);
    withinPage(state, outcome.url, () => {
      followLinks(state, outcome.html, outcome.url);
      state.structures.push(...pageStructure(state, outcome, outcome.observedJson));
    });
    decideLocale(state, outcome);
    learnUrlLanguage(state, stored);

    if (!relevanceChecked && state.pages.size >= RELEVANCE_SAMPLE_SIZE) {
      relevanceChecked = true;
      const samples = [...state.pages.values()].map((page) => plainText(page.content));
      if (!isRelevant(samples, options.brandDomain, options.productNames ?? [])) {
        offBrand = true;
        break;
      }
    }
  }

  await Promise.all(state.imageWork);

  if (!relevanceChecked && state.pages.size > 0) {
    const samples = [...state.pages.values()].map((page) => plainText(page.content));
    offBrand = !isRelevant(samples, options.brandDomain, options.productNames ?? []);
  }

  const { entries, disagreements, placedBy } = offBrand
    ? { entries: [], disagreements: 0, placedBy: {} }
    : buildEntries(state);
  const { pages, readCount } = arrangePages(entries, state.failures);
  const completeness = assessCompleteness(readCount, state.inventory.publicCount(), 'link-closure');
  const notes: string[] = [];
  if (disagreements) notes.push(`${disagreements} pages had conflicting parents`);
  if (state.partlyParsed.size) notes.push(`${state.partlyParsed.size} pages could not be fully parsed`);
  if (state.stoppedByTime) notes.push('stopped at the time limit');
  else if (state.inventory.countBy('pending')) notes.push(`stopped at the ${options.maxPages}-page limit`);

  return {
    outcome: sourceOutcome(state, completeness.status === 'complete', offBrand),
    tree: {
      sourceUrl: state.scope.root,
      key: options.source.url,
      title: options.source.title ?? state.scope.root,
      pages,
      failures: state.failures,
      completeness,
      sitemapCheck: null,
      notes,
      readAt: new Date().toISOString()
    },
    inventory: state.inventory.all(),
    media: offBrand ? {} : state.media,
    representations,
    placedBy
  };
}
