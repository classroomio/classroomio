import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';
import { env } from '$env/dynamic/private';
import { getApiKeyHeaders } from '$lib/utils/services/api/server';
import { getOrgBySiteName } from '$features/org/api/org.server';
import { getSubdomain } from '$features/app/layout-setup';
import { redirect } from '@sveltejs/kit';

const APP_SUBDOMAINS = env.PRIVATE_APP_SUBDOMAINS?.split(',') || ['app'];
const ORG_ID_COOKIE_PREFIX = 'cio_org_id_';

export const load = async ({ params, url, cookies }) => {
  const subdomain = getSubdomain(url);
  const isOrgSite = subdomain && !APP_SUBDOMAINS.includes(subdomain);

  // If this is LMS but user is on org site, redirect to LMS
  if (isOrgSite && PUBLIC_IS_SELFHOSTED !== 'true') {
    console.log('isOrgSite redirecting to lms');
    redirect(307, `/lms`);
  }

  const siteName = params.slug;
  const cookieKey = `${ORG_ID_COOKIE_PREFIX}${siteName}`;
  const cachedOrgId = cookies.get(cookieKey);

  console.log('cachedOrgId', cachedOrgId);
  console.log('cookieKey', cookieKey);

  let orgId: string | undefined = cachedOrgId;

  if (!orgId) {
    const apiKeyHeaders = getApiKeyHeaders();
    const org = await getOrgBySiteName(siteName, apiKeyHeaders);
    console.log('org', org);
    if (org?.id) {
      orgId = org.id;

      cookies.set(cookieKey, org.id, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: 'lax',
        httpOnly: false // Allow client-side access if needed
      });
    }
  }

  console.log('returning orgId', orgId);

  return {
    orgName: siteName,
    orgId
  };
};
