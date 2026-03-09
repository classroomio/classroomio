import {
  getFirstOrganization,
  getOrganizationById,
  hasActiveOrganizationInviteForEmail
} from '@cio/db/queries/organization';

import type { MiddlewareHandler } from 'hono';
import { env } from '@api/config/env';

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
 *
 * When the `cio-org-id` header is absent:
 *   - Non-self-hosted: pass through (header optional).
 *   - Self-hosted: require the header unless no orgs exist yet (bootstrap). Otherwise
 *     auto-enrollment in getAccountData would add unauthorized users as students,
 *     bypassing invite-only checks.
 */
export const signupGuard: MiddlewareHandler = async (c, next) => {
  const orgId = c.req.header('cio-org-id');
  if (!orgId) {
    if (env.PUBLIC_IS_SELFHOSTED === 'true') {
      const firstOrg = await getFirstOrganization();
      if (firstOrg) {
        return c.json(
          {
            code: 'ORG_CONTEXT_REQUIRED',
            message: 'Organization context is required for signup on self-hosted instances'
          },
          400
        );
      }
    }
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
