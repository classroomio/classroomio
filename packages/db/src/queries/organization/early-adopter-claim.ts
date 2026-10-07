import * as schema from '@db/schema';

import { and, asc, eq, isNull, lt, sql } from 'drizzle-orm';
import { db, type DbOrTxClient } from '@db/drizzle';
import type { TEarlyAdopterClaim, TNewEarlyAdopterClaim } from '@db/types';

type EarlyAdopterClaimStatus = TEarlyAdopterClaim['status'];

/**
 * Inserts an unclaimed Early Adopter purchase. Returns null when one already exists for the subscription.
 */
export const createEarlyAdopterClaim = async (
  data: TNewEarlyAdopterClaim,
  dbClient: DbOrTxClient = db
): Promise<TEarlyAdopterClaim | null> => {
  try {
    const [claim] = await dbClient
      .insert(schema.earlyAdopterClaim)
      .values(data)
      .onConflictDoNothing({ target: schema.earlyAdopterClaim.polarSubscriptionId })
      .returning();

    return claim ?? null;
  } catch (error) {
    console.error('createEarlyAdopterClaim error:', error);
    throw new Error('Failed to create early adopter claim');
  }
};

export const getEarlyAdopterClaimByTokenHash = async (
  tokenHash: string,
  dbClient: DbOrTxClient = db
): Promise<TEarlyAdopterClaim | null> => {
  try {
    const [claim] = await dbClient
      .select()
      .from(schema.earlyAdopterClaim)
      .where(eq(schema.earlyAdopterClaim.tokenHash, tokenHash))
      .limit(1);

    return claim ?? null;
  } catch (error) {
    console.error('getEarlyAdopterClaimByTokenHash error:', error);
    throw new Error('Failed to fetch early adopter claim');
  }
};

export const getEarlyAdopterClaimBySubscriptionId = async (
  subscriptionId: string,
  dbClient: DbOrTxClient = db
): Promise<TEarlyAdopterClaim | null> => {
  try {
    const [claim] = await dbClient
      .select()
      .from(schema.earlyAdopterClaim)
      .where(eq(schema.earlyAdopterClaim.polarSubscriptionId, subscriptionId))
      .limit(1);

    return claim ?? null;
  } catch (error) {
    console.error('getEarlyAdopterClaimBySubscriptionId error:', error);
    throw new Error('Failed to fetch early adopter claim');
  }
};

/**
 * Locks the claim row for the rest of the transaction so two concurrent claims cannot both succeed.
 */
export const lockEarlyAdopterClaimByTokenHash = async (
  tokenHash: string,
  dbClient: DbOrTxClient
): Promise<TEarlyAdopterClaim | null> => {
  try {
    const [claim] = await dbClient
      .select()
      .from(schema.earlyAdopterClaim)
      .where(eq(schema.earlyAdopterClaim.tokenHash, tokenHash))
      .limit(1)
      .for('update');

    return claim ?? null;
  } catch (error) {
    console.error('lockEarlyAdopterClaimByTokenHash error:', error);
    throw new Error('Failed to lock early adopter claim');
  }
};

export const markEarlyAdopterClaimClaimed = async (
  id: number,
  data: { claimedOrgId: string; claimedByProfileId: string },
  dbClient: DbOrTxClient = db
): Promise<TEarlyAdopterClaim | null> => {
  try {
    const [claim] = await dbClient
      .update(schema.earlyAdopterClaim)
      .set({
        status: 'claimed',
        claimedOrgId: data.claimedOrgId,
        claimedByProfileId: data.claimedByProfileId,
        claimedAt: sql`now()`,
        updatedAt: sql`now()`
      })
      .where(and(eq(schema.earlyAdopterClaim.id, id), eq(schema.earlyAdopterClaim.status, 'pending')))
      .returning();

    return claim ?? null;
  } catch (error) {
    console.error('markEarlyAdopterClaimClaimed error:', error);
    throw new Error('Failed to mark early adopter claim as claimed');
  }
};

/**
 * Records a Polar lifecycle update on a purchase that has not been claimed yet.
 */
export const updateUnclaimedEarlyAdopterClaim = async (
  subscriptionId: string,
  updates: { status: EarlyAdopterClaimStatus; payload: TEarlyAdopterClaim['payload'] },
  dbClient: DbOrTxClient = db
): Promise<TEarlyAdopterClaim | null> => {
  try {
    const [claim] = await dbClient
      .update(schema.earlyAdopterClaim)
      .set({ ...updates, updatedAt: sql`now()` })
      .where(
        and(
          eq(schema.earlyAdopterClaim.polarSubscriptionId, subscriptionId),
          eq(schema.earlyAdopterClaim.status, 'pending')
        )
      )
      .returning();

    return claim ?? null;
  } catch (error) {
    console.error('updateUnclaimedEarlyAdopterClaim error:', error);
    throw new Error('Failed to update early adopter claim');
  }
};

/**
 * Pending, unexpired purchases created before `createdBefore` that have not been reminded yet.
 */
export const listEarlyAdopterClaimsDueForReminder = async (
  createdBefore: string,
  limit = 100,
  dbClient: DbOrTxClient = db
): Promise<TEarlyAdopterClaim[]> => {
  try {
    return await dbClient
      .select()
      .from(schema.earlyAdopterClaim)
      .where(
        and(
          eq(schema.earlyAdopterClaim.status, 'pending'),
          isNull(schema.earlyAdopterClaim.reminderSentAt),
          lt(schema.earlyAdopterClaim.createdAt, createdBefore),
          sql`${schema.earlyAdopterClaim.expiresAt} > now()`
        )
      )
      .orderBy(asc(schema.earlyAdopterClaim.createdAt))
      .limit(limit);
  } catch (error) {
    console.error('listEarlyAdopterClaimsDueForReminder error:', error);
    throw new Error('Failed to list early adopter claims due for reminder');
  }
};

export const markEarlyAdopterClaimReminded = async (id: number, dbClient: DbOrTxClient = db): Promise<void> => {
  try {
    await dbClient
      .update(schema.earlyAdopterClaim)
      .set({ reminderSentAt: sql`now()`, updatedAt: sql`now()` })
      .where(eq(schema.earlyAdopterClaim.id, id));
  } catch (error) {
    console.error('markEarlyAdopterClaimReminded error:', error);
    throw new Error('Failed to mark early adopter claim as reminded');
  }
};
