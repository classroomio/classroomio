import { TENANT_ROOT_DOMAIN, BRAND_ROOT_DOMAIN } from '@cio/utils/constants/domains';

import { env } from './env';

/**
 * Dashboard host helpers for links embedded in emails and other outbound URLs.
 *
 * Email templates only receive pre-built URLs in their `fields` — callers in
 * `apps/api` (or other services) choose the host here before enqueueing mail.
 *
 * - **Student/learner links** (course enroll, audience invites, login):
 *   `getDashboardBaseUrl(org)` — org custom domain, tenant subdomain, or fallback.
 * - **Teacher/tutor/admin dashboard actions** (course management, grading, team
 *   invites, auto-enroll): `getAppBaseUrl()` — admin app (`app.classroomio.com`
 *   in cloud). Do not pass org `customDomain` or tenant `siteName`.
 *
 * See `packages/email/README.md` and `AGENTS.md` § Email link URLs.
 */

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
 * Returns the learner-facing dashboard base URL for an org.
 *
 * Use for **student/learner email links** (course enroll, audience invites,
 * login) so links land on the org's public site.
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
 *
 * For teacher/tutor/admin dashboard actions in email, use `getAppBaseUrl()`.
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
 *
 * Use for **teacher/tutor/admin email links** — course management, grading,
 * team invites, auto-enroll, and any other staff dashboard action. Staff sign
 * in on the admin app, not the org public site.
 *
 * Do not use for student/learner-facing links; use `getDashboardBaseUrl(org)`.
 */
export function getAppBaseUrl(): string {
  return getDashboardBaseUrl();
}
