import type { MetaTagsProps } from 'svelte-meta-tags';

export const prerender = true;

export function load({ url, data }) {
  return {
    baseMetaTags: getBaseMetaTags(url),
    url: url.pathname,
		...data,
  };
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
