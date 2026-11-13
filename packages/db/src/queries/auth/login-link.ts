import * as schema from '@db/schema';

import { and, eq, gt } from 'drizzle-orm';

import { db } from '@db/drizzle';

const LOGIN_LINK_PREFIX = 'login-link:';

/**
 * Records a minted login-link token id so it can be redeemed once before `expiresAt`.
 */
export async function saveLoginLinkGrant(tokenId: string, userId: string, expiresAt: Date): Promise<void> {
  try {
    await db.insert(schema.verification).values({
      identifier: `${LOGIN_LINK_PREFIX}${tokenId}`,
      value: userId,
      expiresAt
    });
  } catch (error) {
    console.error('saveLoginLinkGrant error:', error);
    throw new Error('Failed to save login link');
  }
}

/**
 * Atomically deletes the unexpired grant for this token id and user.
 * Returns true only for the first redemption.
 */
export async function consumeLoginLinkGrant(tokenId: string, userId: string): Promise<boolean> {
  try {
    const deleted = await db
      .delete(schema.verification)
      .where(
        and(
          eq(schema.verification.identifier, `${LOGIN_LINK_PREFIX}${tokenId}`),
          eq(schema.verification.value, userId),
          gt(schema.verification.expiresAt, new Date())
        )
      )
      .returning({ id: schema.verification.id });

    return deleted.length > 0;
  } catch (error) {
    console.error('consumeLoginLinkGrant error:', error);
    throw new Error('Failed to consume login link');
  }
}
