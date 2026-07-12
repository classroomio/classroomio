import { TENANT_ROOT_DOMAIN, BRAND_ROOT_DOMAIN } from '@cio/utils/constants/domains';

import { env } from './env';

/**
 * Minimal org shape consumed by `getDashboardBaseUrl`. Accepts the three
 * fields that decide which host the org's URLs live on. All optional so
 * callers without an org context can still ask for a sensible default.
 */
export type DashboardOrg = {
  siteName?: string | null;
  customDomain?: string | null;
  isCustomDomainVerified?: boolean | null;
};

/**
 * Returns the base URL for the dashboard app, used for invite links, login
 * URLs, course URLs, and email-embedded links.
 *
 * Resolution order (highest precedence first):
 *  1. Org's verified `customDomain`  → `https://<customDomain>`
 *  2. `DASHBOARD_ORIGIN` env var      → that value (self-hosted override)
 *  3. `NODE_ENV === 'development'`    → `http://localhost:5173`
 *  4. Org's `siteName`                → `https://<siteName>.myclassroomio.com`
 *  5. Final fallback                  → `https://app.classroomio.com`
 *
 * `customDomain` wins over `DASHBOARD_ORIGIN` because per-org BYOD must
 * override the platform-wide self-hosted dashboard host for that org's URLs.
 */
export function getDashboardBaseUrl(org?: DashboardOrg): string {
  if (org?.customDomain && org.isCustomDomainVerified) {
    return `https://${org.customDomain}`;
  }

  if (env.DASHBOARD_ORIGIN) {
    return env.DASHBOARD_ORIGIN.replace(/\/$/, '');
  }

  if (env.NODE_ENV === 'development') {
    return 'http://localhost:5173';
  }

  if (org?.siteName) {
    return `https://${org.siteName}.${TENANT_ROOT_DOMAIN}`;
  }

  return `https://app.${BRAND_ROOT_DOMAIN}`;
}

/**
 * Returns the admin dashboard origin (`app.classroomio.com` in cloud).
 * Use for team-member invite links (admin/tutor) — not student-facing URLs.
 */
export function getAppBaseUrl(): string {
  return getDashboardBaseUrl();
}
