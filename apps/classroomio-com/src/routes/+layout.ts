import type { MetaTagsProps } from 'svelte-meta-tags';

export async function load({ url, fetch }) {
  let githubStars = 0;

  try {
    const response = await fetch('http://api.github.com/repos/classroomio/classroomio');
    const data = await response.json();
    githubStars = data?.stargazers_count || 0;
  } catch (error) {
    console.error('Error fetching GitHub stars:', error);
  }

  return {
    baseMetaTags: getBaseMetaTags(url),
    url: url.pathname,
    githubStars
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
