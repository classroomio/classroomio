import type { Context, MiddlewareHandler, Next } from 'hono';
import {
  checkEmailExistsInOrg,
  getFirstOrganization,
  getOrganizationById,
  hasActiveOrganizationInviteForEmail
} from '@cio/db/queries/organization';

import { env } from '@api/config/env';

type OrgSettings = {
  signup?: {
    inviteOnly?: boolean;
  };
};

type SignupRequestBody = {
  email?: string;
};

const SELF_HOSTED_ORG_CONTEXT_REQUIRED = {
  code: 'ORG_CONTEXT_REQUIRED',
  message: 'Organization context is required for signup on self-hosted instances'
} as const;

const INVALID_REQUEST = {
  code: 'INVALID_REQUEST',
  message: 'Could not parse request body'
} as const;

const EMAIL_REQUIRED = {
  code: 'INVALID_REQUEST',
  message: 'Email is required'
} as const;

const SIGNUP_DISABLED = {
  code: 'SIGNUP_DISABLED',
  message: 'Signup is disabled for this organization'
} as const;

const INVITE_REQUIRED = {
  code: 'INVITE_REQUIRED',
  message: 'This organization requires an invitation to sign up'
} as const;

const isSelfHosted = env.PUBLIC_IS_SELFHOSTED === 'true';

function normalizeEmail(email?: string) {
  return email?.trim().toLowerCase();
}

async function getSignupEmail(c: Context) {
  try {
    const body = (await c.req.raw.clone().json()) as SignupRequestBody;
    return {
      email: normalizeEmail(body?.email),
      parseFailed: false
    };
  } catch {
    return {
      email: undefined,
      parseFailed: true
    };
  }
}

async function getOrganizationSafely(orgId: string) {
  try {
    return await getOrganizationById(orgId);
  } catch {
    return null;
  }
}

async function canProceedWithoutOrgContext(c: Context) {
  if (!isSelfHosted) {
    return true;
  }

  const firstOrg = await getFirstOrganization();
  if (!firstOrg) {
    return true;
  }

  const { email, parseFailed } = await getSignupEmail(c);
  if (parseFailed || !email) {
    return false;
  }

  return checkEmailExistsInOrg(firstOrg.id, email);
}

function isInviteOnlySignup(settings: OrgSettings | null) {
  return settings?.signup?.inviteOnly ?? false;
}

async function handleInviteOnlySignup(c: Context, next: Next, orgId: string) {
  const { email, parseFailed } = await getSignupEmail(c);

  if (parseFailed) {
    return c.json(INVALID_REQUEST, 400);
  }

  if (!email) {
    return c.json(EMAIL_REQUIRED, 400);
  }

  const hasInvite = await hasActiveOrganizationInviteForEmail(orgId, email);
  if (!hasInvite) {
    return c.json(INVITE_REQUIRED, 403);
  }

  await next();
}

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
 *   - Self-hosted: require the header unless no orgs exist yet (bootstrap), or the
 *     signup email is already an organization member (e.g. invited, profile_id null).
 */
export const signupGuard: MiddlewareHandler = async (c, next) => {
  const orgId = c.req.header('cio-org-id');

  if (!orgId) {
    const canContinue = await canProceedWithoutOrgContext(c);
    if (!canContinue) {
      return c.json(SELF_HOSTED_ORG_CONTEXT_REQUIRED, 400);
    }

    await next();
    return;
  }

  const org = await getOrganizationSafely(orgId);
  if (!org) {
    await next();
    return;
  }

  if (org.disableSignup) {
    return c.json(SIGNUP_DISABLED, 403);
  }

  const settings = org.settings as OrgSettings | null;
  if (!isInviteOnlySignup(settings)) {
    await next();
    return;
  }

  return handleInviteOnlySignup(c, next, orgId);
};
