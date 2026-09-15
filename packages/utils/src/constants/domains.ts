/**
 * The apex that hosts every free-tier tenant site as `<orgSiteName>.<TENANT_ROOT_DOMAIN>`.
 * The `apps/cio-tenant-router` Cloudflare Worker terminates traffic for this zone and forwards
 * to the dashboard service. Marketing apex (classroomio.com) is intentionally separate.
 */
export const TENANT_ROOT_DOMAIN = 'myclassroomio.com';

/** The marketing / admin / api zone. */
export const BRAND_ROOT_DOMAIN = 'classroomio.com';

export { EMBED_PUBLIC_BASE_URL, EMBED_PUBLIC_HOST } from './embeds';

/**
 * First-party hostnames under {@link BRAND_ROOT_DOMAIN} that are served as organization sites
 * rather than marketing or the admin app. Every other `classroomio.com` hostname stays reserved so
 * customers cannot claim one as a BYOD custom domain.
 */
export const FIRST_PARTY_ORG_SITE_HOSTS: readonly string[] = ['academy.classroomio.com'];

export function isFirstPartyOrgSiteHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/\.$/, '');

  return FIRST_PARTY_ORG_SITE_HOSTS.includes(host);
}
