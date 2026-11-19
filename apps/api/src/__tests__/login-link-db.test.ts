import 'dotenv/config';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq, inArray } from 'drizzle-orm';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

function decodeClaims(token: string): { jti: string; exp: number } {
  const [, payloadSegment] = token.split('.');

  return JSON.parse(Buffer.from(payloadSegment, 'base64url').toString('utf8'));
}

describe.skipIf(!hasDatabase)('login-link grants', () => {
  const ids = { user: '', otherUser: '' };
  const email = `login-link-${Date.now()}@test.local`;

  beforeAll(async () => {
    process.env.BETTER_AUTH_SECRET ||= 'login-link-test-secret';

    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    const [user, otherUser] = await db
      .insert(schema.user)
      .values([
        { name: 'Login link', email },
        { name: 'Other user', email: `other-${email}` }
      ])
      .returning();

    ids.user = user.id;
    ids.otherUser = otherUser.id;
  });

  afterAll(async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    const userIds = [ids.user, ids.otherUser];

    await db.delete(schema.verification).where(inArray(schema.verification.value, userIds));
    await db.delete(schema.user).where(inArray(schema.user.id, userIds));
  });

  it('stores a grant that expires with the token', async () => {
    const { mintLoginLinkToken } = await import('@db/auth/login-link');
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    const token = await mintLoginLinkToken({ userId: ids.user, email, ttlMinutes: 5 });
    const claims = decodeClaims(token);
    const [grant] = await db
      .select()
      .from(schema.verification)
      .where(eq(schema.verification.identifier, `login-link:${claims.jti}`));

    expect(claims.jti).toEqual(expect.any(String));
    expect(grant.value).toBe(ids.user);
    expect(Math.floor(grant.expiresAt.getTime() / 1000)).toBe(claims.exp);
  });

  it('redeems a token only once', async () => {
    const { mintLoginLinkToken } = await import('@db/auth/login-link');
    const { consumeLoginLinkGrant } = await import('@db/queries/auth/login-link');

    const token = await mintLoginLinkToken({ userId: ids.user, email });
    const tokenId = decodeClaims(token).jti;

    const firstRedemption = await consumeLoginLinkGrant(tokenId, ids.user);
    const secondRedemption = await consumeLoginLinkGrant(tokenId, ids.user);

    expect(firstRedemption).toBe(true);
    expect(secondRedemption).toBe(false);
  });

  it('lets only one of two concurrent redemptions succeed', async () => {
    const { mintLoginLinkToken } = await import('@db/auth/login-link');
    const { consumeLoginLinkGrant } = await import('@db/queries/auth/login-link');

    const token = await mintLoginLinkToken({ userId: ids.user, email });
    const tokenId = decodeClaims(token).jti;

    const redemptions = await Promise.all([
      consumeLoginLinkGrant(tokenId, ids.user),
      consumeLoginLinkGrant(tokenId, ids.user)
    ]);

    expect(redemptions.filter(Boolean)).toHaveLength(1);
  });

  it('rejects a grant presented for another user', async () => {
    const { mintLoginLinkToken } = await import('@db/auth/login-link');
    const { consumeLoginLinkGrant } = await import('@db/queries/auth/login-link');

    const token = await mintLoginLinkToken({ userId: ids.user, email });
    const tokenId = decodeClaims(token).jti;

    const redeemedAsOtherUser = await consumeLoginLinkGrant(tokenId, ids.otherUser);
    const redeemedAsOwner = await consumeLoginLinkGrant(tokenId, ids.user);

    expect(redeemedAsOtherUser).toBe(false);
    expect(redeemedAsOwner).toBe(true);
  });

  it('rejects an expired grant', async () => {
    const { consumeLoginLinkGrant, saveLoginLinkGrant } = await import('@db/queries/auth/login-link');

    const tokenId = crypto.randomUUID();
    const pastDate = new Date(Date.now() - 1000);
    await saveLoginLinkGrant(tokenId, ids.user, pastDate);

    expect(await consumeLoginLinkGrant(tokenId, ids.user)).toBe(false);
  });
});
