import { User } from 'better-auth';
import { BRAND_ROOT_DOMAIN, TENANT_ROOT_DOMAIN, blockedSubdomain } from '@cio/utils/constants';
import { getOrganizationByCustomDomain, getOrganizationBySiteName } from '@db/queries/organization';

import { ensureOrgMembership } from './sso-provisioning';

/**
 * Subdomains under the brand/tenant root that are NOT a tenant org.
 * Reuses the dashboard's `blockedSubdomain` list so the two stay in sync.
 */
const RESERVED_SUBDOMAINS = new Set<string>(blockedSubdomain);

/**
 * Resolve the org a signup happened on, given the inbound request's host.
 *
 * Resolution order:
 *   1. Subdomain under TENANT_ROOT_DOMAIN  (e.g. ciodevs.classroomio.school) → siteName lookup
 *   2. Subdomain under BRAND_ROOT_DOMAIN   (e.g. ciodevs.classroomio.com)    → siteName lookup
 *   3. Anything else                       (e.g. learn.acme.com)             → verified-custom-domain lookup
 *
 * Returns null for the apex, reserved subdomains (app/api/www/…), and unverified custom domains.
 */
async function resolveOrgIdFromHost(host: string): Promise<string | null> {
  const hostname = host.split(':')[0]?.toLowerCase();
  if (!hostname) return null;

  const tenantSuffix = `.${TENANT_ROOT_DOMAIN}`;
  const brandSuffix = `.${BRAND_ROOT_DOMAIN}`;

  if (hostname.endsWith(tenantSuffix) || hostname.endsWith(brandSuffix)) {
    const suffix = hostname.endsWith(tenantSuffix) ? tenantSuffix : brandSuffix;
    const subdomain = hostname.slice(0, -suffix.length);

    // Apex (no subdomain) or multi-level subdomain we don't recognise
    if (!subdomain || subdomain.includes('.')) return null;
    if (RESERVED_SUBDOMAINS.has(subdomain)) return null;

    const org = await getOrganizationBySiteName(subdomain);
    return org?.id ?? null;
  }

  const org = await getOrganizationByCustomDomain(hostname);
  return org?.id ?? null;
}

/**
 * Auto-enroll a signup into the org they signed up on.
 *
 * Runs after `ssoProvisioningHook` so SSO-domain matches (which carry policy-driven
 * role mapping) win. `ensureOrgMembership` is idempotent and invite-aware, so if SSO
 * already inserted a row this is a no-op.
 *
 * The `signupGuard` middleware (apps/api/src/middlewares/signup-guard.ts) has already
 * rejected `disableSignup` orgs and `inviteOnly` orgs without a valid invite by the
 * time this runs — so any signup that reaches the hook is allowed to join.
 *
 * Org resolution order:
 *   1. `cio-org-id` request header (set by the dashboard on every API call)
 *   2. Host header: tenant subdomain, brand subdomain, or verified custom domain.
 *      Prefers `x-forwarded-host` (set by the Cloudflare Worker proxy) over the
 *      raw `Host`, which behind the proxy is the upstream service name and not
 *      the tenant host the user actually visited.
 *
 * TODO(oauth): OAuth/SSO signups lose both the header and the original host —
 * the callback lands on `api.classroomio.com/api/auth/callback/<provider>`, so
 * neither path here can resolve the tenant. To fix, encode the org id in
 * Better Auth's OAuth `state` (or `additionalParams`) at signup initiation and
 * pull it out of `request` here. Until then, OAuth signups on a tenant site
 * will not be auto-enrolled and must be invited manually.
 */
export const tenantProvisioningHook = async (user: User, request?: Request) => {
  if (!user.email || !request) return;

  const headerOrgId = request.headers.get('cio-org-id');
  if (headerOrgId) {
    await ensureOrgMembership(user.id, user.email, headerOrgId);
    return;
  }

  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (!host) return;

  const orgId = await resolveOrgIdFromHost(host);
  if (!orgId) return;

  await ensureOrgMembership(user.id, user.email, orgId);
};
