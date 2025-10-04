import { getSupabase, supabase } from '$lib/utils/functions/supabase';

import type { CurrentOrg } from '$lib/utils/types/org';
import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';
import type { MetaTagsProps } from 'svelte-meta-tags';
import { blockedSubdomain } from '$lib/utils/constants/app';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { getCurrentOrg } from '$lib/utils/services/org';
import { redirect } from '@sveltejs/kit';

if (!supabase) {
  getSupabase();
}

export const ssr = PUBLIC_IS_SELFHOSTED === 'true' ? false : true;

interface LoadOutput {
  orgSiteName: string;
  isOrgSite: boolean;
  skipAuth: boolean;
  org: CurrentOrg | null;
  baseMetaTags: MetaTagsProps;
  serverLang: string;
}

const APP_SUBDOMAINS = env.PRIVATE_APP_SUBDOMAINS?.split(',') || [];

export const load = async ({ url, cookies, request }): Promise<LoadOutput> => {
  const response: LoadOutput = {
    orgSiteName: '',
    isOrgSite: false,
    skipAuth: false,
    org: null,
    baseMetaTags: getBaseMetaTags(url),
    serverLang: request.headers?.get('accept-language') || ''
  };

  console.log('PUBLIC_IS_SELFHOSTED', PUBLIC_IS_SELFHOSTED);

  // Selfhosted usecase would be here
  if (PUBLIC_IS_SELFHOSTED === 'true') {
    const subdomain = getSubdomain(url);
    console.log('subdomain', subdomain);

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

    // Never go beyond this for selfhosted instances
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

  if (isURLCustomDomain(url)) {
    // Custom domain
    response.org = (await getCurrentOrg(url.host, true, true)) || null;

    console.log('custom domain response.org', response.org);

    if (!response.org) {
      console.error('Custom domain org not found, loading dashboard');
      return response;
    }

    response.isOrgSite = true;
    response.orgSiteName = response.org?.siteName || '';
    return response;
  } else if (!blockedSubdomain.includes(subdomain)) {
    if (APP_SUBDOMAINS.includes(subdomain)) {
      // This is an app domain specified in the .env file
      return response;
    }

    const answer = !!subdomain;

    console.log('subdomain', subdomain);

    response.isOrgSite = debugMode || answer;
    response.orgSiteName = debugMode ? _orgSiteName : subdomain;
    response.org = (await getCurrentOrg(response.orgSiteName, true)) || null;

    if (!response.org && !isDev) {
      redirect(307, 'https://app.classroomio.com/404?type=org');
    } else if (!response.org && _orgSiteName) {
      cookies.delete('_orgSiteName', { path: '/' });
    }
  } else if (subdomain === 'play' || debugPlay === 'true') {
    response.skipAuth = true;
  } else if (!APP_SUBDOMAINS.includes(subdomain) && !isDev) {
    // This case is for anything in our blockedSubdomains
    redirect(307, 'https://app.classroomio.com');
  }

  return response;
};

function isURLCustomDomain(url: URL) {
  if (url.host.includes('localhost')) {
    return false;
  }

  const notCustomDomainHosts = [env.PRIVATE_APP_HOST || '', 'classroomio.com', 'vercel.app'].filter(
    Boolean
  );

  return !notCustomDomainHosts.some((host) => url.host.endsWith(host));
}

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

function getSubdomain(url: URL) {
  const host = url.host.replace('www.', '');
  const parts = host?.split('.');

  if (host?.endsWith(env.PRIVATE_APP_HOST)) {
    return parts?.length >= 3 ? parts[0] : null;
  }

  return null;
}
