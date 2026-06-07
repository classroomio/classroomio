import { SignJWT } from 'jose';

/**
 * Default lifetime for a minted login-link token. Login links are single-purpose
 * cross-host sign-in handoffs, so they are intentionally short-lived.
 */
const DEFAULT_TTL_MINUTES = 10;

function getLoginLinkSecret(): Uint8Array {
  const secret = process.env.BETTER_AUTH_SECRET?.trim();

  if (!secret) {
    throw new Error('BETTER_AUTH_SECRET is required for login links');
  }

  return new TextEncoder().encode(secret);
}

/**
 * Mint a short-lived HS256 JWT consumed by the `login-link` auth plugin
 * (`GET /api/auth/login-link?token=…`). The payload matches `ZLoginLinkPayload`
 * (`sub` + `email` + `type`); the consumer re-verifies the user and email before
 * creating a session, so callers must only ever mint for a user they have
 * already authenticated (self sign-in), never an arbitrary target.
 */
export async function mintLoginLinkToken({
  userId,
  email,
  ttlMinutes = DEFAULT_TTL_MINUTES
}: {
  userId: string;
  email: string;
  ttlMinutes?: number;
}): Promise<string> {
  return new SignJWT({
    email: email.toLowerCase().trim(),
    type: 'login-link'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${ttlMinutes}m`)
    .sign(getLoginLinkSecret());
}
