import * as cheerio from 'cheerio';

export const SOURCE_KINDS = ['product-site', 'help-center', 'docs', 'academy', 'community'] as const;

export type SourceKind = (typeof SOURCE_KINDS)[number];

export interface PageLink {
  url: string;
  text: string;
}

export interface HomepageSignals {
  links: PageLink[];
  youtubeChannels: string[];
  markdownAlternates: string[];
}

const KIND_WORDS: ReadonlyArray<readonly [SourceKind, RegExp]> = [
  ['help-center', /^(help|support|kb|knowledge|knowledgebase|knowledge-base|helpcenter|help-center|hc|faq|faqs)$/],
  ['docs', /^(docs|doc|documentation|developer|developers|guides|manual|reference)$/],
  ['academy', /^(academy|learn|training|university|education|tutorials)$/],
  ['community', /^(community|forum|forums)$/]
];

const KIND_LINK_TEXT: ReadonlyArray<readonly [SourceKind, RegExp]> = [
  ['help-center', /\b(help ?cent(er|re)|support cent(er|re)|knowledge ?base|help|faqs?)\b/i],
  ['docs', /\b(docs|documentation|developer docs|user guides?|guides|manual)\b/i],
  ['academy', /\b(academy|training|tutorials|learning cent(er|re)|university)\b/i],
  ['community', /\b(community|forum)\b/i]
];

const YOUTUBE_CHANNEL = /^https?:\/\/(?:www\.|m\.)?youtube\.com\/(@[\w.-]+|c\/[\w.-]+|channel\/[\w-]+|user\/[\w.-]+)/i;

function kindFromWord(word: string): SourceKind | null {
  const match = KIND_WORDS.find(([, pattern]) => pattern.test(word.toLowerCase()));

  return match ? match[0] : null;
}

/** The kind a host's first label names, e.g. `help` in `help.example.com`. */
export function kindFromHost(host: string): SourceKind | null {
  return kindFromWord(host.split('.')[0] ?? '');
}

/** The kind a URL's first path segment names, e.g. `docs` in `example.com/docs/start`. */
export function kindFromPath(url: string): SourceKind | null {
  const segments = new URL(url).pathname.split('/').filter(Boolean);
  if (segments[0] === 'hc') return 'help-center';

  return segments[0] ? kindFromWord(segments[0]) : null;
}

export function kindFromLinkText(text: string): SourceKind | null {
  const match = KIND_LINK_TEXT.find(([, pattern]) => pattern.test(text));

  return match ? match[0] : null;
}

function absolute(href: string | undefined, baseUrl: string): string | null {
  if (!href || /^(javascript|mailto|tel):/i.test(href)) return null;

  try {
    const url = new URL(href, baseUrl);
    url.hash = '';

    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

function sameAsUrls($: cheerio.CheerioAPI): string[] {
  const urls: string[] = [];

  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      const data: unknown = JSON.parse($(element).text());
      const nodes = Array.isArray(data) ? data : [data];
      for (const node of nodes) {
        const sameAs = (node as { sameAs?: unknown })?.sameAs;
        if (typeof sameAs === 'string') urls.push(sameAs);
        if (Array.isArray(sameAs)) urls.push(...sameAs.filter((entry): entry is string => typeof entry === 'string'));
      }
    } catch {
      return;
    }
  });

  return urls;
}

function youtubeChannel(url: string): string | null {
  const match = url.match(YOUTUBE_CHANNEL);

  return match ? `https://www.youtube.com/${match[1]}` : null;
}

export function readHomepage(html: string, baseUrl: string): HomepageSignals {
  const $ = cheerio.load(html);
  const links = new Map<string, PageLink>();

  $('a[href]').each((_, element) => {
    const url = absolute($(element).attr('href'), baseUrl);
    if (!url) return;

    const text = ($(element).text() || $(element).attr('aria-label') || $(element).attr('title') || '')
      .replace(/\s+/g, ' ')
      .trim();
    const existing = links.get(url);
    if (!existing || (!existing.text && text)) links.set(url, { url, text });
  });

  const markdownAlternates = $('link[rel="alternate"][type="text/markdown"]')
    .map((_, element) => absolute($(element).attr('href'), baseUrl))
    .get()
    .filter((url): url is string => Boolean(url));

  const channelCandidates = [...links.keys(), ...sameAsUrls($)];
  const youtubeChannels = [
    ...new Set(channelCandidates.map(youtubeChannel).filter((url): url is string => Boolean(url)))
  ];

  return { links: [...links.values()], youtubeChannels, markdownAlternates };
}
