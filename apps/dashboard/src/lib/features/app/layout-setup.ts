import type { AccountOrg } from '$features/app/types';
import type { Cookies } from '@sveltejs/kit';
import { OrgApiServer } from '$features/org/api/org.server';
import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';
import { blockedSubdomain } from '$lib/utils/constants/app';
import { env } from '$env/dynamic/private';

export interface OrgSiteInfo {
  isOrgSite: boolean;
  org: AccountOrg | null;
  subdomain: string;
  orgSiteName: string;
}

export async function getOrgSiteInfo(url: URL, cookies: Cookies): Promise<OrgSiteInfo> {
  const response: OrgSiteInfo = {
    orgSiteName: '',
    subdomain: '',
    isOrgSite: false,
    org: null
  };

  // Selfhosted usecase
  if (PUBLIC_IS_SELFHOSTED === 'true') {
    const subdomain = getSubdomain(url);

    // Student dashboard
    if (subdomain) {
      const org = await OrgApiServer.getOrgBySiteName(subdomain);

      // Organization by subdomain not found
      if (!org) {
        return response;
      }

      response.org = org as AccountOrg;
      response.isOrgSite = true;
      response.orgSiteName = subdomain;
      response.subdomain = subdomain;
    }

    // Never go beyond this for selfhosted instances
    return response;
  }

  const isLocalHost = url.host.includes('localhost');
  const tempSiteName = url.searchParams.get('org');

  if (isLocalHost && tempSiteName) {
    cookies.set('_orgSiteName', tempSiteName, {
      path: '/'
    });
  }

  const _orgSiteName = cookies.get('_orgSiteName');
  const debugMode = _orgSiteName && _orgSiteName !== 'false';

  const subdomain = getSubdomain(url) || '';

  // Custom domain
  if (isURLCustomDomain(url)) {
    const orgs = await OrgApiServer.getOrgsByCustomDomain(url.host, true);

    if (!orgs || orgs.length === 0) {
      return response;
    }

    const org = orgs[0];
    response.org = org as AccountOrg;
    response.isOrgSite = true;
    response.orgSiteName = response.org?.siteName || '';
    response.subdomain = subdomain;

    return response;
  }

  // Subdomain except blocked ones.
  if (!blockedSubdomain.includes(subdomain)) {
    const APP_SUBDOMAINS = env.PRIVATE_APP_SUBDOMAINS?.split(',') || [];

    if (APP_SUBDOMAINS.includes(subdomain)) {
      return response;
    }

    response.isOrgSite = debugMode || !!subdomain;
    response.orgSiteName = debugMode ? _orgSiteName : subdomain;

    if (response.orgSiteName) {
      const org = await OrgApiServer.getOrgBySiteName(response.orgSiteName);
      response.org = (org as AccountOrg) || null;
    }

    const shouldDeleteCookie = !response.org && _orgSiteName;
    if (shouldDeleteCookie) {
      cookies.delete('_orgSiteName', { path: '/' });
    }
  }

  return response;
}

function isURLCustomDomain(url: URL) {
  if (url.host.includes('localhost')) {
    return false;
  }

  const notCustomDomainHosts = [env.PRIVATE_APP_HOST || '', 'classroomio.com', 'vercel.app'].filter(Boolean);

  return !notCustomDomainHosts.some((host) => url.host.endsWith(host));
}

export function getSubdomain(url: URL) {
  const host = url.hostname.replace('www.', '');
  const parts = host.split('.');
  const appHost = env.PRIVATE_APP_HOST;

  const appHostParts = appHost.split('.');
  const isAppHost = parts.slice(-appHostParts.length).join('.') === appHost;

  if (isAppHost) {
    // Subdomain exists only if extra part(s) before main domain
    return parts.length > appHostParts.length ? parts[0] : null;
  }

  return null;
}
