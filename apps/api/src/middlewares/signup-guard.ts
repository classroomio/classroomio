import { getOrganizationById, hasActiveOrganizationInviteForEmail } from '@cio/db/queries/organization';

import type { MiddlewareHandler } from 'hono';

type OrgSettings = {
  signup?: {
    inviteOnly?: boolean;
  };
};

/**
 * Enforces organization-level signup restrictions server-side.
 *
 * When the `cio-org-id` header is present the middleware looks up the org and
 * rejects the request when:
 *   - `disableSignup` is true, or
 *   - `settings.signup.inviteOnly` is true and the email has no active invite.
 */
export const signupGuard: MiddlewareHandler = async (c, next) => {
  const orgId = c.req.header('cio-org-id');
  if (!orgId) {
    return next();
  }

  let org: Awaited<ReturnType<typeof getOrganizationById>>;
  try {
    org = await getOrganizationById(orgId);
  } catch {
    return next();
  }

  if (!org) {
    return next();
  }

  if (org.disableSignup) {
    return c.json({ code: 'SIGNUP_DISABLED', message: 'Signup is disabled for this organization' }, 403);
  }

  const settings = org.settings as OrgSettings | null;
  const inviteOnly = settings?.signup?.inviteOnly ?? false;

  if (!inviteOnly) {
    return next();
  }

  let body: { email?: string } | undefined;
  try {
    body = await c.req.raw.clone().json();
  } catch {
    return c.json({ code: 'INVALID_REQUEST', message: 'Could not parse request body' }, 400);
  }

  const email = body?.email?.toLowerCase().trim();
  if (!email) {
    return c.json({ code: 'INVALID_REQUEST', message: 'Email is required' }, 400);
  }

  const hasInvite = await hasActiveOrganizationInviteForEmail(orgId, email);
  if (!hasInvite) {
    return c.json({ code: 'INVITE_REQUIRED', message: 'This organization requires an invitation to sign up' }, 403);
  }

  return next();
};
