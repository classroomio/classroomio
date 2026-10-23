import * as schema from '@db/schema';
import { eq, sql } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';

/**
 * Stores or clears the org's insights learner target. Returns the stored value, or null when cleared or org missing.
 */
export async function setOrganizationLearnerTarget(
  orgId: string,
  learnerTarget: number | null,
  dbClient: DbOrTxClient = db
): Promise<number | null> {
  try {
    const nextSettings = sql`jsonb_set(
      COALESCE(${schema.organization.settings}, '{}'::jsonb),
      '{insights}',
      COALESCE(${schema.organization.settings} -> 'insights', '{}'::jsonb)
        || jsonb_build_object('learnerTarget', ${learnerTarget}::int)
    )`;
    const [row] = await dbClient
      .update(schema.organization)
      .set({ settings: nextSettings })
      .where(eq(schema.organization.id, orgId))
      .returning({
        learnerTarget: sql<number | null>`(${schema.organization.settings} -> 'insights' ->> 'learnerTarget')::int`
      });

    return row?.learnerTarget ?? null;
  } catch (error) {
    console.error('setOrganizationLearnerTarget error:', error);
    throw new Error(`Failed to save learner target: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
