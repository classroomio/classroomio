import type { AccountOrg } from '$features/app/types';
import type { MetaTagsProps } from 'svelte-meta-tags';
import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';
import { getBaseMetaTags } from '$lib/utils/functions/metaTags';
import { getOrgSiteInfo } from '$features/app/layout-setup';

export const ssr = true;

interface LoadOutput {
  orgSiteName: string;
  isOrgSite: boolean;
  skipAuth: boolean;
  org: AccountOrg | null;
  baseMetaTags: MetaTagsProps;
  serverLang: string;
  localeCookie: string;
  locals: App.Locals;
}

export const load = async ({ url, cookies, request, locals }): Promise<LoadOutput> => {
  const loadStart = performance.now();
  const debugPlay = cookies.get('debugPlay');

  const orgSiteInfoStart = performance.now();
  const orgSiteInfo = await getOrgSiteInfo(url, cookies);
  const orgSiteInfoMs = Math.round((performance.now() - orgSiteInfoStart) * 100) / 100;

  const response: LoadOutput = {
    orgSiteName: orgSiteInfo.orgSiteName,
    isOrgSite: orgSiteInfo.isOrgSite,
    skipAuth: orgSiteInfo.subdomain === 'play' || debugPlay === 'true',
    org: orgSiteInfo.org,
    baseMetaTags: getBaseMetaTags(url, orgSiteInfo),
    serverLang: request.headers?.get('accept-language') || '',
    localeCookie: cookies.get('classroomio_locale') || '',
    locals
  };

  const loadMs = Math.round((performance.now() - loadStart) * 100) / 100;
  console.log(
    `[+layout.server] load: ${loadMs}ms (getOrgSiteInfo: ${orgSiteInfoMs}ms) | PUBLIC_IS_SELFHOSTED=${PUBLIC_IS_SELFHOSTED}`
  );

  // If it isn't a registered dashboard domain and also not a valid sub domain.
  // if (!APP_SUBDOMAINS.includes(orgSiteInfo.subdomain) && !dev && !orgSiteInfo.isOrgSite) {
  //   redirect(307, 'https://app.classroomio.com');
  // }

  return response;
};
