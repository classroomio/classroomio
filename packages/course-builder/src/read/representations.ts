import * as cheerio from 'cheerio';

import { registrableDomain } from '../discover/brand';
import { isBotChallenge, isLoginWall, pageTitle, visibleTextLength } from '../discover/page-signals';
import type { FetchResponse, Fetcher } from '../fetch/types';
import type { PageContent } from '../sources/types';
import type { PageLink } from '../discover/homepage';

export const MIN_CONTENT_CHARS = 200;

const SHELL_TEXT_CHARS = 300;
const AI_ADDRESSEE = /\b(ai|llms?|language models?|agents?|assistants?|chatbots?|crawlers?)\b/i;
const INSTRUCTION_WORDING =
  /\b(instructions?|you (?:are|should|must|may)|when (?:answering|responding|summari[sz]ing)|do not|don't|ignore|always|never)\b/i;
const BOILERPLATE = [
  'script',
  'style',
  'noscript',
  'template',
  'svg',
  'nav',
  'footer',
  'aside',
  'form',
  '[role=navigation]',
  '[role=banner]',
  '[role=contentinfo]',
  '[role=search]',
  '[aria-hidden=true]',
  '[hidden]',
  '[class*=cookie]',
  '[id*=cookie]',
  '[class*=comment]',
  '[id*=comment]',
  '[class*=breadcrumb]'
].join(', ');
/** Containers a site marks as its content. Inside one, a `header` is the content's own (its title), not page chrome. */
const MARKED_CONTENT = 'main, article, [role=main]';
const LABEL_WORD_LIST = 'outdated|archived|deprecated|legacy|obsolete|beta|new';
/**
 * A label word marks a page only where a title uses it as a marker: "Install (Legacy)", "[Deprecated] Install",
 * "Legacy: Install", "Install – Archived". "The new app and the legacy app compared" mentions them; it is not marked.
 */
const TITLE_MARKER = new RegExp(
  `[([]\\s*(${LABEL_WORD_LIST})\\s*[)\\]]|^\\s*(${LABEL_WORD_LIST})\\s*[:–—-]\\s|\\s[:–—-]\\s*(${LABEL_WORD_LIST})\\s*$`,
  'gi'
);
const LABEL_WORDS = new RegExp(`\\b(${LABEL_WORD_LIST})\\b`, 'gi');
/** How many trailing path segments of a URL can name the section a page shows: `tag/operation`. */
const SECTION_PATH_DEPTH = 3;

/**
 * Removes a first paragraph that addresses AI agents with instructions, which some sites put at the top of Markdown
 * and llms files. Leaves every other paragraph alone.
 */
export function stripAgentPreamble(text: string): string {
  const trimmed = text.trimStart();
  const firstBreak = trimmed.search(/\n\s*\n/);
  const first = firstBreak < 0 ? trimmed : trimmed.slice(0, firstBreak);
  const isPreamble = first.length <= 1500 && AI_ADDRESSEE.test(first) && INSTRUCTION_WORDING.test(first);
  if (!isPreamble || firstBreak < 0) return trimmed;

  return trimmed.slice(firstBreak).trimStart();
}

/** A page that returns 200 but only fills itself in with scripts. */
export function isShell(response: FetchResponse): boolean {
  const hasScripts = /<script\b/i.test(response.body);

  return response.status === 200 && hasScripts && visibleTextLength(response.body) < SHELL_TEXT_CHARS;
}

export const MARKDOWN_FORMS = ['advertised', 'self', 'sibling'] as const;

/** Where a page's Markdown is: an advertised alternate, the page itself asked for Markdown, or a `.md` sibling. */
export type MarkdownForm = (typeof MARKDOWN_FORMS)[number];

function markdownCandidateForms(url: string, html: string | null): Array<{ form: MarkdownForm; url: string }> {
  const candidates: Array<{ form: MarkdownForm; url: string }> = [];
  const advertised =
    html?.match(/<link[^>]+type=["']text\/markdown["'][^>]*href=["']([^"']+)/i)?.[1] ??
    html?.match(/<link[^>]+href=["']([^"']+)["'][^>]*type=["']text\/markdown["']/i)?.[1];
  if (advertised) candidates.push({ form: 'advertised', url: new URL(advertised, url).href });
  candidates.push({ form: 'self', url });

  const parsed = new URL(url);
  if (parsed.pathname !== '/' && !parsed.pathname.endsWith('.md')) {
    parsed.pathname = `${parsed.pathname.replace(/\/$/, '')}.md`;
    candidates.push({ form: 'sibling', url: parsed.href });
  }

  return candidates.filter(
    (candidate, index) => candidates.findIndex((other) => other.url === candidate.url) === index
  );
}

/** Candidate URLs for the Markdown a site offers for a page: an advertised alternate, the page itself, a `.md` sibling. */
export function markdownCandidates(url: string, html: string | null): string[] {
  return markdownCandidateForms(url, html).map((candidate) => candidate.url);
}

/**
 * Markdown the site itself offers for a page, verified by its content type. The form that worked on an earlier page of
 * the same source is tried first; the others are still tried when it fails.
 */
export async function markdownVersion(
  fetcher: Fetcher,
  url: string,
  html: string | null,
  preferred: MarkdownForm | null = null
): Promise<{ content: PageContent; form: MarkdownForm } | null> {
  const candidates = markdownCandidateForms(url, html).sort(
    (left, right) => Number(right.form === preferred) - Number(left.form === preferred)
  );

  for (const candidate of candidates) {
    try {
      const response = await fetcher.get(candidate.url, { accept: 'text/markdown' });
      const isMarkdown = (response.headers['content-type'] ?? '').includes('markdown');
      const text = stripAgentPreamble(response.body.trim());
      if (response.status === 200 && isMarkdown && text.length >= MIN_CONTENT_CHARS) {
        return { content: { format: 'markdown', text }, form: candidate.form };
      }
    } catch {
      continue;
    }
  }

  return null;
}

function jsonBlobs($: cheerio.CheerioAPI): unknown[] {
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

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * The longest HTML or Markdown string in page data whose object also carries the page's title. Works on JSON-LD
 * (`articleBody`) and on any page-state JSON, without knowing its schema.
 */
export function bodyFromPageData(blobs: unknown[], title: string): PageContent | null {
  const wanted = normalizeTitle(title);
  let best: PageContent | null = null;
  const seen = new Set<unknown>();

  const visit = (value: unknown): void => {
    if (!value || typeof value !== 'object' || seen.has(value)) return;
    seen.add(value);
    if (Array.isArray(value)) {
      value.forEach(visit);

      return;
    }

    const record = value as Record<string, unknown>;
    const titles = ['title', 'name', 'headline'].map((key) => record[key]).filter((entry) => typeof entry === 'string');
    const matchesTitle = titles.some((entry) => normalizeTitle(entry as string) === wanted);

    if (matchesTitle) {
      for (const [key, entry] of Object.entries(record)) {
        if (typeof entry !== 'string' || entry.length < MIN_CONTENT_CHARS) continue;
        if (!/body|content|html|markdown|text/i.test(key)) continue;

        const format: PageContent['format'] = /<\/?(p|h\d|ul|ol|div|table)\b/i.test(entry) ? 'html' : 'markdown';
        if (!best || entry.length > best.text.length) best = { format, text: entry };
      }
    }

    Object.values(record).forEach(visit);
  };

  blobs.forEach(visit);

  return best;
}

export function structuredDataBody(html: string, title: string, observedJson: unknown[] = []): PageContent | null {
  return bodyFromPageData([...jsonBlobs(cheerio.load(html)), ...observedJson], title);
}

interface DomNode {
  type: string;
  name?: string;
  data?: string;
  children?: DomNode[];
}

interface TextWeight {
  text: number;
  linkText: number;
}

function collapsedText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function decodedSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/**
 * The section a page's URL names, on a page that holds many sections and shows one: the element whose `id` is the
 * URL's last path segments and whose first heading is the page's own `<title>`. Generated API references serve the
 * whole API at every operation's URL; their `h1` and `main` belong to the API, not to the page asked for.
 */
function namedSection(
  $: cheerio.CheerioAPI,
  pageUrl: string | undefined
): { element: DomNode; heading: string } | null {
  if (!pageUrl) return null;

  const title = collapsedText($('title').first().text()).toLowerCase();
  if (!title) return null;

  const segments = new URL(pageUrl).pathname.split('/').filter(Boolean).map(decodedSegment);
  const wanted = new Set<string>();
  for (let depth = 1; depth <= Math.min(SECTION_PATH_DEPTH, segments.length); depth++) {
    wanted.add(segments.slice(-depth).join('/'));
  }

  for (const element of $('[id]').toArray()) {
    if (!wanted.has($(element).attr('id') ?? '')) continue;

    const heading = collapsedText($(element).find('h1, h2, h3, h4, h5, h6').first().text());
    const lowered = heading.toLowerCase();
    if (heading && (title === lowered || title.split(/\s+[|·–—-]\s+/)[0] === lowered)) {
      return { element: element as unknown as DomNode, heading };
    }
  }

  return null;
}

/** Text and link-text length of every element under `root`, children before parents, without recursion: pages nest deep. */
function measure(root: DomNode, weights: Map<DomNode, TextWeight>): TextWeight {
  const textLength = (node: DomNode) => (node.data ?? '').replace(/\s+/g, ' ').trim().length;
  const stack: Array<{ node: DomNode; visited: boolean }> = [{ node: root, visited: false }];

  while (stack.length) {
    const entry = stack.pop()!;
    if (entry.node.type === 'text') continue;

    if (!entry.visited) {
      stack.push({ node: entry.node, visited: true });
      for (const child of entry.node.children ?? []) stack.push({ node: child, visited: false });
      continue;
    }

    const total: TextWeight = { text: 0, linkText: 0 };
    for (const child of entry.node.children ?? []) {
      const weight = child.type === 'text' ? { text: textLength(child), linkText: 0 } : weights.get(child);
      total.text += weight?.text ?? 0;
      total.linkText += weight?.linkText ?? 0;
    }
    if (entry.node.name === 'a') total.linkText = total.text;
    weights.set(entry.node, total);
  }

  return root.type === 'text' ? { text: textLength(root), linkText: 0 } : weights.get(root)!;
}

/**
 * The page's main content. The section its URL names wins on a page that holds many (`namedSection`). When the site
 * marks its content (`main`, `article`, `[role=main]`), the innermost marked container holding the page's `h1` wins,
 * and it only needs enough text: links inside it are content, not a menu. Otherwise the densest block of text, scored
 * against its link text.
 */
export function mainContent(html: string, pageUrl?: string): PageContent | null {
  const $ = cheerio.load(html);
  $(BOILERPLATE).remove();
  $('header')
    .filter((_, header) => !$(header).parents(MARKED_CONTENT).length)
    .remove();

  const nodes = (selector: string) => $(selector).toArray() as unknown as DomNode[];
  const weights = new Map<DomNode, TextWeight>();
  const body = nodes('body')[0] ?? ($.root().toArray()[0] as unknown as DomNode | undefined);
  if (!body) return null;
  measure(body, weights);

  const score = (element: DomNode) => {
    const weight = weights.get(element) ?? { text: 0, linkText: 0 };

    return weight.text - weight.linkText * 2;
  };

  const named = namedSection($, pageUrl);
  const explicit = named ? [named.element] : nodes(MARKED_CONTENT);
  const heading = nodes('h1')[0];
  const holdsHeading = (element: DomNode) => !!heading && $(element as never).find(heading as never).length > 0;
  const innermostWithHeading = explicit.filter(
    (element) =>
      holdsHeading(element) &&
      !explicit.some(
        (other) => other !== element && $(element as never).find(other as never).length && holdsHeading(other)
      )
  );
  let chosen: DomNode | undefined;
  if (innermostWithHeading.length) {
    chosen = innermostWithHeading[0];
  } else if (explicit.length) {
    chosen = explicit.sort((left, right) => score(right) - score(left))[0];
  } else {
    const blocks = nodes('div, section, td');
    const best = blocks.reduce((highest, block) => Math.max(highest, score(block)), 0);
    const close = blocks.filter((block) => score(block) >= best * 0.8);
    chosen = close.sort((left, right) => (weights.get(left)?.text ?? 0) - (weights.get(right)?.text ?? 0))[0] ?? body;
  }

  const isMarked = !!chosen && explicit.includes(chosen);
  const enough = isMarked
    ? (weights.get(chosen!)?.text ?? 0) >= MIN_CONTENT_CHARS
    : !!chosen && score(chosen) >= MIN_CONTENT_CHARS;
  if (!chosen || !enough) return null;

  const contentHtml = ($(chosen as never).html() ?? '').trim();

  return contentHtml ? { format: 'html', text: contentHtml } : null;
}

/**
 * Whether a page holds too little text to teach anything, outside its chrome: a stub, a placeholder, or a section with
 * a title and one line. Pages like these are empty, not failures to read; script shells are told apart before this.
 */
export function holdsLittleText(html: string, pageUrl: string): boolean {
  const $ = cheerio.load(html);
  $(BOILERPLATE).remove();
  const named = namedSection($, pageUrl);
  const text = named ? $(named.element as never).text() : $('body').text();

  return collapsedText(text).length < MIN_CONTENT_CHARS;
}

/** The page without navigation, header, footer and similar chrome: its main area, else its body. */
export function listingHtml(html: string): string {
  const $ = cheerio.load(html);
  $(BOILERPLATE).remove();
  const main = $('main, article, [role=main]').first();

  return ((main.length ? main.html() : $('body').html()) ?? '').trim();
}

export function plainText(content: PageContent): string {
  const text = content.format === 'html' ? cheerio.load(content.text).root().text() : content.text;

  return text.replace(/\s+/g, ' ').trim();
}

/** Whether content can be trusted as the page: enough text, not a login or anti-bot page, and about the page's title. */
export function verifyContent(response: FetchResponse, content: PageContent, expectedTitle: string | null): boolean {
  if (isBotChallenge(response) || isLoginWall(response)) return false;

  const text = plainText(content).toLowerCase();
  if (text.length < MIN_CONTENT_CHARS) return false;
  if (!expectedTitle) return true;

  const words = expectedTitle
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length > 3);

  return words.length === 0 || words.some((word) => text.includes(word));
}

/**
 * The page's own heading: the heading of the section its URL names; on a page with several `h1` (each a section's
 * heading), the heading that repeats its `<title>`; else its `h1`, else the first heading of its marked content, else
 * its `<title>` without the site name.
 */
export function pageHeading(html: string, pageUrl?: string): string | null {
  const $ = cheerio.load(html);
  const named = namedSection($, pageUrl);
  if (named) return named.heading;

  const title = pageTitle(html);
  const ownTitle = title ? title.split(/\s+[|·–—-]\s+/)[0].trim() || title : null;
  const headingTexts = $('h1, h2, h3, h4, h5, h6')
    .toArray()
    .map((element) => collapsedText($(element).text()));
  const titleHeading = headingTexts.find((text) => text.toLowerCase() === ownTitle?.toLowerCase());
  if ($('h1').length > 1 && titleHeading) return titleHeading;

  const firstMarkedHeading = $(MARKED_CONTENT).first().find('h1, h2, h3, h4, h5, h6').first();
  const heading =
    collapsedText($('main h1, article h1, [role=main] h1, h1').first().text()) ||
    collapsedText(firstMarkedHeading.text());

  return heading || ownTitle;
}

/** The canonical URL a page declares, when it is on the same site; else the page's own URL. */
export function canonicalOf(html: string, pageUrl: string): string {
  const href =
    html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)/i)?.[1] ??
    html.match(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["']canonical["']/i)?.[1];
  if (!href) return pageUrl;

  try {
    const canonical = new URL(href, pageUrl);
    const sameSite = registrableDomain(canonical.hostname) === registrableDomain(new URL(pageUrl).hostname);

    return sameSite ? canonical.href : pageUrl;
  } catch {
    return pageUrl;
  }
}

export function pageLinks(html: string, pageUrl: string): PageLink[] {
  const $ = cheerio.load(html);
  const links = new Map<string, PageLink>();

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (!href || /^(javascript|mailto|tel|data):/i.test(href)) return;

    try {
      const url = new URL(href, pageUrl);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
      url.hash = '';
      const text = $(element).text().replace(/\s+/g, ' ').trim();
      if (!links.has(url.href)) links.set(url.href, { url: url.href, text });
    } catch {
      return;
    }
  });

  return [...links.values()];
}

/** The modification date a page declares in its metadata, or the server's `Last-Modified`. */
export function updatedAtOf(html: string, headers: Record<string, string>): string | null {
  const meta =
    html.match(/<meta[^>]+property=["']article:modified_time["'][^>]*content=["']([^"']+)/i)?.[1] ??
    html.match(/"dateModified"\s*:\s*"([^"]+)"/)?.[1];
  const value = meta ?? headers['last-modified'] ?? null;
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** Flags the page shows about itself (outdated, archived, deprecated, …), from its title, badges and robots meta. */
export function labelsOf(html: string, title: string): string[] {
  const $ = cheerio.load(html);
  const labels = new Set<string>();
  const badgeText = $('main, article, [role=main], body')
    .first()
    .find('[class*=badge], [class*=label], [class*=tag], [class*=status]')
    .slice(0, 20)
    .text();

  for (const match of badgeText.matchAll(LABEL_WORDS)) labels.add(match[1].toLowerCase());
  for (const match of title.matchAll(TITLE_MARKER)) labels.add((match[1] ?? match[2] ?? match[3]).toLowerCase());
  if (/<meta[^>]+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)) labels.add('noindex');

  return [...labels];
}
