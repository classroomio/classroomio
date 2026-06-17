import { error } from '@sveltejs/kit';

export const load = async ({ parent }) => {
  const { org, isOrgSite } = await parent();

  // An org-site subdomain that doesn't resolve to a real org must 404 rather
  // than fall back to whatever org a requested course happens to belong to.
  if (isOrgSite && !org) {
    throw error(404, 'Organization not found');
  }

  return {};
};
