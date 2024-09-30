import type { MetaTagsProps } from 'svelte-meta-tags';

export const prerender = true;

export function load({ url }) {
  return {
    baseMetaTags: getBaseMetaTags(url),
    url: url.pathname
  };
}

function getBaseMetaTags(url: URL) {
  const metatags = Object.freeze({
    title: 'ClassroomIO – Launch Your Online Bootcamp In Minutes',
    description:
      'Launch your bootcamp quickly and affordably with ClassroomIO, the customizable online teaching platform.',
    canonical: new URL(url.pathname, url.origin).href,
    openGraph: {
      type: 'website',
      url: new URL(url.pathname, url.origin).href,
      locale: 'en_IE',
      title: 'ClassroomIO – Launch Your Online Bootcamp In Minutes',
      description:
        'Launch your bootcamp quickly and affordably with ClassroomIO, the customizable online teaching platform.',
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
      title: 'ClassroomIO – Launch Your Online Bootcamp In Minutes',
      description:
        'Launch your bootcamp quickly and affordably with ClassroomIO, the customizable online teaching platform.',
      image: 'https://brand.cdn.clsrio.com/og/classroomio-og.png',
      imageAlt: 'ClassroomIO OG Image'
    }
  }) satisfies MetaTagsProps;

  return metatags;
}
