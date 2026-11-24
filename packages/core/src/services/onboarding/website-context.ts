import { getWebsiteHost } from '@cio/utils/validation/onboarding';
import type { TOnboardingBrand } from '@cio/utils/validation';

import { fetchPublicHtmlHead } from './safe-fetch';
import { normaliseBrandColour } from './brand-colour';

const SEPARATORS = /\s*[|·:–—-]\s+/;

type Tag = Record<string, string>;

function readAttributes(source: string): Tag {
  const attributes: Tag = {};

  for (const match of source.matchAll(/([a-zA-Z:-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g)) {
    attributes[match[1].toLowerCase()] = match[3] ?? match[4] ?? match[5] ?? '';
  }

  return attributes;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function readTags(html: string, tagName: 'meta' | 'link'): Tag[] {
  const pattern = new RegExp(`<${tagName}\\b([^>]*)>`, 'gi');

  return [...html.matchAll(pattern)].map((match) => readAttributes(match[1]));
}

function pickThemeColour(metaTags: Tag[]): string | null {
  const candidates = metaTags.filter((tag) => tag.name?.toLowerCase() === 'theme-color' && tag.content);
  const lightFirst = candidates.find((tag) => !tag.media || tag.media.includes('light')) ?? candidates[0];
  const tileColour = metaTags.find((tag) => tag.name?.toLowerCase() === 'msapplication-tilecolor');

  return lightFirst?.content ?? tileColour?.content ?? null;
}

function pickLogoUrl(linkTags: Tag[], baseUrl: string): string | null {
  const icons = linkTags.filter((tag) => /(^|\s)(apple-touch-icon|icon)(\s|$)/i.test(tag.rel ?? '') && tag.href);
  const preferred = icons.find((tag) => /apple-touch-icon/i.test(tag.rel ?? '')) ?? icons[0];
  if (!preferred) return null;

  try {
    const resolved = new URL(preferred.href, baseUrl);

    return resolved.protocol === 'https:' || resolved.protocol === 'http:' ? resolved.href : null;
  } catch {
    return null;
  }
}

function pickProductName(metaTags: Tag[], html: string): { siteTitle: string | null; productName: string | null } {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const siteTitle = titleMatch ? decodeEntities(titleMatch[1]).replace(/\s+/g, ' ').slice(0, 120) : null;

  const siteName = metaTags.find((tag) => tag.property?.toLowerCase() === 'og:site_name')?.content;
  const fromTitle = siteTitle ? siteTitle.split(SEPARATORS)[0]?.trim() : null;
  const productName = decodeEntities(siteName ?? fromTitle ?? '').slice(0, 80);

  return { siteTitle, productName: productName || null };
}

/**
 * Reads a public website's title, name, theme colour and icon from its HTML head. The colour is darkened when white
 * text on it would be hard to read. Throws `WEBSITE_UNREADABLE` when the site cannot be fetched.
 */
export async function extractWebsiteBrand(websiteUrl: string): Promise<TOnboardingBrand> {
  const { finalUrl, html } = await fetchPublicHtmlHead(websiteUrl);
  const metaTags = readTags(html, 'meta');
  const linkTags = readTags(html, 'link');

  const colour = pickThemeColour(metaTags);
  const normalisedColour = colour ? normaliseBrandColour(colour) : null;
  const { siteTitle, productName } = pickProductName(metaTags, html);

  return {
    detectedColour: normalisedColour?.hex ?? null,
    colourAdjusted: normalisedColour?.adjusted ?? false,
    detectedLogoUrl: pickLogoUrl(linkTags, finalUrl),
    siteTitle,
    productName: productName ?? getWebsiteHost(finalUrl)
  };
}
