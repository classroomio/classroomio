import { env } from '$env/dynamic/private';
import { getSubdomain } from '$features/app/layout-setup';
import { redirect } from '@sveltejs/kit';

const APP_SUBDOMAINS = env.PRIVATE_APP_SUBDOMAINS?.split(',') || ['app'];

export const load = async ({ params, url }) => {
  const subdomain = getSubdomain(url);
  const isOrgSite = subdomain && !APP_SUBDOMAINS.includes(subdomain);
  // If this is LMS but user is on org site, redirect to LMS
  if (isOrgSite) {
    redirect(307, `/lms`);
  }

  return {
    orgName: params.slug
  };
};
