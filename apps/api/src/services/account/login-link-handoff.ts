import { mintLoginLinkToken } from '@cio/db/auth';

const LOGIN_LINK_HANDOFF_TTL_MINUTES = 5;

/**
 * Mints a short-lived login-link token for the already-authenticated caller, so the dashboard can sign
 * them in on another host it hands them to (an academy's tenant site, or "View as student").
 * Never accepts a target user from the client.
 */
export async function createSelfLoginLinkToken(user: { id: string; email: string }): Promise<string> {
  return mintLoginLinkToken({
    userId: user.id,
    email: user.email,
    ttlMinutes: LOGIN_LINK_HANDOFF_TTL_MINUTES
  });
}
