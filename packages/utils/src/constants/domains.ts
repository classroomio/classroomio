/**
 * The apex that hosts every free-tier tenant site as `<orgSiteName>.<TENANT_ROOT_DOMAIN>`.
 * The `apps/cio-tenant-router` Cloudflare Worker terminates traffic for this zone and forwards
 * to the dashboard service. Marketing apex (classroomio.com) is intentionally separate.
 */
export const TENANT_ROOT_DOMAIN = 'myclassroomio.com';

/** The marketing / admin / api zone. */
export const BRAND_ROOT_DOMAIN = 'classroomio.com';

export { EMBED_PUBLIC_BASE_URL, EMBED_PUBLIC_HOST } from './embeds';
