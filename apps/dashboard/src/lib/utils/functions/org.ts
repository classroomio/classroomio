import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import type { AccountOrg } from '$features/app/types';
import { TENANT_ROOT_DOMAIN } from '@cio/utils/constants';

export function getOrgSiteUrl(
  org: Pick<AccountOrg, 'siteName' | 'customDomain' | 'isCustomDomainVerified'>,
  pathname = '/'
): string {
  let origin: string;

  if (browser && window.location.host.includes('localhost')) {
    origin = window.location.origin;
  } else if (org.customDomain && org.isCustomDomainVerified) {
    origin = `https://${org.customDomain}`;
  } else if (org.siteName) {
    origin = `https://${org.siteName}.${TENANT_ROOT_DOMAIN}`;
  } else {
    return pathname;
  }

  const url = new URL(pathname, origin);

  if (browser && window.location.host.includes('localhost') && org.siteName) {
    url.searchParams.set('org', org.siteName);
  }

  return url.toString();
}

export function genQuizPin(): number {
  const minm = 100000;
  const maxm = 999999;
  return Math.floor(Math.random() * (maxm - minm + 1)) + minm;
}

export function generateSitename(orgName: string): string {
  return orgName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '');
}

export function openUpgradeModal() {
  const url = new URL(window.location.href);

  url.searchParams.set('upgrade', 'true');

  const searchParams = url.searchParams.toString();

  goto(resolve(window.location.pathname + `?${searchParams}`, {}));
}
