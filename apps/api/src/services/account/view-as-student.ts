import { mintLoginLinkToken } from '@cio/db/auth';

/**
 * Login-link tokens for the "View as student" handoff are consumed within seconds
 * of being minted (the client immediately navigates to the org domain), so they
 * are intentionally short-lived.
 */
const VIEW_AS_STUDENT_TTL_MINUTES = 5;

/**
 * Mint a short-lived login-link token for the **current** user so they can be
 * auto-signed-in on the org domain (the "View as student" cross-host handoff).
 *
 * Self sign-in only: the caller must pass the already-authenticated user. We never
 * accept a target user id from the client, so this can't be used to impersonate
 * anyone else.
 */
export async function createViewAsStudentToken(user: { id: string; email: string }): Promise<string> {
  return mintLoginLinkToken({
    userId: user.id,
    email: user.email,
    ttlMinutes: VIEW_AS_STUDENT_TTL_MINUTES
  });
}
