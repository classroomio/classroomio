import type { MetaTagsProps } from 'svelte-meta-tags';
import { dev, browser } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import { blockedSubdomain } from '$lib/utils/constants/app';
import { getCurrentOrg } from '$lib/utils/services/org';
import { getSupabase, supabase } from '$lib/utils/functions/supabase';
import { loadTranslations } from '$lib/utils/functions/translations';
import type { CurrentOrg } from '$lib/utils/types/org';
import { env } from '$env/dynamic/private';

if (!supabase) {
  getSupabase();
}

interface LoadOutput {
  orgSiteName: string;
  isOrgSite: boolean;
  skipAuth: boolean;
  org: CurrentOrg | null;
  baseMetaTags: MetaTagsProps;
}

export const load = async ({ url, cookies }): Promise<LoadOutput> => {
  const response: LoadOutput = {
    orgSiteName: '',
    isOrgSite: false,
    skipAuth: false,
    org: null,
    baseMetaTags: getBaseMetaTags(url)
  };

  // Selfhosted usecase would be here
  if (env.IS_SELFHOSTED === 'true') {
    const subdomain = getSubdomain(url);

    // Student dashboard
    if (subdomain) {
      const org = (await getCurrentOrg(subdomain, true)) || null;

      // Organization by subdomain not found
      if (!org) {
        return response;
      }

      response.org = org;
      response.isOrgSite = true;
      response.orgSiteName = subdomain;
    }

    return response;
  }

  const isLocalHost = url.host.includes('localhost');

  const tempSiteName = url.searchParams.get('org');

  if (isLocalHost && tempSiteName) {
    console.log('setting sitename temp');
    cookies.set('_orgSiteName', tempSiteName, {
      path: '/'
    });
  }

  const _orgSiteName = cookies.get('_orgSiteName');
  const debugPlay = cookies.get('debugPlay');
  const debugMode = _orgSiteName && _orgSiteName !== 'false';

  const subdomain = getSubdomain(url) || '';

  const isDev = dev || isLocalHost;

  if (!url.host.includes('.classroomio.com') && !isLocalHost) {
    // Custom domain
    response.org = (await getCurrentOrg(url.host, true, true)) || null;

    console.log('custom domain response.org', response.org);

    if (!response.org) {
      throw redirect(307, 'https://app.classroomio.com/404?type=org');
    }

    response.isOrgSite = true;
    response.orgSiteName = response.org?.siteName || '';
    return response;
  } else if (!blockedSubdomain.includes(subdomain)) {
    const answer = !!subdomain;

    response.isOrgSite = debugMode || answer;
    response.orgSiteName = debugMode ? _orgSiteName : subdomain;
    response.org = (await getCurrentOrg(response.orgSiteName, true)) || null;

    if (!response.org && !isDev) {
      throw redirect(307, 'https://app.classroomio.com/404?type=org');
    } else if (!response.org && _orgSiteName) {
      cookies.delete('_orgSiteName');
    }
  } else if (subdomain === 'play' || debugPlay === 'true') {
    response.skipAuth = true;
  } else if (!env.PRIVATE_APP_SUBDOMAINS.split(',').includes(subdomain) && !isDev) {
    // This case is for anything in our blockedSubdomains
    throw redirect(307, 'https://app.classroomio.com');
  }

  // Load translations
  const { pathname } = url;
  const initLocale = getInitialLocale();
  await loadTranslations(initLocale, pathname);

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

// Define getInitialLocale function
function getInitialLocale(): string {
  if (browser) {
    try {
      return window.navigator.language.split('-')[0];
    } catch (e) {
      return 'en';
    }
  }

  return 'en';
}

function getSubdomain(url: URL) {
  const host = url.host.replace('www.', '');
  const parts = host.split('.');

  if (host.endsWith(env.PRIVATE_APP_HOST)) {
    return parts.length >= 3 ? parts[0] : null;
  }

  return null;
}
