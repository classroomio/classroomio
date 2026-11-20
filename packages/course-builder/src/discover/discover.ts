import type { RobotsRules } from '../fetch/robots';
import { FetchError, type FetchResponse, type Fetcher } from '../fetch/types';
import {
  brandSlug,
  hostOwnership,
  identifiesAsBrand,
  mentionsBrand,
  registrableDomain,
  type HostOwnership
} from './brand';
import { kindFromHost, kindFromLinkText, kindFromPath, readHomepage, type PageLink, type SourceKind } from './homepage';
import {
  clientRedirectTarget,
  isBotChallenge,
  isLoginWall,
  isParkedDomain,
  pageTitle,
  visibleTextLength
} from './page-signals';

export interface DiscoveryFetcher extends Fetcher {
  robots(origin: string): Promise<RobotsRules>;
}

export const FOUND_VIA = ['input', 'site-link', 'subdomain-probe'] as const;

export type FoundVia = (typeof FOUND_VIA)[number];

/** Why a source is believed to belong to the organisation. */
export const EVIDENCE = [
  'input',
  'linked-from-site',
  'redirect-from-own-name',
  'names-itself-after-brand',
  'probe-only'
] as const;

export type Evidence = (typeof EVIDENCE)[number];

/** What a reader meets at the source's landing page. */
export const ACCESS = ['open', 'login', 'challenge'] as const;

export type Access = (typeof ACCESS)[number];

export const SKIP_REASONS = [
  'unreachable',
  'not-found',
  'wildcard-dns',
  'same-as-homepage',
  'off-brand',
  'parked',
  'empty',
  'robots-disallowed',
  'ai-input-disallowed',
  'duplicate',
  'community'
] as const;

export type SkipReason = (typeof SKIP_REASONS)[number];

export interface DiscoveredSource {
  kind: SourceKind;
  /** Where reading starts and the prefix it stays within. */
  url: string;
  title: string | null;
  foundVia: FoundVia;
  /** The URL that was linked or probed. */
  foundAt: string;
  redirectChain: string[];
  ownership: HostOwnership;
  evidence: Evidence;
  access: Access;
  llmsTxtUrl: string | null;
  sitemapUrls: string[];
}

export interface SkippedCandidate {
  url: string;
  foundVia: FoundVia;
  reason: SkipReason;
  detail?: string;
}

export interface SourceMap {
  inputUrl: string;
  siteUrl: string | null;
  brandDomain: string | null;
  siteTitle: string | null;
  /** The product site first, then the other sources with evidence that they belong to the organisation. */
  sources: DiscoveredSource[];
  /** Sources found only by guessing a subdomain, with nothing tying them to the organisation. Not read unconfirmed. */
  needsConfirmation: DiscoveredSource[];
  skipped: SkippedCandidate[];
  youtubeChannels: string[];
}

export interface DiscoverOptions {
  fetcher: DiscoveryFetcher;
  /** Subdomain labels tried on the brand's domain. */
  probeLabels?: string[];
  /** Label used to detect wildcard DNS; random by default. */
  wildcardLabel?: string;
}

interface Candidate {
  url: string;
  foundVia: FoundVia;
  kindHint: SourceKind | null;
}

interface Landing {
  response: FetchResponse;
  chain: string[];
}

interface LlmsTxt {
  url: string;
  links: PageLink[];
}

export const DEFAULT_PROBE_LABELS = ['help', 'support', 'docs', 'kb', 'knowledge', 'helpcenter', 'academy', 'learn'];

const MAX_CLIENT_REDIRECTS = 3;
const MIN_VISIBLE_TEXT = 200;
const SITEMAP_PATHS = ['/sitemap.xml', '/sitemap_index.xml', '/sitemap-index.xml'];
const MARKDOWN_LINK = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;

/** Adds https:// when the scheme is missing and normalises the URL, e.g. `acme.cloud` → `https://acme.cloud/`. */
export function normalizeInputUrl(input: string): string {
  const trimmed = input.trim();
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  return new URL(withScheme).href;
}

async function landOn(fetcher: Fetcher, url: string): Promise<Landing> {
  const chain: string[] = [];
  let response = await fetcher.get(url);

  for (let hop = 0; hop < MAX_CLIENT_REDIRECTS; hop += 1) {
    chain.push(...response.redirects);
    const target = response.status < 400 ? clientRedirectTarget(response) : null;
    if (!target || target === response.url) break;

    chain.push(response.url);
    response = await fetcher.get(target);
  }

  return { response, chain: [...chain, response.url] };
}

/**
 * Where a source starts. Hosts that belong to the brand, or carry its name, are read from their root; any other host
 * only within the directory of the page that was linked.
 */
function sourceRoot(url: string, foundVia: FoundVia, siteHost: string, brandDomain: string): string {
  if (foundVia === 'input') return url;

  const parsed = new URL(url);
  if (parsed.host === siteHost) {
    const segments = parsed.pathname.split('/').filter(Boolean);
    const depth = segments[0] === 'hc' && segments[1] ? 2 : 1;

    return `${parsed.origin}/${segments.slice(0, depth).join('/')}`;
  }

  const brandedHost =
    hostOwnership(parsed.hostname, brandDomain) === 'own' || parsed.hostname.includes(brandSlug(brandDomain));
  if (brandedHost) return `${parsed.origin}/`;

  return `${parsed.origin}${parsed.pathname.replace(/[^/]*$/, '')}`;
}

function candidatesFromLinks(links: PageLink[], siteHost: string, brandDomain: string): Candidate[] {
  const candidates: Candidate[] = [];

  for (const link of links) {
    const host = new URL(link.url).host;

    if (host === siteHost) {
      const kind = kindFromPath(link.url);
      if (kind) candidates.push({ url: link.url, foundVia: 'site-link', kindHint: kind });
      continue;
    }

    const kindByHost = kindFromHost(host);
    const kindByText = kindFromLinkText(link.text);
    const kind = kindByHost ?? kindFromPath(link.url) ?? kindByText;
    if (!kind) continue;
    if (hostOwnership(host, brandDomain) === 'foreign' && !kindByHost && !kindByText) continue;

    candidates.push({ url: link.url, foundVia: 'site-link', kindHint: kind });
  }

  return candidates;
}

function candidateKey(candidate: Candidate, siteHost: string, brandDomain: string): string {
  const parsed = new URL(candidate.url);

  return parsed.host === siteHost ? sourceRoot(candidate.url, 'site-link', siteHost, brandDomain) : parsed.host;
}

function skipReasonFor(error: unknown): SkipReason {
  if (error instanceof FetchError && error.reason === 'robots-disallowed') return 'robots-disallowed';

  return 'unreachable';
}

async function firstSitemap(fetcher: Fetcher, origin: string, fromRobots: string[]): Promise<string[]> {
  const declared = fromRobots.filter((url) => {
    try {
      return new URL(url).origin === origin;
    } catch {
      return false;
    }
  });
  if (declared.length) return declared;

  for (const path of SITEMAP_PATHS) {
    try {
      const response = await fetcher.get(`${origin}${path}`, { accept: 'application/xml,text/xml' });
      if (response.status === 200 && /<(urlset|sitemapindex)\b/i.test(response.body.slice(0, 4096))) {
        return [response.url];
      }
    } catch {
      continue;
    }
  }

  return [];
}

async function findLlmsTxt(fetcher: Fetcher, rootUrl: string): Promise<LlmsTxt | null> {
  const root = new URL(rootUrl);
  const prefix = root.pathname.replace(/\/$/, '');
  const locations = [...new Set([`${root.origin}${prefix}/llms.txt`, `${root.origin}/llms.txt`])];

  for (const location of locations) {
    try {
      const response = await fetcher.get(location, { accept: 'text/plain,text/markdown' });
      const contentType = response.headers['content-type'] ?? '';
      const links = [...response.body.matchAll(MARKDOWN_LINK)].map((match) => ({ text: match[1], url: match[2] }));
      if (response.status === 200 && !contentType.includes('html') && links.length) return { url: response.url, links };
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * Finds what an organisation publishes that a course could be built from: its product site, plus help, docs and
 * learning sites reached from its own pages or by guessing common subdomains. A source is accepted only with evidence
 * that it belongs to the organisation. Spends no model tokens.
 */
export async function discoverSources(inputUrl: string, options: DiscoverOptions): Promise<SourceMap> {
  const { fetcher } = options;
  const probeLabels = options.probeLabels ?? DEFAULT_PROBE_LABELS;
  const wildcardLabel = options.wildcardLabel ?? `cio-probe-${Math.random().toString(36).slice(2, 10)}`;
  const map: SourceMap = {
    inputUrl,
    siteUrl: null,
    brandDomain: null,
    siteTitle: null,
    sources: [],
    needsConfirmation: [],
    skipped: [],
    youtubeChannels: []
  };

  let home: Landing;
  try {
    home = await landOn(fetcher, normalizeInputUrl(inputUrl));
  } catch (error) {
    map.skipped.push({ url: inputUrl, foundVia: 'input', reason: skipReasonFor(error), detail: String(error) });

    return map;
  }

  const homeUrl = new URL(home.response.url);
  const brandDomain = registrableDomain(homeUrl.hostname);
  const isScopedInput = new URL(home.chain[0]).pathname.replace(/\/$/, '') !== '';
  const homepage = readHomepage(home.response.body, home.response.url);
  map.siteUrl = `${homeUrl.origin}/`;
  map.brandDomain = brandDomain;
  map.siteTitle = pageTitle(home.response.body);
  map.youtubeChannels = homepage.youtubeChannels;

  const siteRobots = await fetcher.robots(homeUrl.origin);
  if (siteRobots.contentSignals['ai-input'] === 'no') {
    map.skipped.push({ url: map.siteUrl, foundVia: 'input', reason: 'ai-input-disallowed' });

    return map;
  }

  const llmsTxt = await findLlmsTxt(fetcher, map.siteUrl);
  map.sources.push({
    kind: 'product-site',
    url: isScopedInput ? home.response.url : map.siteUrl,
    title: map.siteTitle,
    foundVia: 'input',
    foundAt: inputUrl,
    redirectChain: home.chain,
    ownership: 'own',
    evidence: 'input',
    access: 'open',
    llmsTxtUrl: llmsTxt?.url ?? null,
    sitemapUrls: await firstSitemap(fetcher, homeUrl.origin, siteRobots.sitemaps)
  });

  const siteHost = homeUrl.host;
  const siteLinks = [...homepage.links, ...(llmsTxt?.links ?? [])];
  const candidates = new Map<string, Candidate>();
  for (const candidate of candidatesFromLinks(siteLinks, siteHost, brandDomain)) {
    const key = candidateKey(candidate, siteHost, brandDomain);
    if (!candidates.has(key)) candidates.set(key, candidate);
  }
  for (const label of probeLabels) {
    const candidate: Candidate = {
      url: `https://${label}.${brandDomain}/`,
      foundVia: 'subdomain-probe',
      kindHint: null
    };
    const key = candidateKey(candidate, siteHost, brandDomain);
    if (!candidates.has(key)) candidates.set(key, candidate);
  }

  const wildcard = await landOn(fetcher, `https://${wildcardLabel}.${brandDomain}/`).catch(() => null);
  const wildcardSignature = wildcard && wildcard.response.status < 400 ? signature(wildcard.response) : null;
  const context: ResolveContext = { fetcher, brandDomain, siteHost, homeUrl: home.response.url, wildcardSignature };

  const resolved = await Promise.all([...candidates.values()].map((candidate) => resolveCandidate(candidate, context)));

  const seenRoots = new Map<string, DiscoveredSource>();
  for (const result of resolved) {
    if ('reason' in result) {
      map.skipped.push(result);
      continue;
    }

    const rootKey = result.url.replace(/\/$/, '');
    const existing = seenRoots.get(rootKey);
    if (existing) {
      map.skipped.push({ url: result.foundAt, foundVia: result.foundVia, reason: 'duplicate', detail: existing.url });
      continue;
    }

    seenRoots.set(rootKey, result);
    if (result.evidence === 'probe-only') map.needsConfirmation.push(result);
    else map.sources.push(result);
  }

  return map;
}

interface ResolveContext {
  fetcher: DiscoveryFetcher;
  brandDomain: string;
  siteHost: string;
  homeUrl: string;
  wildcardSignature: string | null;
}

function signature(response: FetchResponse): string {
  return `${new URL(response.url).pathname}|${pageTitle(response.body) ?? ''}|${Math.round(response.body.length / 1000)}`;
}

function accessOf(response: FetchResponse): Access {
  if (isBotChallenge(response)) return 'challenge';
  if (isLoginWall(response)) return 'login';

  return 'open';
}

function evidenceFor(candidate: Candidate, landing: Landing, access: Access, brandDomain: string): Evidence {
  if (candidate.foundVia === 'site-link') return 'linked-from-site';

  const probedHost = new URL(candidate.url).host;
  const leftProbedHost = landing.chain.some((url) => new URL(url).host !== probedHost);
  if (leftProbedHost) return 'redirect-from-own-name';
  if (access === 'open' && identifiesAsBrand(landing.response.body, brandDomain)) return 'names-itself-after-brand';

  return 'probe-only';
}

async function resolveCandidate(
  candidate: Candidate,
  context: ResolveContext
): Promise<DiscoveredSource | SkippedCandidate> {
  const skip = (reason: SkipReason, detail?: string): SkippedCandidate => ({
    url: candidate.url,
    foundVia: candidate.foundVia,
    reason,
    ...(detail ? { detail } : {})
  });

  let landing: Landing;
  try {
    landing = await landOn(context.fetcher, candidate.url);
  } catch (error) {
    return skip(skipReasonFor(error), error instanceof FetchError ? error.message : String(error));
  }

  const { response } = landing;
  const finalUrl = new URL(response.url);
  const ownership = hostOwnership(finalUrl.hostname, context.brandDomain);
  const access = accessOf(response);

  if (response.status === 404 || response.status === 410) return skip('not-found');
  if (candidate.foundVia === 'subdomain-probe' && context.wildcardSignature === signature(response)) {
    return skip('wildcard-dns');
  }
  if (response.url === context.homeUrl) return skip('same-as-homepage');
  if (access === 'open') {
    if (response.status >= 400) return skip('unreachable', `${response.status}`);
    if (isParkedDomain(response)) return skip('parked', response.url);
    if (visibleTextLength(response.body) < MIN_VISIBLE_TEXT) return skip('empty', response.url);
    if (ownership === 'foreign' && !mentionsBrand(response.body, context.brandDomain)) {
      return skip('off-brand', response.url);
    }
  }

  const kind =
    candidate.kindHint ??
    kindFromHost(finalUrl.hostname) ??
    kindFromPath(response.url) ??
    kindFromHost(new URL(candidate.url).hostname);
  if (kind === 'community') return skip('community', response.url);

  const robots = await context.fetcher.robots(finalUrl.origin);
  if (robots.contentSignals['ai-input'] === 'no') return skip('ai-input-disallowed', response.url);

  const url = sourceRoot(response.url, candidate.foundVia, context.siteHost, context.brandDomain);
  const sitemapUrls = await firstSitemap(context.fetcher, finalUrl.origin, robots.sitemaps);
  const llmsTxt = await findLlmsTxt(context.fetcher, url);

  return {
    kind: kind ?? 'help-center',
    url,
    title: pageTitle(response.body),
    foundVia: candidate.foundVia,
    foundAt: candidate.url,
    redirectChain: landing.chain,
    ownership,
    evidence: evidenceFor(candidate, landing, access, context.brandDomain),
    access,
    llmsTxtUrl: llmsTxt?.url ?? null,
    sitemapUrls
  };
}
