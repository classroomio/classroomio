import type { MetaTagsProps } from 'svelte-meta-tags';

export const prerender = true;

export async function load({ url }) {
  return {
    baseMetaTags: getBaseMetaTags(url),
    url: url.pathname
  };
}

const DEFAULT_META_TITLE = 'ClassroomIO | One Platform for Customer, Partner, and Employee Training';
const DEFAULT_META_DESCRIPTION =
  'One platform for customer academies, partner certification, and employee training. Build courses with AI, publish under your domain, and track completions.';
const DEFAULT_OG_IMAGE_URL = 'https://brand.cdn.clsrio.com/og/classroomio-opengraph.jpg';
const DEFAULT_OG_IMAGE_ALT = 'ClassroomIO platform for customer, partner, and employee education';

function getBaseMetaTags(url: URL) {
  const canonicalUrl = new URL(url.pathname, url.origin).href;

  const metatags = Object.freeze({
    title: DEFAULT_META_TITLE,
    description: DEFAULT_META_DESCRIPTION,
    canonical: canonicalUrl,
    openGraph: {
      type: 'website',
      url: canonicalUrl,
      locale: 'en_US',
      title: DEFAULT_META_TITLE,
      description: DEFAULT_META_DESCRIPTION,
      siteName: 'ClassroomIO',
      images: [
        {
          url: 'https://brand.cdn.clsrio.com/og/classroomio-opengraph.jpg',
          alt: DEFAULT_OG_IMAGE_ALT,
          width: 1920,
          height: 1080,
          secureUrl: 'https://brand.cdn.clsrio.com/og/classroomio-opengraph.jpg',
          type: 'image/jpeg'
        },
        {
          url: 'https://brand.cdn.clsrio.com/og/classroomio-opengraph.webp',
          alt: DEFAULT_OG_IMAGE_ALT,
          width: 1920,
          height: 1080,
          secureUrl: 'https://brand.cdn.clsrio.com/og/classroomio-opengraph.webp',
          type: 'image/webp'
        }
      ]
    },
    twitter: {
      handle: '@classroomio',
      site: '@classroomio',
      cardType: 'summary_large_image' as const,
      title: DEFAULT_META_TITLE,
      description: DEFAULT_META_DESCRIPTION,
      image: 'https://brand.cdn.clsrio.com/og/classroomio-opengraph.jpg',
      imageAlt: DEFAULT_OG_IMAGE_ALT
    }
  }) satisfies MetaTagsProps;

  return metatags;
}
