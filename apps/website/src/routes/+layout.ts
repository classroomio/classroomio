import type { MetaTagsProps } from 'svelte-meta-tags';

export const prerender = true;

export async function load({ url }) {
  const stars = await getStars();

  return {
    baseMetaTags: getBaseMetaTags(url),
    url: url.pathname,
    stars
  };
}

const starsCache = new Map<string, { stars: number; lastUpdated: number }>();
const CACHE_TIME = 1000 * 60 * 60 * 48; // 48 hours
const CACHE_KEY = 'github-stars';

async function getStars() {
  const now = Date.now();

  const cacheData = starsCache.get(CACHE_KEY);
  if (cacheData && now - cacheData.lastUpdated < CACHE_TIME) {
    console.log('Returning cached stars');
    return cacheData.stars;
  }

  console.log('Fetching stars from GitHub');

  const response = await fetch('https://api.github.com/repos/classroomio/classroomio');
  const data = await response.json();
  const stars = data?.stargazers_count || 0;

  starsCache.set(CACHE_KEY, { stars, lastUpdated: now });

  return stars;
}

function getBaseMetaTags(url: URL) {
  const metatags = Object.freeze({
    title: 'ClassroomIO | The Open Source Learning Management System for Companies',
    description:
      'A flexible, user-friendly platform for creating, managing, and delivering courses for companies and training organisations',
    canonical: new URL(url.pathname, url.origin).href,
    openGraph: {
      type: 'website',
      url: new URL(url.pathname, url.origin).href,
      locale: 'en_IE',
      title: 'ClassroomIO | The Open Source Learning Management System for Companies',
      description:
        'A flexible, user-friendly platform for creating, managing, and delivering courses for companies and training organisations',
      siteName: 'ClassroomIO',
      images: [
        {
          url: 'https://brand.cdn.clsrio.com/og/classroomio-og.png',
          alt: 'ClassroomIO OG Image',
          width: 1920,
          height: 1080,
          secureUrl: 'https://brand.cdn.clsrio.com/og/classroomio-og.png',
          type: 'image/jpeg'
        }
      ]
    },
    twitter: {
      handle: '@classroomio',
      site: '@classroomio',
      cardType: 'summary_large_image' as const,
      title: 'ClassroomIO | The Open Source Learning Management System for Companies',
      description:
        'A flexible, user-friendly platform for creating, managing, and delivering courses for companies and training organisations',
      image: 'https://brand.cdn.clsrio.com/og/classroomio-og.png',
      imageAlt: 'ClassroomIO OG Image'
    }
  }) satisfies MetaTagsProps;

  return metatags;
}
