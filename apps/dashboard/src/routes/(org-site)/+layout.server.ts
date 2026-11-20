import { error } from '@sveltejs/kit';
import { getAdminOrigin } from '$features/app/utils/admin-origin.server';
import { isOrgManagerRole } from '$lib/utils/store/org';

export const load = async ({ parent, locals, url }) => {
  const { org, isOrgSite } = await parent();

  // An org-site subdomain that doesn't resolve to a real org must 404 rather
  // than fall back to whatever org a requested course happens to belong to.
  if (isOrgSite && !org) {
    throw error(404, 'Organization not found');
  }

  const roleId = org ? locals.orgRoles?.[org.id] : undefined;
  const isOrgManager = roleId !== undefined && isOrgManagerRole(roleId);
  const adminOrigin = isOrgManager ? getAdminOrigin(url) : null;
  const siteName = org?.siteName;

  if (!org || !siteName || !adminOrigin) {
    return { ownerEditBar: null };
  }

  return { ownerEditBar: { adminOrigin, orgId: org.id, siteName } };
};
