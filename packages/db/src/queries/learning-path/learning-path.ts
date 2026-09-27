import { count, eq } from 'drizzle-orm';
import { db } from '@db/drizzle';
import * as schema from '../../schema';

/**
 * Counts total learning paths in an organization.
 */
export async function countLearningPathsByOrg(orgId: string): Promise<number> {
  try {
    const [countRow] = await db
      .select({ count: count(schema.learningPath.id) })
      .from(schema.learningPath)
      .where(eq(schema.learningPath.organizationId, orgId));

    return Number(countRow?.count ?? 0);
  } catch (error) {
    console.error('countLearningPathsByOrg error:', error);
    throw new Error(
      `Failed to count learning paths by organization: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
