import { OrgApiServer } from '$features/org/api/org.server';
import { env } from '$env/dynamic/private';
import { getSubdomain } from '$features/app/layout-setup';
import { redirect } from '@sveltejs/kit';

const APP_SUBDOMAINS = env.PRIVATE_APP_SUBDOMAINS?.split(',') || ['app'];

export const load = async ({ params, url, parent }) => {
  const subdomain = getSubdomain(url);
  const isOrgSite = subdomain && !APP_SUBDOMAINS.includes(subdomain);
  // If this is LMS but user is on org site, redirect to LMS
  if (isOrgSite) {
    redirect(307, `/lms`);
  }

  // Get org from parent layout if it exists and matches the slug
  const parentData = await parent();
  const siteName = params.slug;

  // Reuse parent org if it matches the slug, otherwise fetch it
  const org = parentData.org?.siteName === siteName ? parentData.org : await OrgApiServer.getOrgBySiteName(siteName);

  return {
    orgName: siteName,
    org
  };
};
