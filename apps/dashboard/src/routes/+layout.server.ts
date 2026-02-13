import type { AccountOrg } from '$features/app/types';
import type { MetaTagsProps } from 'svelte-meta-tags';
import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';
import { getOrgSiteInfo } from '$features/app/layout-setup';
// import { env } from '$env/dynamic/private';
// import { dev } from '$app/environment';
// import { redirect } from '@sveltejs/kit';

export const ssr = PUBLIC_IS_SELFHOSTED === 'true' ? false : true;

// const APP_SUBDOMAINS = env.PRIVATE_APP_SUBDOMAINS?.split(',') || [];

interface LoadOutput {
  orgSiteName: string;
  isOrgSite: boolean;
  skipAuth: boolean;
  org: AccountOrg | null;
  baseMetaTags: MetaTagsProps;
  serverLang: string;
  locals: App.Locals;
}

export const load = async ({ url, cookies, request, locals }): Promise<LoadOutput> => {
  const debugPlay = cookies.get('debugPlay');

  const orgSiteInfo = await getOrgSiteInfo(url, cookies);

  const response: LoadOutput = {
    orgSiteName: orgSiteInfo.orgSiteName,
    isOrgSite: orgSiteInfo.isOrgSite,
    skipAuth: orgSiteInfo.subdomain === 'play' || debugPlay === 'true',
    org: orgSiteInfo.org,
    baseMetaTags: getBaseMetaTags(url),
    serverLang: request.headers?.get('accept-language') || '',
    locals
  };

  console.log('PUBLIC_IS_SELFHOSTED', PUBLIC_IS_SELFHOSTED);
  console.log('response', response);

  // If it isn't a registered dashboard domain and also not a valid sub domain.
  // if (!APP_SUBDOMAINS.includes(orgSiteInfo.subdomain) && !dev && !orgSiteInfo.isOrgSite) {
  //   redirect(307, 'https://app.classroomio.com');
  // }

  return response;
};

function getBaseMetaTags(url: URL) {
  return Object.freeze({
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
  });
}
