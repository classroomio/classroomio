import { SignJWT } from 'jose';

import { saveLoginLinkGrant } from '@db/queries/auth/login-link';

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
 * (`sub` + `jti` + `email` + `type`); the consumer re-verifies the user and email before
 * creating a session, so callers must only ever mint for a user they have
 * already authenticated (self sign-in), never an arbitrary target. Each token
 * carries a `jti` stored until expiry, so it can be redeemed only once.
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
  const tokenId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
  const expiresAtSeconds = Math.floor(expiresAt.getTime() / 1000);

  await saveLoginLinkGrant(tokenId, userId, expiresAt);

  return new SignJWT({
    email: email.toLowerCase().trim(),
    type: 'login-link'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setJti(tokenId)
    .setIssuedAt()
    .setExpirationTime(expiresAtSeconds)
    .sign(getLoginLinkSecret());
}
