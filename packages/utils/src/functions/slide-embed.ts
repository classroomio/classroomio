export const SLIDE_PLATFORM_IDS = [
  'google-slides',
  'canva',
  'powerpoint',
  'keynote',
  'figma',
  'prezi',
  'pitch',
  'gamma',
  'slideshare',
  'beautiful'
] as const;

export type SlidePlatformId = (typeof SLIDE_PLATFORM_IDS)[number];

export type SlideEmbed = {
  id: string;
  src: string;
  platform: SlidePlatformId;
};

export type SlideEmbedParseResult =
  | { ok: true; src: string; platform: SlidePlatformId }
  | { ok: false; reason: 'empty' | 'invalid' | 'unsupported' };

export type SlidePlatformDefinition = {
  id: SlidePlatformId;
  name: string;
  hosts: string[];
  docsHash: string;
  exampleEmbed: string;
};

/**
 * Hostnames we accept in a pasted iframe `src`. Matching is suffix-based
 * (`sharepoint.com` also matches `contoso.sharepoint.com`).
 */
export const SLIDE_PLATFORMS: SlidePlatformDefinition[] = [
  {
    id: 'google-slides',
    name: 'Google Slides',
    hosts: ['docs.google.com'],
    docsHash: 'google-slides',
    exampleEmbed:
      '<iframe src="https://docs.google.com/presentation/d/e/2PACX-1vTDemoPresentationId/embed?start=false&loop=false&delayms=3000" width="960" height="569" allowfullscreen="true"></iframe>'
  },
  {
    id: 'canva',
    name: 'Canva',
    hosts: ['canva.com'],
    docsHash: 'canva',
    exampleEmbed:
      '<iframe src="https://www.canva.com/design/DAFDemoDesignId/view?embed" width="960" height="540" allowfullscreen="allowfullscreen"></iframe>'
  },
  {
    id: 'powerpoint',
    name: 'PowerPoint',
    hosts: ['onedrive.live.com', 'officeapps.live.com', '1drv.ms', 'sharepoint.com'],
    docsHash: 'powerpoint',
    exampleEmbed:
      '<iframe src="https://onedrive.live.com/embed?resid=DEMO123&authkey=Ademo&em=2" width="640" height="480" frameborder="0"></iframe>'
  },
  {
    id: 'keynote',
    name: 'Keynote',
    hosts: ['icloud.com'],
    docsHash: 'keynote',
    exampleEmbed:
      '<iframe src="https://www.icloud.com/keynote/0demoKeynoteShareId?embed=true" width="640" height="500" allowfullscreen></iframe>'
  },
  {
    id: 'figma',
    name: 'Figma Slides',
    hosts: ['figma.com', 'embed.figma.com'],
    docsHash: 'figma',
    exampleEmbed:
      '<iframe src="https://embed.figma.com/slides/DemoFileKey123?embed-host=classroomio" width="800" height="450" allowfullscreen></iframe>'
  },
  {
    id: 'prezi',
    name: 'Prezi',
    hosts: ['prezi.com'],
    docsHash: 'prezi',
    exampleEmbed:
      '<iframe src="https://prezi.com/view/demoPreziViewId/embed" width="550" height="400" allowfullscreen></iframe>'
  },
  {
    id: 'pitch',
    name: 'Pitch',
    hosts: ['pitch.com'],
    docsHash: 'pitch',
    exampleEmbed:
      '<iframe src="https://pitch.com/embed/demo-pitch-public-id" width="640" height="360" allowfullscreen></iframe>'
  },
  {
    id: 'gamma',
    name: 'Gamma',
    hosts: ['gamma.app'],
    docsHash: 'gamma',
    exampleEmbed:
      '<iframe src="https://gamma.app/embed/demo-gamma-deck-id" width="700" height="450" allowfullscreen></iframe>'
  },
  {
    id: 'slideshare',
    name: 'SlideShare',
    hosts: ['slideshare.net'],
    docsHash: 'slideshare',
    exampleEmbed:
      '<iframe src="https://www.slideshare.net/slideshow/embed_code/key/demoSlideShareKey" width="595" height="485" frameborder="0"></iframe>'
  },
  {
    id: 'beautiful',
    name: 'Beautiful.ai',
    hosts: ['beautiful.ai'],
    docsHash: 'beautiful',
    exampleEmbed:
      '<iframe src="https://www.beautiful.ai/player/-demoBeautifulAiId" width="960" height="540" allowfullscreen></iframe>'
  }
];

export const SLIDE_PLATFORM_BY_ID: Record<SlidePlatformId, SlidePlatformDefinition> = Object.fromEntries(
  SLIDE_PLATFORMS.map((platform) => [platform.id, platform])
) as Record<SlidePlatformId, SlidePlatformDefinition>;

/**
 * Origins to allow in the dashboard `frame-src` CSP so these embeds can load.
 * Keep in sync with `apps/dashboard/src/lib/utils/csp-domains.js`.
 */
export const SLIDE_EMBED_FRAME_SRC_ORIGINS = [
  'https://docs.google.com',
  'https://www.canva.com',
  'https://canva.com',
  'https://onedrive.live.com',
  'https://*.onedrive.live.com',
  'https://officeapps.live.com',
  'https://*.officeapps.live.com',
  'https://view.officeapps.live.com',
  'https://1drv.ms',
  'https://*.sharepoint.com',
  'https://www.icloud.com',
  'https://icloud.com',
  'https://embed.figma.com',
  'https://www.figma.com',
  'https://figma.com',
  'https://prezi.com',
  'https://www.prezi.com',
  'https://pitch.com',
  'https://www.pitch.com',
  'https://gamma.app',
  'https://www.gamma.app',
  'https://www.slideshare.net',
  'https://slideshare.net',
  'https://www.beautiful.ai',
  'https://beautiful.ai'
] as const;

const IFRAME_SRC_PATTERN = /<iframe\b[^>]*?\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)')[^>]*>/i;

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function hostnameOf(url: URL): string {
  return url.hostname.replace(/^www\./i, '').toLowerCase();
}

function hostMatches(hostname: string, host: string): boolean {
  const normalizedHost = host.replace(/^www\./i, '').toLowerCase();

  return hostname === normalizedHost || hostname.endsWith(`.${normalizedHost}`);
}

export function getSlidePlatformByHost(hostname: string): SlidePlatformDefinition | null {
  const normalizedHostname = hostname.replace(/^www\./i, '').toLowerCase();

  return (
    SLIDE_PLATFORMS.find((platform) => platform.hosts.some((host) => hostMatches(normalizedHostname, host))) ?? null
  );
}

export function extractIframeSrc(rawInput: string): string | null {
  const trimmed = rawInput.trim();

  if (!trimmed) return null;

  const iframeMatch = trimmed.match(IFRAME_SRC_PATTERN);

  if (iframeMatch) {
    return decodeHtmlEntities(iframeMatch[1] || iframeMatch[2] || '').trim();
  }

  if (/^https?:\/\//i.test(trimmed) && !trimmed.includes('<')) {
    return trimmed.split(/\s/)[0] ?? null;
  }

  return null;
}

function withQueryParam(url: URL, key: string, value: string): void {
  if (!url.searchParams.has(key)) {
    url.searchParams.set(key, value);
  }
}

export function normalizeSlideEmbedSrc(rawSrc: string, platform: SlidePlatformId): string {
  const url = new URL(rawSrc);

  if (platform === 'google-slides') {
    url.pathname = url.pathname.replace(/\/(pub|preview|present|view|htmlpresent)(?=\/|$)/i, '/embed');

    if (!/\/embed\/?$/i.test(url.pathname) && !/\/embed\//i.test(url.pathname)) {
      url.pathname = `${url.pathname.replace(/\/$/, '')}/embed`;
    }

    withQueryParam(url, 'start', 'false');
    withQueryParam(url, 'loop', 'false');
    withQueryParam(url, 'delayms', '3000');
  }

  if (platform === 'canva') {
    url.pathname = url.pathname.replace(/\/(edit|watch)(?=\/|$)/i, '/view');

    if (!/\/view\/?$/i.test(url.pathname)) {
      url.pathname = `${url.pathname.replace(/\/$/, '')}/view`;
    }

    if (!/(?:^|[?&])embed(?:[=&]|$)/i.test(url.search)) {
      url.search += `${url.search ? '&' : ''}embed`;
    }
  }

  if (platform === 'keynote') {
    url.hash = '';
    withQueryParam(url, 'embed', 'true');
  }

  if (platform === 'figma') {
    url.hostname = 'embed.figma.com';
    url.hash = '';
    withQueryParam(url, 'embed-host', 'classroomio');
  }

  if (platform === 'prezi') {
    url.hash = '';

    if (!/\/embed\/?$/i.test(url.pathname)) {
      url.pathname = `${url.pathname.replace(/\/$/, '')}/embed`;
    }
  }

  if (platform === 'pitch') {
    url.pathname = url.pathname.replace(/\/public\//i, '/embed/');
  }

  if (platform === 'gamma') {
    url.pathname = url.pathname.replace(/\/docs\//i, '/embed/');
  }

  return url.toString();
}

export function isAllowedSlideEmbedSrc(src: string): boolean {
  try {
    const parsedUrl = new URL(src);

    if (parsedUrl.protocol !== 'https:') return false;

    return getSlidePlatformByHost(hostnameOf(parsedUrl)) !== null;
  } catch {
    return false;
  }
}

export function parseSlideEmbed(rawInput: string): SlideEmbedParseResult {
  const extractedSrc = extractIframeSrc(rawInput);

  if (!extractedSrc) {
    return { ok: false, reason: rawInput.trim() ? 'invalid' : 'empty' };
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(extractedSrc);
  } catch {
    return { ok: false, reason: 'invalid' };
  }

  if (parsedUrl.protocol !== 'https:') {
    return { ok: false, reason: 'invalid' };
  }

  const platform = getSlidePlatformByHost(hostnameOf(parsedUrl));

  if (!platform) {
    return { ok: false, reason: 'unsupported' };
  }

  const src = normalizeSlideEmbedSrc(parsedUrl.toString(), platform.id);

  return { ok: true, src, platform: platform.id };
}

export function createSlideEmbed(rawInput: string, id?: string): SlideEmbed | null {
  const parsed = parseSlideEmbed(rawInput);

  if (!parsed.ok) return null;

  return {
    id: id ?? crypto.randomUUID(),
    src: parsed.src,
    platform: parsed.platform
  };
}

export function resolveLessonSlides(slides: SlideEmbed[] | null | undefined, slideUrl?: string | null): SlideEmbed[] {
  if (Array.isArray(slides) && slides.length > 0) {
    return slides.filter((slide) => isAllowedSlideEmbedSrc(slide.src));
  }

  if (!slideUrl?.trim()) return [];

  const created = createSlideEmbed(slideUrl, 'legacy-slide-url');

  return created ? [created] : [];
}
