import * as schema from '@db/schema';

import { and, eq, inArray, isNull } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';
import type { TNewOnboardingSession, TOnboardingSession } from '@db/types';
import type { TOnboardingPhase } from '@cio/utils/constants/onboarding';

export async function getOnboardingSession(
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<TOnboardingSession | null> {
  try {
    const [session] = await dbClient
      .select()
      .from(schema.onboardingSession)
      .where(eq(schema.onboardingSession.profileId, profileId))
      .limit(1);

    return session ?? null;
  } catch (error) {
    console.error('getOnboardingSession error:', error);
    throw new Error('Failed to fetch onboarding session');
  }
}

export async function createOnboardingSession(
  values: TNewOnboardingSession,
  dbClient: DbOrTxClient = db
): Promise<TOnboardingSession> {
  try {
    await dbClient.insert(schema.onboardingSession).values(values).onConflictDoNothing();

    const session = await getOnboardingSession(values.profileId, dbClient);
    if (!session) throw new Error('Failed to create onboarding session');

    return session;
  } catch (error) {
    console.error('createOnboardingSession error:', error);
    throw new Error('Failed to create onboarding session');
  }
}

export async function updateOnboardingSession(
  profileId: string,
  patch: Partial<Omit<TNewOnboardingSession, 'profileId' | 'createdAt'>>,
  dbClient: DbOrTxClient = db
): Promise<TOnboardingSession | null> {
  try {
    const [session] = await dbClient
      .update(schema.onboardingSession)
      .set({ ...patch, updatedAt: new Date().toISOString() })
      .where(eq(schema.onboardingSession.profileId, profileId))
      .returning();

    return session ?? null;
  } catch (error) {
    console.error('updateOnboardingSession error:', error);
    throw new Error('Failed to update onboarding session');
  }
}

/**
 * Moves the session to `to` only while it is in one of the `from` phases. Returns null when it is elsewhere,
 * so a stale or repeated request never moves a session backwards.
 */
export async function advanceOnboardingPhase(
  profileId: string,
  from: readonly TOnboardingPhase[],
  to: TOnboardingPhase,
  dbClient: DbOrTxClient = db
): Promise<TOnboardingSession | null> {
  try {
    const [session] = await dbClient
      .update(schema.onboardingSession)
      .set({ phase: to, updatedAt: new Date().toISOString() })
      .where(and(eq(schema.onboardingSession.profileId, profileId), inArray(schema.onboardingSession.phase, [...from])))
      .returning();

    return session ?? null;
  } catch (error) {
    console.error('advanceOnboardingPhase error:', error);
    throw new Error('Failed to advance onboarding phase');
  }
}

/**
 * Links the session to its organization only when it has none yet. Returns null when another request already
 * linked one, so the caller can roll back the organization it just created.
 */
export async function claimOnboardingOrganization(
  profileId: string,
  organizationId: string,
  dbClient: DbOrTxClient = db
): Promise<TOnboardingSession | null> {
  try {
    const [session] = await dbClient
      .update(schema.onboardingSession)
      .set({ organizationId, updatedAt: new Date().toISOString() })
      .where(and(eq(schema.onboardingSession.profileId, profileId), isNull(schema.onboardingSession.organizationId)))
      .returning();

    return session ?? null;
  } catch (error) {
    console.error('claimOnboardingOrganization error:', error);
    throw new Error('Failed to link onboarding organization');
  }
}
