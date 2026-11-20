import * as cheerio from 'cheerio';

import type { PageContent } from '../sources/types';

export interface PageImage {
  url: string;
  alt: string;
  caption: string | null;
  nearestHeading: string | null;
  /** Where the host stored its copy, once captured. Null when capture failed or no capture hook was given. */
  storedUrl?: string | null;
}

export interface PageVideo {
  embedUrl: string;
  title: string | null;
}

export interface PageMedia {
  images: PageImage[];
  videos: PageVideo[];
  /** The page's oEmbed discovery link, used to identify an embedded player without a list of providers. */
  oembedUrl: string | null;
}

const MIN_IMAGE_SIZE = 64;
const MARKDOWN_IMAGE = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

function absolute(value: string | undefined, pageUrl: string): string | null {
  if (!value || value.startsWith('data:')) return null;

  try {
    return new URL(value, pageUrl).href;
  } catch {
    return null;
  }
}

function htmlMedia(html: string, pageUrl: string): Pick<PageMedia, 'images' | 'videos'> {
  const $ = cheerio.load(html);
  const images: PageImage[] = [];
  const videos: PageVideo[] = [];

  $('img').each((_, element) => {
    const image = $(element);
    const width = Number(image.attr('width') ?? 0);
    const height = Number(image.attr('height') ?? 0);
    if ((width && width < MIN_IMAGE_SIZE) || (height && height < MIN_IMAGE_SIZE)) return;

    const url = absolute(image.attr('src') ?? image.attr('data-src'), pageUrl);
    if (!url) return;

    const heading = image.closest('section, article, div').find('h1, h2, h3, h4').first().text().trim();
    images.push({
      url,
      alt: image.attr('alt') ?? '',
      caption: image.closest('figure').find('figcaption').text().trim() || null,
      nearestHeading: heading || null
    });
  });

  $('iframe[src], video[src], video source[src]').each((_, element) => {
    const embedUrl = absolute($(element).attr('src'), pageUrl);
    if (embedUrl) videos.push({ embedUrl, title: $(element).attr('title') ?? null });
  });

  return { images, videos };
}

function markdownMedia(markdown: string, pageUrl: string): Pick<PageMedia, 'images' | 'videos'> {
  const images: PageImage[] = [];
  let heading: string | null = null;

  for (const line of markdown.split('\n')) {
    const headingMatch = line.match(/^#{1,6}\s+(.+)/);
    if (headingMatch) heading = headingMatch[1].trim();

    for (const match of line.matchAll(MARKDOWN_IMAGE)) {
      const url = absolute(match[2], pageUrl);
      if (url) images.push({ url, alt: match[1], caption: null, nearestHeading: heading });
    }
  }

  return { images, videos: htmlMedia(markdown, pageUrl).videos };
}

/** Images and embedded videos in a page's content, with what a later stage needs to place them next to the text. */
export function pageMedia(content: PageContent, fullHtml: string, pageUrl: string): PageMedia {
  const media = content.format === 'html' ? htmlMedia(content.text, pageUrl) : markdownMedia(content.text, pageUrl);
  const oembedHref =
    fullHtml.match(/<link[^>]+type=["']application\/json\+oembed["'][^>]*href=["']([^"']+)/i)?.[1] ??
    fullHtml.match(/<link[^>]+href=["']([^"']+)["'][^>]*type=["']application\/json\+oembed["']/i)?.[1];

  return { ...media, oembedUrl: absolute(oembedHref, pageUrl) };
}
