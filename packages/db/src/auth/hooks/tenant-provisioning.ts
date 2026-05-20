import * as schema from '@db/schema';

import { BRAND_ROOT_DOMAIN, TENANT_ROOT_DOMAIN, blockedSubdomain } from '@cio/utils/constants';
import { getOrganizationByCustomDomain, getOrganizationBySiteName } from '@db/queries/organization';

import { User } from 'better-auth';
import { db } from '@db/drizzle';
import { ensureOrgMembership } from './sso-provisioning';
import { eq } from 'drizzle-orm';

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
 *   1. `cio-org-id` request header (set by the dashboard on email signup)
 *   2. OAuth `state` → verification row → `callbackURL` host. Used for Google
 *      and other OAuth/SSO flows where the callback lands on `api.<root>`
 *      directly with no tenant host header. The dashboard always sets
 *      `callbackURL` to the tenant origin, so its host is the trusted signal.
 *   3. `x-forwarded-host` / `host`: tenant subdomain, brand subdomain, or
 *      verified custom domain. Fallback for non-OAuth flows.
 */
async function resolveHostFromOAuthState(request: Request): Promise<string | null> {
  const requestUrl = new URL(request.url);
  const state = requestUrl.searchParams.get('state');
  console.log('[auth] tenantProvisioningHook: oauth state', state);
  if (!state) return null;

  try {
    const [row] = await db
      .select({ value: schema.verification.value })
      .from(schema.verification)
      .where(eq(schema.verification.identifier, state))
      .limit(1);

    console.log('[auth] tenantProvisioningHook: verification row?', !!row);
    if (!row?.value) return null;

    const stateData = JSON.parse(row.value) as { callbackURL?: string };
    console.log('[auth] tenantProvisioningHook: state.callbackURL', stateData.callbackURL);
    if (!stateData.callbackURL) return null;

    const host = new URL(stateData.callbackURL).host;
    console.log('[auth] tenantProvisioningHook: host from state.callbackURL', host);
    return host;
  } catch (error) {
    console.error('[auth] tenantProvisioningHook: failed to resolve OAuth state', error);
    return null;
  }
}

export const tenantProvisioningHook = async (user: User, request?: Request) => {
  if (!user.email || !request) return;
  console.log('[auth] tenantProvisioningHook: running', { userId: user.id });

  const headerOrgId = request.headers.get('cio-org-id');
  console.log('[auth] tenantProvisioningHook: headerOrgId', headerOrgId);
  if (headerOrgId) {
    console.log('[auth] tenantProvisioningHook: enrolling via header', { userId: user.id, orgId: headerOrgId });
    await ensureOrgMembership(user.id, user.email, headerOrgId);
    return;
  }

  // Prefer the OAuth state's callbackURL host (set by the dashboard on the
  // tenant origin) before falling back to forwarded/host headers, which on a
  // direct Google → api.classroomio.com callback won't reflect the tenant.
  const stateHost = await resolveHostFromOAuthState(request);
  const fwdHost = request.headers.get('x-forwarded-host');
  const rawHost = request.headers.get('host');
  console.log('[auth] tenantProvisioningHook: candidate hosts', { stateHost, fwdHost, rawHost });

  const host = stateHost ?? fwdHost ?? rawHost;
  if (!host) {
    console.log('[auth] tenantProvisioningHook: no host candidate, skipping enrollment');
    return;
  }

  const orgId = await resolveOrgIdFromHost(host);
  console.log('[auth] tenantProvisioningHook: resolved orgId from host', { host, orgId });
  if (!orgId) {
    console.log('[auth] tenantProvisioningHook: no org for host, skipping enrollment');
    return;
  }

  console.log('[auth] tenantProvisioningHook: enrolling', { userId: user.id, orgId });
  await ensureOrgMembership(user.id, user.email, orgId);
};
