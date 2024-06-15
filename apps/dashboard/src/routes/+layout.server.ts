import { dev, browser } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import { blockedSubdomain } from '$lib/utils/constants/app';
import { getCurrentOrg } from '$lib/utils/services/org';
import { getSupabase, supabase } from '$lib/utils/functions/supabase';
import { loadTranslations } from '$lib/utils/functions/translations';
import type { CurrentOrg } from '$lib/utils/types/org';
import { PRIVATE_APP_SUBDOMAINS, IS_SELFHOSTED, PRIVATE_APP_HOST } from '$env/static/private';

if (!supabase) {
  getSupabase();
}

interface LoadOutput {
  orgSiteName: string;
  isOrgSite: boolean;
  skipAuth: boolean;
  org: CurrentOrg | null;
}

export const load = async ({ url, cookies }): Promise<LoadOutput> => {
  const response: LoadOutput = {
    orgSiteName: '',
    isOrgSite: false,
    skipAuth: false,
    org: null
  };

  // Selfhosted usecase would be here
  if (IS_SELFHOSTED === 'true') {
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
    cookies.set('_orgSiteName', tempSiteName);
  }

  const _orgSiteName = cookies.get('_orgSiteName');
  const debugPlay = cookies.get('debugPlay');
  const debugMode = _orgSiteName && _orgSiteName !== 'false';

  const matches = url.host.match(/([a-z 0-9 -]+).*classroomio[.]com/);
  const subdomain = matches?.[1] ?? '';

  const isDev = dev || isLocalHost;

  if (!url.host.includes('.classroomio.com') && !isLocalHost) {
    // TODO: We can verify if custom domain here
    return response;
  }

  if (!blockedSubdomain.includes(subdomain)) {
    const answer = Array.isArray(matches) ? !!subdomain && subdomain !== 'www' : false;

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
  } else if (!PRIVATE_APP_SUBDOMAINS.split(',').includes(subdomain) && !isDev) {
    // This case is for anything in our blockedSubdomains
    throw redirect(307, 'https://app.classroomio.com');
  }

  // Load translations
  const { pathname } = url;
  const initLocale = getInitialLocale();
  await loadTranslations(initLocale, pathname);

  return response;
};

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
  const parts = url.host.split('.');
  if (url.host.endsWith(PRIVATE_APP_HOST)) {
    return parts.length >= 3 ? parts[0] : null;
  }
  return null;
}
