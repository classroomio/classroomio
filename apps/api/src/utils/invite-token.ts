import crypto from 'node:crypto';

/**
 * Shared invite-token primitives.
 *
 * Invite tokens are bearer capabilities: whoever holds one can act on the invite.
 * They are always looked up by `sha256(token)` so the hash can carry a unique index,
 * and only permanent share links keep the raw token so staff can re-copy them.
 */
export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashInviteToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
