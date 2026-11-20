/**
 * Establishes the site sample's ground truth: the organisations' real help, docs and academy sources and the
 * number of public pages each publishes, read from the sites' own sitemaps, llms.txt files and link indexes.
 * Evaluation tooling only; it never ships.
 * Sites run in parallel (`--concurrency`, default 6); requests to one host stay one at a time, 300 ms apart.
 * Each host's robots.txt crawl delay is honoured (capped at 10 s). `--reuse-hours=N` keeps the inventory of a source
 * whose root is unchanged and was collected less than N hours ago, so a re-run after a review only fetches what changed.
 * Run: node eval/collect-truth.mjs [--sites=sites-icp.json] [--only=domain,...] [--concurrency=6] [--reuse-hours=N] [--write]
 */
import dns from 'node:dns';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

import * as cheerio from 'cheerio';
import { getDomain } from 'tldts';

import { parseRobots } from '../dist/index.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = join(ROOT, 'eval-data');
const USER_AGENT = 'ClassroomIO-CourseBuilder-Eval/1.0 (+https://classroomio.com)';
const REQUEST_TIMEOUT_MS = 25_000;
const MAX_BODY_BYTES = 4_000_000;
const MAX_SITEMAP_BYTES = 40_000_000;
const MAX_SITEMAP_FILES = 2_000;
const MAX_SITEMAP_URLS = 400_000;
const MAX_CRAWL_FETCHES = 150;
const MAX_CRAWL_URLS = 4_000;
const MAX_LLMS_CHILDREN = 80;
const PROBE_LABELS = ['help', 'support', 'docs', 'kb', 'knowledge', 'helpcenter', 'academy', 'learn', 'community'];
const KIND_WORDS = [
  ['help-center', /^(help|support|kb|knowledge|knowledgebase|knowledge-base|helpcenter|help-center|hc|faq|faqs)$/],
  ['docs', /^(docs|doc|documentation|developer|developers|guides|manual|reference)$/],
  ['academy', /^(academy|learn|training|university|education|tutorials)$/],
  ['community', /^(community|forum|forums)$/]
];
const KIND_TEXT = [
  ['help-center', /\b(help ?cent(er|re)|support cent(er|re)|knowledge ?base|help|faqs?)\b/i],
  ['docs', /\b(docs|documentation|developer docs|user guides?|guides|manual)\b/i],
  ['academy', /\b(academy|training|tutorials|learning cent(er|re)|university)\b/i],
  ['community', /\b(community|forum)\b/i]
];
const ASSET_FILE =
  /\.(?:png|jpe?g|gif|svg|webp|avif|ico|bmp|tiff?|css|js|mjs|map|json|xml|txt|zip|gz|tgz|rar|woff2?|ttf|otf|eot|mp4|m4v|webm|mov|mp3|wav|pdf|docx?|xlsx?|pptx?)$/i;

const hostChains = new Map();
const robotsCache = new Map();
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const TRANSIENT_DNS_ERRORS = new Set(['ENOTFOUND', 'EAI_AGAIN', 'ETIMEOUT', 'ESERVFAIL']);
const systemLookup = dns.lookup;
const lookupCache = new Map();

function lookupWithRetry(hostname, options, attempt = 0) {
  return new Promise((resolve, reject) => {
    systemLookup(hostname, options, (error, address, family) => (error ? reject(error) : resolve({ address, family })));
  }).catch(async (error) => {
    if (attempt >= 2 || !TRANSIENT_DNS_ERRORS.has(error.code)) throw error;

    await delay(1_000 * 2 ** attempt);

    return lookupWithRetry(hostname, options, attempt + 1);
  });
}

/**
 * Resolves each host once per run, retrying transient failures, so parallel sites don't flood the resolver.
 * Node's built-in fetch resolves through `dns.lookup`, so replacing it covers every request.
 */
function cachedLookup(hostname, options, callback) {
  const done = typeof options === 'function' ? options : callback;
  const settings =
    typeof options === 'number' ? { family: options } : typeof options === 'object' ? { ...options } : {};
  const key = `${hostname}|${settings.family ?? 0}|${settings.all ? 'all' : 'one'}|${settings.hints ?? 0}`;
  let pending = lookupCache.get(key);
  if (!pending) {
    pending = lookupWithRetry(hostname, settings);
    lookupCache.set(key, pending);
  }

  pending.then(
    (result) => (settings.all ? done(null, result.address) : done(null, result.address, result.family)),
    (error) => done(error)
  );
}

dns.lookup = cachedLookup;

function args() {
  const parsed = {
    only: null,
    write: false,
    concurrency: 6,
    reuseHours: 0,
    sitesPath: join(ROOT, 'eval', 'sites-icp.json')
  };

  for (const arg of process.argv.slice(2)) {
    if (arg === '--write') parsed.write = true;
    else if (arg.startsWith('--reuse-hours=')) parsed.reuseHours = Number(arg.slice('--reuse-hours='.length)) || 0;
    else if (arg.startsWith('--concurrency=')) parsed.concurrency = Number(arg.slice('--concurrency='.length)) || 6;
    else if (arg.startsWith('--sites=')) parsed.sitesPath = join(ROOT, 'eval', arg.slice('--sites='.length));
    else if (arg.startsWith('--only='))
      parsed.only = arg
        .slice('--only='.length)
        .split(',')
        .map((value) => value.trim());
  }

  return parsed;
}

const MIN_GAP_MS = 300;
const MAX_CRAWL_DELAY_MS = 10_000;
const PRODUCT_TOKEN = 'ClassroomIO-CourseBuilder-Eval';
const robotsTexts = new Map();

function robotsFor(origin) {
  if (!robotsTexts.has(origin)) robotsTexts.set(origin, rawRequest(`${origin}/robots.txt`, 'text/plain'));

  return robotsTexts.get(origin);
}

async function crawlGapMs(origin) {
  const robots = await robotsFor(origin);
  if (robots.status !== 200) return MIN_GAP_MS;

  const { crawlDelayMs } = parseRobots(`${origin}/robots.txt`, robots.text, PRODUCT_TOKEN);

  return Math.max(MIN_GAP_MS, Math.min(crawlDelayMs, MAX_CRAWL_DELAY_MS));
}

async function request(url, accept = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', options = {}) {
  const maxBytes = options.maxBytes ?? MAX_BODY_BYTES;
  if (options.polite === false) return rawRequest(url, accept, maxBytes);

  const origin = new URL(url).origin;
  const previous = hostChains.get(origin) ?? Promise.resolve();
  const run = previous.then(async () => {
    await delay(await crawlGapMs(origin));

    return rawRequest(url, accept, maxBytes);
  });

  hostChains.set(
    origin,
    run.catch(() => {})
  );

  return run;
}

async function rawRequest(url, accept, maxBytes = MAX_BODY_BYTES) {
  let last = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    last = await fetchOnce(url, accept, maxBytes);
    if (last.status !== 0 && last.status !== 429 && last.status < 500) return last;
    if (attempt === 0) await delay(2_000);
  }

  return last;
}

async function fetchOnce(url, accept, maxBytes) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: { 'user-agent': USER_AGENT, accept, 'accept-language': 'en' },
      redirect: 'follow',
      signal: controller.signal
    });
    const buffer = Buffer.from(await response.arrayBuffer());
    let text = buffer.subarray(0, maxBytes).toString('utf8');
    const contentType = response.headers.get('content-type') ?? '';

    if (/\.gz($|\?)/i.test(url) || contentType.includes('gzip')) {
      try {
        text = gunzipSync(buffer).toString('utf8').slice(0, maxBytes);
      } catch {
        text = '';
      }
    }

    return { url: response.url || url, status: response.status, contentType, text };
  } catch (error) {
    return { url, status: 0, contentType: '', text: '', error: String(error) };
  } finally {
    clearTimeout(timer);
  }
}

const MAX_SITEMAP_REQUESTS_PER_HOST = 4;
const activeSitemapRequests = new Map();

async function sitemapRequest(url) {
  const origin = new URL(url).origin;
  if ((await crawlGapMs(origin)) > MIN_GAP_MS) {
    return request(url, 'application/xml,text/xml,*/*', { maxBytes: MAX_SITEMAP_BYTES });
  }

  const host = new URL(url).host;
  while ((activeSitemapRequests.get(host) ?? 0) >= MAX_SITEMAP_REQUESTS_PER_HOST) await delay(50);
  activeSitemapRequests.set(host, (activeSitemapRequests.get(host) ?? 0) + 1);

  try {
    return await rawRequest(url, 'application/xml,text/xml,*/*', MAX_SITEMAP_BYTES);
  } finally {
    activeSitemapRequests.set(host, activeSitemapRequests.get(host) - 1);
  }
}

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function registrableDomain(host) {
  return getDomain(host) ?? host.toLowerCase().replace(/^www\./, '');
}

function brandNames(name, domain) {
  const names = new Set([normalize(name), normalize(domain.split('.')[0])]);
  names.delete('');

  return [...names];
}

function mentionsBrand(html, name, domain) {
  const haystack = normalize(html.slice(0, 400_000));

  return brandNames(name, domain).some((slug) => haystack.includes(slug));
}

function identifiesAsBrand(html, name, domain) {
  const $ = cheerio.load(html.slice(0, 400_000));
  const head = [
    $('title').first().text(),
    $('meta[property="og:site_name"]').attr('content') ?? '',
    $('meta[name="application-name"]').attr('content') ?? ''
  ].join(' ');
  const haystack = normalize(head);

  return brandNames(name, domain).some((slug) => haystack.includes(slug));
}

function kindFromWord(word) {
  const lowered = word.toLowerCase();
  const match = KIND_WORDS.find(([, pattern]) => pattern.test(lowered));

  return match ? match[0] : null;
}

function kindFromHost(host) {
  return kindFromWord(host.split('.')[0] ?? '');
}

function kindFromPath(url) {
  const segments = new URL(url).pathname.split('/').filter(Boolean);

  return segments[0] ? kindFromWord(segments[0]) : null;
}

function kindFromText(text) {
  const match = KIND_TEXT.find(([, pattern]) => pattern.test(text));

  return match ? match[0] : null;
}

function absoluteUrl(href, baseUrl) {
  if (!href || /^(javascript|mailto|tel):/i.test(href)) return null;

  try {
    const url = new URL(href, baseUrl);
    url.hash = '';

    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

function normalizeUrl(value) {
  const url = new URL(value);
  if (!url.hash.startsWith('#!')) url.hash = '';
  url.hostname = url.hostname.toLowerCase();

  if (url.pathname.length > 1 && url.pathname.endsWith('/')) url.pathname = url.pathname.slice(0, -1);

  return url.href;
}

function decodeXml(value) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function sameHost(left, right) {
  return registrableDomain(left) === registrableDomain(right);
}

function withinRoot(url, root) {
  const target = new URL(url);
  const base = new URL(root);
  const bareHost = (host) => host.toLowerCase().replace(/^www\./, '');
  if (bareHost(target.hostname) !== bareHost(base.hostname)) return false;

  const basePath = base.pathname === '/' ? '/' : base.pathname.replace(/\/$/, '');

  return basePath === '/' || target.pathname === basePath || target.pathname.startsWith(`${basePath}/`);
}

/** Sign-in and sign-up URLs are never content, though crawls and some sitemaps list one per protected page. */
const SIGN_IN_PATH = /\/(?:log-?in|sign[-_]?in|sign[-_]?up|register|sso)\/?$/i;

function pageUrls(urls, root, pageExclude) {
  const excludes = (pageExclude ?? []).map((pattern) => new RegExp(pattern, 'i'));
  const seen = new Set();
  const pages = [];

  for (const value of urls) {
    let url;

    try {
      url = new URL(value);
    } catch {
      continue;
    }

    if (!/^https?:$/.test(url.protocol)) continue;
    if (!withinRoot(url.href, root)) continue;
    if (ASSET_FILE.test(url.pathname)) continue;
    if (SIGN_IN_PATH.test(url.pathname)) continue;
    if (excludes.some((pattern) => pattern.test(url.href))) continue;

    const normalized = normalizeUrl(url.href);
    if (seen.has(normalized)) continue;

    seen.add(normalized);
    pages.push(normalized);
  }

  pages.sort();

  return pages;
}

const LOCALE_PREFIXES = new Set([
  'hc',
  'help',
  'support',
  'kb',
  'knowledge',
  'docs',
  'articles',
  'manual',
  'reference'
]);
const LANGUAGE_CODES = new Set(
  'aa ab ae af ak am an ar as av ay az ba be bg bh bi bm bn bo br bs ca ce ch co cr cs cu cv cy da de dv dz ee el en eo es et eu fa ff fi fj fo fr fy ga gd gl gn gu gv ha he hi ho hr ht hu hy hz ia id ie ig ii ik io is it iu ja jv ka kg ki kj kk kl km kn ko kr ks ku kv kw ky la lb lg li ln lo lt lu lv mg mh mi mk ml mn mr ms mt my na nb nd ne ng nl nn no nr nv ny oc oj om or os pa pi pl ps pt qu rm rn ro ru rw sa sc sd se sg si sk sl sm sn so sq sr ss st su sv sw ta te tg th ti tk tl tn to tr ts tt tw ty ug uk ur uz ve vi vo wa wo xh yi yo za zh zu'.split(
    ' '
  )
);

function isLocaleSegment(value) {
  if (!value) return false;
  if (/^[a-z]{2}-[a-z][a-z]$/i.test(value)) return true;

  return LANGUAGE_CODES.has(value.toLowerCase());
}

function firstLocale(url) {
  const segments = new URL(url).pathname.split('/').filter(Boolean);
  const head = (segments[0] ?? '').toLowerCase();

  if (!LOCALE_PREFIXES.has(head) && isLocaleSegment(segments[0])) return segments[0].toLowerCase();
  if (LOCALE_PREFIXES.has(head) && isLocaleSegment(segments[1])) return segments[1].toLowerCase();

  const parsed = new URL(url);
  for (const key of ['language', 'lang', 'locale', 'hl']) {
    const value = parsed.searchParams.get(key);
    if (value && /^[a-z]{2}(?:[-_][a-z]{2})?$/i.test(value)) return value.toLowerCase().replace('_', '-');
  }

  const hyphenated = segments.find((segment) => /^[a-z]{2}-[a-z][a-z]$/i.test(segment));

  return hyphenated ? hyphenated.toLowerCase() : null;
}

function baseLang(value) {
  return value ? value.toLowerCase().split('-')[0] : null;
}

function chooseLocale(pages, landingUrl, htmlLang) {
  const localeOf = new Map(pages.map((page) => [page, firstLocale(page)]));
  const counts = new Map();

  for (const locale of localeOf.values()) {
    if (locale) counts.set(locale, (counts.get(locale) ?? 0) + 1);
  }

  if (counts.size < 2) return { locale: null, pages };

  const findFamily = (want) => {
    const family = [...counts.entries()].filter(([locale]) => locale === want || locale.startsWith(`${want}-`));
    if (family.length === 0) return null;

    return family.sort((left, right) => right[1] - left[1])[0][0];
  };
  const landingLocale = firstLocale(landingUrl);
  const language = baseLang(htmlLang);
  const chosen = findFamily('en') ?? (language && findFamily(language)) ?? (landingLocale && findFamily(landingLocale));

  if (chosen) {
    return { locale: chosen, pages: pages.filter((page) => localeOf.get(page) === chosen) };
  }

  if (language) {
    const sameLanguage = pages.filter((page) => {
      const locale = localeOf.get(page);

      return !locale || baseLang(locale) === language;
    });

    if (sameLanguage.length > 0 && sameLanguage.length < pages.length) return { locale: language, pages: sameLanguage };
  }

  const [mostCommon] = [...counts.entries()].sort((left, right) => right[1] - left[1]);
  if (mostCommon[1] / pages.length >= 0.5) {
    return { locale: mostCommon[0], pages: pages.filter((page) => localeOf.get(page) === mostCommon[0]) };
  }

  return { locale: null, pages };
}

function robotsSitemaps(origin) {
  if (!robotsCache.has(origin)) robotsCache.set(origin, readRobotsSitemaps(origin));

  return robotsCache.get(origin);
}

async function readRobotsSitemaps(origin) {
  const response = await robotsFor(origin);
  const sitemaps = [];

  if (response.status === 200) {
    for (const line of response.text.split(/\r?\n/)) {
      const match = line.match(/^\s*sitemap\s*:\s*(\S+)/i);
      if (match) sitemaps.push(match[1]);
    }
  }

  return { sitemaps: [...new Set(sitemaps)] };
}

async function readSitemapTree(startUrl, state) {
  if (!startUrl || state.files >= MAX_SITEMAP_FILES || state.urls.size >= MAX_SITEMAP_URLS) return;
  if (state.visited.has(startUrl)) return;

  state.visited.add(startUrl);
  state.files += 1;

  const response = await sitemapRequest(startUrl);
  if (response.status !== 200 || !response.text) return;

  const text = response.text;
  const isIndex = /<sitemapindex[\s>]/i.test(text);
  const locations = [...text.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) => decodeXml(match[1].trim()));

  if (!isIndex) {
    for (const location of locations) {
      if (state.urls.size >= MAX_SITEMAP_URLS) break;
      state.urls.add(location);
    }

    return;
  }

  await Promise.all(locations.map((child) => readSitemapTree(child, state)));
}

async function inventoryFromSitemaps(root) {
  const origin = new URL(root).origin;
  const rootBase = root.replace(/\/$/, '');
  const robots = await robotsSitemaps(origin);
  const sitemaps = [...robots.sitemaps];

  if (sitemaps.length === 0) {
    const candidates = [
      ...new Set([
        `${rootBase}/sitemap.xml`,
        `${rootBase}/sitemap_index.xml`,
        `${rootBase}/sitemap-index.xml`,
        `${origin}/sitemap.xml`,
        `${origin}/sitemap_index.xml`,
        `${origin}/sitemap-index.xml`
      ])
    ];

    for (const candidate of candidates) {
      const response = await request(candidate, 'application/xml,text/xml,*/*');
      if (response.status === 200 && /<(urlset|sitemapindex)[\s>]/i.test(response.text)) {
        sitemaps.push(candidate);
        break;
      }
    }
  }

  const state = { urls: new Set(), visited: new Set(), files: 0 };
  for (const sitemap of sitemaps) await readSitemapTree(sitemap, state);

  return { sitemaps, urls: [...state.urls] };
}

function isTextFile(value) {
  try {
    return /\.txt$/i.test(new URL(value).pathname);
  } catch {
    return false;
  }
}

function llmsLinks(text) {
  const links = [];
  for (const match of text.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)) links.push(match[1]);
  for (const match of text.matchAll(/^\s*-\s+(https?:\/\/\S+)/gm)) links.push(match[1]);

  return links;
}

async function linksFromLlmsTxt(root) {
  const candidates = [`${root.replace(/\/$/, '')}/llms.txt`, `${new URL(root).origin}/llms.txt`];
  let response = null;

  for (const candidate of candidates) {
    const attempt = await request(candidate, 'text/plain');
    if (attempt.status === 200) {
      response = attempt;
      break;
    }
  }

  if (!response) return { url: null, links: [] };

  const links = llmsLinks(response.text);
  const rootHost = new URL(root).hostname;
  const children = [...new Set(links.filter((link) => isTextFile(link) && sameHost(new URL(link).hostname, rootHost)))];

  for (const child of children.slice(0, MAX_LLMS_CHILDREN)) {
    const attempt = await request(child, 'text/plain');
    if (attempt.status !== 200) continue;

    for (const link of llmsLinks(attempt.text)) links.push(link);
  }

  return { url: response.url, links };
}

async function crawl(root, landing, maxFetches = MAX_CRAWL_FETCHES) {
  const startedAt = Date.now();
  const queue = [normalizeUrl(landing)];
  const seen = new Set(queue);
  const pages = [];
  let networkFailures = 0;

  while (queue.length && pages.length < MAX_CRAWL_URLS && seen.size <= MAX_CRAWL_URLS + maxFetches) {
    const url = queue.shift();
    if (ASSET_FILE.test(new URL(url).pathname)) continue;
    if (pages.length >= maxFetches) {
      pages.push(url);
      continue;
    }

    const response = await request(url);
    if (response.status === 0) {
      networkFailures += 1;
      if (networkFailures >= 3) break;
      continue;
    }

    networkFailures = 0;
    if (response.status !== 200 || !response.contentType.includes('html')) continue;

    pages.push(normalizeUrl(response.url));

    const $ = cheerio.load(response.text);
    $('a[href]').each((_, element) => {
      const target = absoluteUrl($(element).attr('href'), response.url);
      if (!target) return;

      const normalized = normalizeUrl(target.href);
      if (seen.has(normalized) || !withinRoot(normalized, root) || ASSET_FILE.test(target.pathname)) return;
      if (seen.size >= MAX_CRAWL_URLS + maxFetches) return;

      seen.add(normalized);
      queue.push(normalized);
    });
  }

  if (Date.now() - startedAt > 20_000)
    console.error(`  crawl ${root} took ${((Date.now() - startedAt) / 1000).toFixed(0)}s`);

  return pages;
}

function classifyAccess(title, text, html) {
  const head = `${title} ${text.slice(0, 2000)}`;

  if (
    /just a moment|attention required|verify you are human|checking your browser|enable javascript and cookies|access denied|captcha|unusual traffic/i.test(
      head
    )
  ) {
    return 'challenge';
  }
  if (/^\s*(sign in|log in|login)\b/i.test(title) && text.length < 4000) return 'login';

  return 'open';
}

async function inspectLanding(url, name, domain, homepageUrl) {
  const response = await request(url);
  const blocked = [401, 403, 429, 503].includes(response.status);
  if (!blocked && (response.status < 200 || response.status >= 400))
    return { response, accepted: false, reason: `status-${response.status}` };
  if (
    !blocked &&
    !response.contentType.includes('html') &&
    !response.contentType.includes('markdown') &&
    !response.contentType.includes('text/plain')
  ) {
    return { response, accepted: false, reason: 'not-a-page' };
  }

  const html = response.text;
  const $ = cheerio.load(html);
  const title = $('title').first().text().replace(/\s+/g, ' ').trim();
  const text = $('body').text().replace(/\s+/g, ' ').trim();
  const lang = $('html').attr('lang') ?? null;
  const finalUrl = normalizeUrl(response.url);
  const homepageNormalized = normalizeUrl(homepageUrl);

  if (finalUrl === homepageNormalized) return { response, accepted: false, reason: 'same-as-homepage' };
  if (!blocked && text.length < 150) return { response, accepted: false, reason: 'empty', title, finalUrl };

  let linkCount = 0;
  $('a[href]').each((_, element) => {
    const target = absoluteUrl($(element).attr('href'), response.url);
    if (target && withinRoot(target.href, response.url)) linkCount += 1;
  });

  const access = blocked ? (response.status === 401 ? 'login' : 'challenge') : classifyAccess(title, text, html);
  const brand = identifiesAsBrand(html, name, domain) || mentionsBrand(html, name, domain);
  const titleSlug = normalize(title);

  return {
    response,
    accepted: true,
    blocked,
    finalUrl,
    title,
    text,
    lang,
    access,
    brand,
    linkCount,
    titleNamesKind: KIND_TEXT.some(([, pattern]) => pattern.test(titleSlug))
  };
}

function homepageSignals(html, baseUrl) {
  const $ = cheerio.load(html);
  const links = [];
  const youtube = new Set();

  $('a[href]').each((_, element) => {
    const text = $(element).text().replace(/\s+/g, ' ').trim();
    const target = absoluteUrl($(element).attr('href'), baseUrl);

    if (target) {
      if (/(?:^|\.)youtube\.com$/i.test(registrableDomain(target.hostname))) youtube.add(target.href.split('?')[0]);
      links.push({ url: target.href, text });
    }

    const raw = $(element).attr('href') ?? '';
    if (/youtube\.com\/(@|c\/|channel\/|user\/)/i.test(raw))
      youtube.add(absoluteUrl(raw, baseUrl)?.href.split('?')[0] ?? raw);
  });

  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      const data = JSON.parse($(element).text());
      const nodes = Array.isArray(data) ? data : [data];

      for (const node of nodes) {
        const sameAs = node?.sameAs;
        for (const value of Array.isArray(sameAs) ? sameAs : sameAs ? [sameAs] : []) {
          if (typeof value === 'string' && /youtube\.com/i.test(value)) youtube.add(value.split('?')[0]);
        }
      }
    } catch {}
  });

  return { links, youtube: [...youtube] };
}

function sourceRoot(candidateUrl, kind) {
  const url = new URL(candidateUrl);
  if (kindFromHost(url.hostname) === kind) return `${url.origin}/`;

  const segments = url.pathname.split('/').filter(Boolean);
  const kindIndex = segments.findIndex((segment) => kindFromWord(segment) === kind);

  return kindIndex >= 0 ? `${url.origin}/${segments.slice(0, kindIndex + 1).join('/')}` : url.href;
}

function candidateKinds(links, domain) {
  const candidates = [];

  for (const link of links) {
    const target = new URL(link.url);
    const own = registrableDomain(target.hostname) === domain;
    const hostKind = kindFromHost(target.hostname);
    const pathKind = kindFromPath(link.url);
    const textKind = link.text.length <= 40 ? kindFromText(link.text) : null;
    const kind = hostKind ?? pathKind ?? textKind;

    if (!kind) continue;
    if (!own && !textKind) continue;

    const url = hostKind ? `${target.origin}/` : pathKind ? sourceRoot(link.url, kind) : link.url;

    candidates.push({
      url,
      kind,
      foundVia: 'site-link',
      foundAt: link.url,
      own,
      text: link.text,
      kindEvidence: hostKind ? 'host' : pathKind ? 'path' : 'text'
    });
  }

  return candidates;
}

async function probeSubdomains(domain, name, homepageUrl) {
  const candidates = [];
  const probes = await Promise.all(
    PROBE_LABELS.map(async (label) => {
      const url = `https://${label}.${domain}/`;
      const response = await request(url).catch(() => null);

      return { label, url, response };
    })
  );

  for (const { label, url, response } of probes) {
    try {
      if (!response || response.status < 200 || response.status >= 400) continue;

      const html = response.text;
      if (!identifiesAsBrand(html, name, domain) && !mentionsBrand(html, name, domain)) continue;
      if (normalizeUrl(response.url) === normalizeUrl(homepageUrl)) continue;

      candidates.push({
        url: sourceRoot(response.url, kindFromHost(new URL(response.url).hostname) ?? label),
        kind: kindFromHost(new URL(response.url).hostname) ?? label,
        foundVia: 'subdomain-probe',
        foundAt: url,
        own: registrableDomain(new URL(response.url).hostname) === domain,
        text: '',
        kindEvidence: 'host'
      });
    } catch {}
  }

  return candidates;
}

function dedupeCandidates(candidates) {
  const byUrl = new Map();

  for (const candidate of candidates) {
    let key;

    try {
      key = normalizeUrl(candidate.url);
    } catch {
      continue;
    }

    const existing = byUrl.get(key);
    if (!existing || (existing.foundVia === 'subdomain-probe' && candidate.foundVia === 'site-link')) {
      byUrl.set(key, { ...candidate, url: key });
    }
  }

  return [...byUrl.values()];
}

function rootForLanding(candidate, landing) {
  if (candidate.rootUrlOverride) return candidate.rootUrlOverride;

  const original = new URL(candidate.url);
  const final = new URL(landing.finalUrl);
  if (candidate.kindEvidence !== 'text' && landing.access !== 'open' && final.hostname !== original.hostname) {
    return `${original.origin}/`;
  }

  if (candidate.kindEvidence === 'host') return `${final.origin}/`;
  if (candidate.kindEvidence === 'path') return sourceRoot(landing.finalUrl, candidate.kind);

  return landing.finalUrl;
}

async function overrideUrls(override) {
  const response = await rawRequest(override.url, 'text/plain,application/json,application/xml,*/*', MAX_SITEMAP_BYTES);
  if (response.status !== 200) return [];

  const locations = [...response.text.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) =>
    decodeXml(match[1].trim())
  );
  const lines = response.text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const listed = locations.length > 0 ? locations : lines;
  const urls =
    override.format === 'paths'
      ? listed.filter((line) => line.startsWith('/')).map((path) => `${override.prefix}${path}`)
      : listed.filter((line) => /^https?:\/\//.test(line));

  return urls.filter((line) => /^https?:\/\//.test(line));
}

async function sourceInventory(root, landingUrl, htmlLang, override, blocked = false, pageExclude) {
  if (override) {
    const urls = await overrideUrls(override);
    const allPages = pageUrls(urls, root, pageExclude);
    const chosen = chooseLocale(allPages, landingUrl, htmlLang);

    return {
      pages: chosen.pages,
      pageCountAllLocales: allPages.length,
      locale: chosen.locale,
      method: allPages.length > 0 ? 'override' : 'none',
      sitemapUrls: [],
      llmsTxtUrl: null
    };
  }

  const sitemapStartedAt = Date.now();
  const sitemaps = await inventoryFromSitemaps(root);
  const fromSitemaps = pageUrls(sitemaps.urls, root, pageExclude);
  if (Date.now() - sitemapStartedAt > 20_000) {
    console.error(
      `  sitemaps ${root} took ${((Date.now() - sitemapStartedAt) / 1000).toFixed(0)}s (${sitemaps.urls.length} urls)`
    );
  }

  if (fromSitemaps.length === 0) {
    if (blocked) {
      return {
        pages: [],
        pageCountAllLocales: 0,
        locale: null,
        method: 'none',
        sitemapUrls: sitemaps.sitemaps,
        llmsTxtUrl: null
      };
    }

    const llms = await linksFromLlmsTxt(root);
    const crawled = await crawl(root, landingUrl);
    const allPages = pageUrls([...sitemaps.urls, ...llms.links, ...crawled], root, pageExclude);
    const chosen = chooseLocale(allPages, landingUrl, htmlLang);
    const readable = chosen.pages.length > 1;

    return {
      pages: readable ? chosen.pages : [],
      pageCountAllLocales: allPages.length,
      locale: readable ? chosen.locale : null,
      method: readable ? (crawled.length ? 'link-crawl' : 'llms-txt') : 'none',
      sitemapUrls: sitemaps.sitemaps,
      llmsTxtUrl: llms.url
    };
  }

  const chosen = chooseLocale(fromSitemaps, landingUrl, htmlLang);

  return {
    pages: chosen.pages,
    pageCountAllLocales: fromSitemaps.length,
    locale: chosen.locale,
    method: 'sitemap',
    sitemapUrls: sitemaps.sitemaps,
    llmsTxtUrl: null
  };
}

/**
 * The inventory a source had in a recent run, filtered again with today's page rules. Only for a source with the same
 * root and a readable inventory; an override, or a source that could not be read last time, is always fetched again.
 */
function reusedInventory(previous, source, rootUrl, override, pageExclude) {
  if (!previous || override || previous.countMethod === 'none' || !previous.pages?.length) return null;

  const filtered = pageUrls(previous.pages, rootUrl, pageExclude);
  const chosen = chooseLocale(filtered, source.finalUrl ?? rootUrl, source.lang);
  const removed = previous.pages.length - filtered.length;

  return {
    pages: chosen.pages,
    pageCountAllLocales: Math.max(filtered.length, (previous.pageCountAllLocales ?? filtered.length) - removed),
    locale: chosen.locale ?? previous.locale,
    method: previous.countMethod,
    sitemapUrls: previous.sitemapUrls ?? [],
    llmsTxtUrl: previous.llmsTxtUrl ?? null,
    reusedFrom: previous.reusedFrom ?? previous.checkedAt
  };
}

async function previousSourcesOf(domain, reuseHours) {
  if (!reuseHours) return new Map();

  try {
    const previous = JSON.parse(await readFile(join(DATA_DIR, domain, 'truth.json'), 'utf8'));
    const ageHours = (Date.now() - Date.parse(previous.checkedAt)) / 3_600_000;
    if (!(ageHours < reuseHours)) return new Map();

    return new Map(previous.sources.map((source) => [source.url, { ...source, checkedAt: previous.checkedAt }]));
  } catch {
    return new Map();
  }
}

async function collectSite(domain, organisation, stats, curation = {}, previousSources = new Map()) {
  const name = organisation.name;
  const homepageUrl = organisation.productUrl;
  const truth = {
    site: domain,
    name,
    productUrl: homepageUrl,
    checkedAt: new Date().toISOString(),
    homepage: {},
    sources: [],
    notSources: [],
    youtubeChannels: [],
    notes: []
  };

  const homepage = await request(homepageUrl);
  const homepageOk = homepage.status >= 200 && homepage.status < 400;
  let candidates = [];

  if (homepageOk) {
    truth.homepage = { url: homepageUrl, finalUrl: homepage.url, status: homepage.status };
    const signals = homepageSignals(homepage.text, homepage.url);
    truth.youtubeChannels = signals.youtube;
    candidates = candidateKinds(signals.links, domain);
  } else {
    truth.notes.push(`homepage status ${homepage.status}`);
  }

  candidates = dedupeCandidates([
    ...candidates,
    ...(await probeSubdomains(domain, name, homepageOk ? homepage.url : homepageUrl))
  ]);

  let inspected = [];
  const comparedHomepage = homepageOk ? homepage.url : homepageUrl;
  const landings = await Promise.all(
    candidates.map((candidate) => inspectLanding(candidate.url, name, domain, comparedHomepage))
  );

  for (const [index, candidate] of candidates.entries()) {
    const landing = landings[index];

    if (!landing.accepted) {
      if (
        landing.reason === 'same-as-homepage' ||
        (landing.response?.status >= 400 && candidate.foundVia === 'site-link')
      ) {
        truth.notSources.push({ url: candidate.url, reason: landing.reason, kind: candidate.kind });
      }
      continue;
    }

    if (!candidate.own && !landing.brand) {
      truth.notSources.push({ url: candidate.url, reason: 'off-brand', kind: candidate.kind });
      continue;
    }

    const landingKind = kindFromPath(landing.finalUrl) ?? kindFromText(landing.title);
    if (candidate.kindEvidence === 'text' && landingKind !== candidate.kind) {
      truth.notSources.push({ url: landing.finalUrl, reason: 'not-a-source', kind: candidate.kind });
      continue;
    }

    if (candidate.kind === 'community') {
      truth.notSources.push({ url: landing.finalUrl, reason: 'community', kind: candidate.kind });
      continue;
    }

    const duplicate = inspected.find((source) => source.finalUrl === landing.finalUrl);
    if (duplicate) continue;

    inspected.push({ ...candidate, ...landing });
  }

  const extras = curation.addSources ?? [];
  const reviewedNulls = new Set((curation.nullSources ?? []).map((url) => normalizeUrl(url)));
  const extraLandings = await Promise.all(
    extras.map((extra) => inspectLanding(extra.url, name, domain, comparedHomepage))
  );

  for (const [index, extra] of extras.entries()) {
    const landing = extraLandings[index];
    const reviewedNull =
      reviewedNulls.has(normalizeUrl(extra.url)) || (extra.root && reviewedNulls.has(normalizeUrl(extra.root)));
    const shellOnly = !landing.accepted && (landing.reason === 'empty' || reviewedNull);

    if (!landing.accepted && !shellOnly) {
      truth.notes.push(`reviewed source ${extra.url} is not readable (${landing.reason})`);
      continue;
    }

    if (!shellOnly) inspected = inspected.filter((source) => source.finalUrl !== landing.finalUrl);

    inspected.push({
      url: landing.finalUrl ?? extra.url,
      kind: extra.kind,
      foundVia: 'reviewed',
      foundAt: extra.url,
      own: registrableDomain(new URL(landing.finalUrl ?? extra.url).hostname) === domain,
      kindEvidence: 'manual',
      rootUrlOverride: extra.root ? normalizeUrl(extra.root) : undefined,
      title: landing.title ?? '',
      lang: landing.lang ?? null,
      access: landing.access ?? 'open',
      brand: landing.brand ?? true,
      blocked: landing.blocked ?? false,
      shellOnly,
      ...(shellOnly ? {} : landing)
    });
  }

  const excluded = new Set((curation.excludeSources ?? []).map((url) => normalizeUrl(url)));
  const kept = curation.keepSources ? new Set(curation.keepSources.map((url) => normalizeUrl(url))) : null;

  inspected = inspected.filter((source) => {
    const rootUrl = normalizeUrl(rootForLanding(source, source));
    const landingUrl = normalizeUrl(source.finalUrl ?? source.url);
    const keep = !kept || kept.has(rootUrl) || kept.has(landingUrl);

    if (!keep || excluded.has(rootUrl) || excluded.has(landingUrl)) {
      truth.notSources.push({ url: rootUrl, reason: 'reviewed-not-a-source', kind: source.kind });

      return false;
    }

    return true;
  });

  const seenRoots = new Set();
  const planned = [];

  for (const source of inspected) {
    const rootUrl = rootForLanding(source, source);
    const rootKey = rootUrl.replace(/\/$/, '');
    if (seenRoots.has(rootKey)) continue;

    seenRoots.add(rootKey);
    const nullReason = (curation.nullSources ?? [])
      .map((url) => normalizeUrl(url))
      .find((url) => url === normalizeUrl(rootUrl) || url === normalizeUrl(source.finalUrl ?? rootUrl));
    const override = nullReason
      ? null
      : (curation.inventoryOverrides?.[rootUrl] ?? curation.inventoryOverrides?.[source.finalUrl]);
    planned.push({ source, rootUrl, nullReason, override });
  }

  const inventories = await Promise.all(
    planned.map(({ source, rootUrl, nullReason, override }) =>
      nullReason
        ? { pages: [], pageCountAllLocales: 0, locale: null, method: 'none', sitemapUrls: [], llmsTxtUrl: null }
        : (reusedInventory(previousSources.get(rootUrl), source, rootUrl, override, curation.pageExclude) ??
          sourceInventory(
            rootUrl,
            source.finalUrl ?? rootUrl,
            source.lang,
            override,
            source.blocked ?? false,
            curation.pageExclude
          ))
    )
  );

  for (const [index, { source, rootUrl, nullReason }] of planned.entries()) {
    const inventory = inventories[index];
    const pageCount = nullReason || inventory.method === 'none' ? null : inventory.pages.length;

    truth.sources.push({
      url: rootUrl,
      landingUrl: source.finalUrl ?? rootUrl,
      kind: source.kind,
      foundVia: source.foundVia,
      foundAt: source.foundAt,
      title: source.title,
      access: source.access,
      locale: inventory.locale,
      pageCount,
      pageCountAllLocales: inventory.pageCountAllLocales,
      countMethod: nullReason ? 'none' : inventory.method,
      sitemapUrls: inventory.sitemapUrls,
      llmsTxtUrl: inventory.llmsTxtUrl,
      ...(inventory.reusedFrom ? { reusedFrom: inventory.reusedFrom } : {}),
      pages: pageCount === null ? [] : inventory.pages
    });

    if (source.access !== 'open') truth.notes.push(`${rootUrl} asks for ${source.access}`);
    if (nullReason) truth.notes.push(curation.nullReasons?.[nullReason] ?? `${rootUrl} has no usable page inventory`);
    else if (pageCount === null) {
      truth.notes.push(
        inventory.sitemapUrls.length > 0
          ? `${rootUrl} publishes sitemaps but they list no readable page URLs`
          : `${rootUrl} has no sitemap and did not expose a readable link index`
      );
    }
    stats.sources += 1;
    stats.pages += pageCount ?? 0;
  }

  if (truth.sources.length === 0) truth.notes.push('no help, docs or academy source found');

  truth.notSources = [...new Map(truth.notSources.map((entry) => [entry.url, entry])).values()];

  return truth;
}

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      try {
        results[index] = await worker(items[index], index);
      } catch (error) {
        console.error(`${items[index]} failed: ${error instanceof Error ? error.stack : String(error)}`);
        results[index] = { error: String(error) };
      }
    }
  });

  await Promise.all(runners);

  return results;
}

async function main() {
  const options = args();
  const sites = JSON.parse(await readFile(options.sitesPath, 'utf8'));
  let reviewed = {};
  try {
    reviewed = JSON.parse(await readFile(join(ROOT, 'eval', 'truth-curation.json'), 'utf8'));
  } catch {}
  const all = [...sites.split.development, ...sites.split.heldOut];
  const selected = options.only ? all.filter((domain) => options.only.includes(domain)) : all;
  const stats = { sources: 0, pages: 0 };

  const truths = await mapLimit(selected, options.concurrency, async (domain) => {
    const startedAt = Date.now();
    const curation = { ...(sites.curation?.[domain] ?? {}), ...(reviewed[domain] ?? {}) };
    const previousSources = await previousSourcesOf(domain, options.reuseHours);
    const truth = await collectSite(domain, sites.organisations[domain], stats, curation, previousSources);
    await mkdir(join(DATA_DIR, domain), { recursive: true });
    await writeFile(join(DATA_DIR, domain, 'truth.json'), `${JSON.stringify(truth, null, 2)}\n`);

    const counts = truth.sources.map((source) => `${source.pageCount ?? '?'} ${source.url}`).join(', ');
    const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.log(
      `${domain} (${seconds}s): ${truth.sources.length} source(s), ${counts || 'none'}${truth.notes.length ? `  [${truth.notes.join('; ')}]` : ''}`
    );

    return { domain, truth };
  });

  if (options.write) {
    const development = new Set(sites.split.development);

    for (const entry of truths) {
      if (!entry?.truth || !development.has(entry.domain)) continue;
      const { domain, truth } = entry;
      sites.groundTruth[domain] = {
        name: truth.name,
        productUrl: truth.productUrl,
        sources: truth.sources.map((source) => ({ url: source.url, kind: source.kind })),
        notSources: [...new Set(truth.notSources.map((source) => source.url))],
        pageCounts: Object.fromEntries(truth.sources.map((source) => [source.url, source.pageCount]))
      };
    }

    await writeFile(options.sitesPath, `${JSON.stringify(sites, null, 2)}\n`);
    console.log(`\nwrote ${options.sitesPath}`);
  }

  console.log(`\n${selected.length} sites, ${stats.sources} sources, ${stats.pages} pages`);
}

await main();
