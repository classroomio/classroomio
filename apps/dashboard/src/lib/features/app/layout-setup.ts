import { getFirstOrg, getOrgBySiteName, getOrgsByCustomDomain } from '$features/org/api/org.server';

import { dev } from '$app/environment';
import type { AccountOrg } from '$features/app/types';
import type { Cookies } from '@sveltejs/kit';
import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';
import { blockedSubdomain } from '$lib/utils/constants/app';
import { env } from '$env/dynamic/private';
import { getApiKeyHeaders } from '$lib/utils/services/api/server';

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

  // Self-hosted: single org, single domain
  if (PUBLIC_IS_SELFHOSTED === 'true') {
    const apiKeyHeaders = getApiKeyHeaders();
    const firstOrg = await getFirstOrg(apiKeyHeaders);
    if (firstOrg) {
      response.org = firstOrg as AccountOrg;
      response.isOrgSite = true;
      response.orgSiteName = firstOrg.siteName || '';
      response.subdomain = '';
    }

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
    console.log('it is custom domain');
    const org = await lookupOrgFromWorker(url.origin, { customDomain: url.host });

    if (!org) return response;

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
      response.org = await lookupOrgFromWorker(url.origin, { siteName: response.orgSiteName });
    }

    const shouldDeleteCookie = !response.org && _orgSiteName;
    if (shouldDeleteCookie) {
      cookies.delete('_orgSiteName', { path: '/' });
    }
  }

  return response;
}

// Resolve the org via the tenant-router Worker. We call the *same origin* the
// browser hit (e.g. https://<tenant>.myclassroomio.com) because that host is
// fronted by the Worker, which serves /internal/org-lookup from KV (≈5ms) or
// Hyperdrive→Postgres on a miss (≈50ms). No API/Render hop, no extra env var.
//
// In dev / self-hosted there is no Worker in front, so fall back to the
// direct API call (same path the code used before the Worker cache existed).
async function lookupOrgFromWorker(
  origin: string,
  params: { siteName?: string; customDomain?: string }
): Promise<AccountOrg | null> {
  if (dev || PUBLIC_IS_SELFHOSTED === 'true' || origin.includes('localhost')) {
    const apiKeyHeaders = getApiKeyHeaders();
    if (params.siteName) {
      return (await getOrgBySiteName(params.siteName, apiKeyHeaders)) ?? null;
    }
    if (params.customDomain) {
      const orgs = await getOrgsByCustomDomain(params.customDomain, true, apiKeyHeaders);
      return (orgs?.[0] as AccountOrg) ?? null;
    }

    return null;
  }

  const qs = new URLSearchParams();
  if (params.siteName) qs.set('siteName', params.siteName);
  if (params.customDomain) qs.set('customDomain', params.customDomain);

  try {
    const res = await fetch(`${origin}/internal/org-lookup?${qs}`, {
      headers: getApiKeyHeaders().headers
    });
    if (!res.ok) return null;

    const json = (await res.json()) as { success: boolean; data: AccountOrg | null };
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

function isURLCustomDomain(url: URL) {
  if (url.host.includes('localhost')) {
    return false;
  }

  const notCustomDomainHosts = [env.PRIVATE_APP_HOST || '', 'classroomio.com', 'myclassroomio.com'].filter(Boolean);

  return !notCustomDomainHosts.some((host) => url.host.endsWith(host));
}

export function getSubdomain(url: URL) {
  const appHost = env.PRIVATE_APP_HOST;
  if (!appHost) return null;

  const host = url.hostname.replace('www.', '');
  const parts = host.split('.');
  const appHostParts = appHost.split('.');
  const isAppHost = parts.slice(-appHostParts.length).join('.') === appHost;

  if (isAppHost) {
    // Subdomain exists only if extra part(s) before main domain
    return parts.length > appHostParts.length ? parts[0] : null;
  }

  return null;
}
