import * as schema from '@db/schema';
import { eq, sql } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';

/**
 * Stores or clears the org's insights student target. Returns the stored value, or null when cleared or org missing.
 */
export async function setOrganizationStudentTarget(
  orgId: string,
  studentTarget: number | null,
  dbClient: DbOrTxClient = db
): Promise<number | null> {
  try {
    const nextSettings = sql`jsonb_set(
      COALESCE(${schema.organization.settings}, '{}'::jsonb),
      '{insights}',
      COALESCE(${schema.organization.settings} -> 'insights', '{}'::jsonb)
        || jsonb_build_object('studentTarget', ${studentTarget}::int)
    )`;
    const [row] = await dbClient
      .update(schema.organization)
      .set({ settings: nextSettings })
      .where(eq(schema.organization.id, orgId))
      .returning({
        studentTarget: sql<number | null>`(${schema.organization.settings} -> 'insights' ->> 'studentTarget')::int`
      });

    return row?.studentTarget ?? null;
  } catch (error) {
    console.error('setOrganizationStudentTarget error:', error);
    throw new Error(`Failed to save student target: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
