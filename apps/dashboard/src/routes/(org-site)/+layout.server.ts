import { PUBLIC_ORG_SITE_LIGHT_MODE_ROUTES } from '$lib/utils/constants/routes';
import { error } from '@sveltejs/kit';

function canResolveOrgFromCoursePath(pathname: string): boolean {
  return PUBLIC_ORG_SITE_LIGHT_MODE_ROUTES.some((pattern) => new RegExp(pattern).test(pathname));
}

export const load = async ({ parent, url }) => {
  const { org, isOrgSite } = await parent();

  // An org-site subdomain that doesn't resolve to a real org must 404 rather
  // than fall back to whatever org a requested course happens to belong to.
  // Course landing/enroll pages can still resolve org context from the course
  // slug when the host lookup fails (e.g. custom domain with a backend port).
  if (isOrgSite && !org && !canResolveOrgFromCoursePath(url.pathname)) {
    throw error(404, 'Organization not found');
  }

  return {};
};
