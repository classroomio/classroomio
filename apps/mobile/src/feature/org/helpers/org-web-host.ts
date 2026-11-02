import type { AccountOrganization } from '@/feature/account/types/account';
import { useActiveOrg } from '@/feature/org/helpers/use-active-org';
import { useServer } from '@/feature/server/components/server-provider';
import { CLOUD_SERVER_URL } from '@/feature/server/constants/server';

export const CLOUD_ROOT_DOMAIN = 'classroomio.com';

/** The org's site host on ClassroomIO cloud: its verified custom domain, else its classroomio.com subdomain. */
export function orgWebHostOf(org: AccountOrganization) {
  const customDomain = org.isCustomDomainVerified ? org.customDomain?.trim() : null;
  if (customDomain) return customDomain;

  return org.siteName ? `${org.siteName}.${CLOUD_ROOT_DOMAIN}` : null;
}

/** The active org's site host, or null on a self-hosted server, whose site address the app cannot know. */
export function useOrgWebHost() {
  const { org } = useActiveOrg();
  const { serverUrl } = useServer();

  return org && serverUrl === CLOUD_SERVER_URL ? orgWebHostOf(org) : null;
}
