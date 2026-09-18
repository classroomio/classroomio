import { and, count, desc, eq, or, sql } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';

import { db, type DbOrTxClient } from '@db/drizzle';
import { getPostgresError } from '@cio/utils/errors';
import { resolveSlugCollision, slugifyTitle } from '@cio/utils/validation';
import { ROLE } from '@cio/utils/constants';

import * as schema from '../../schema';
import type { TLearningPath, TNewLearningPath } from '../../types';

export interface TLearningPathWithCounts extends TLearningPath {
  courseCount: number;
  memberCount: number;
  completionsCount: number;
  completionRate: number;
}

export type TCreateLearningPathInput = Omit<TNewLearningPath, 'id' | 'publicId' | 'slug' | 'createdAt' | 'updatedAt'>;

const PUBLIC_ID_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * Generates an 8-character mixed-case alphanumeric public identifier ([0-9A-Za-z])
 * conforming to the Learning Paths PRD requirement for publicId in dashboard and LMS URLs.
 */
export function generatePublicId(length = 8): string {
  const bytes = randomBytes(length);
  let result = '';

  for (let i = 0; i < length; i++) {
    result += PUBLIC_ID_CHARS[bytes[i] % PUBLIC_ID_CHARS.length];
  }

  return result;
}

/**
 * Builds the SQL condition matching learning paths where a given tutor is assigned as an active tutor.
 */
export function buildTutorLearningPathCondition(tutorProfileId: string) {
  return sql`EXISTS (
    SELECT 1 FROM ${schema.learningPathMember}
    WHERE ${schema.learningPathMember.learningPathId} = ${schema.learningPath.id}
      AND ${schema.learningPathMember.profileId} = ${tutorProfileId}
      AND ${schema.learningPathMember.roleId} = ${ROLE.TUTOR}
      AND ${schema.learningPathMember.removedAt} IS NULL
  )`;
}

/**
 * Counts total learning paths in an organization.
 * Optionally filters to paths assigned to a tutor.
 */
export async function countLearningPathsByOrg(
  orgId: string,
  options?: { tutorProfileId?: string },
  dbClient: DbOrTxClient = db
): Promise<number> {
  try {
    const whereConditions = [eq(schema.learningPath.organizationId, orgId)];

    if (options?.tutorProfileId) {
      whereConditions.push(buildTutorLearningPathCondition(options.tutorProfileId));
    }

    const [countRow] = await dbClient
      .select({ count: count(schema.learningPath.id) })
      .from(schema.learningPath)
      .where(and(...whereConditions));

    return Number(countRow?.count ?? 0);
  } catch (error) {
    console.error('countLearningPathsByOrg error:', error);
    throw new Error(
      `Failed to count learning paths by organization: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Lists learning paths for an organization with course, member, and completion counts.
 * Optionally filters to paths assigned to a tutor.
 */
export async function listLearningPaths(
  organizationId: string,
  options?: { tutorProfileId?: string },
  dbClient: DbOrTxClient = db
): Promise<TLearningPathWithCounts[]> {
  try {
    const courseCountSql = sql<number>`
      COALESCE(
        (SELECT COUNT(*)::int
         FROM ${schema.learningPathCourse}
         WHERE ${and(
           eq(schema.learningPathCourse.learningPathId, schema.learningPath.id),
           sql`${schema.learningPathCourse.removedAt} IS NULL`
         )}),
        0
      )
    `.as('courseCount');

    const memberCountSql = sql<number>`
      COALESCE(
        (SELECT COUNT(*)::int
         FROM ${schema.learningPathMember}
         WHERE ${and(
           eq(schema.learningPathMember.learningPathId, schema.learningPath.id),
           sql`${schema.learningPathMember.removedAt} IS NULL`
         )}),
        0
      )
    `.as('memberCount');

    const completionsCountSql = sql<number>`
      COALESCE(
        (SELECT COUNT(*)::int
         FROM ${schema.learningPathMember}
         WHERE ${and(
           eq(schema.learningPathMember.learningPathId, schema.learningPath.id),
           eq(schema.learningPathMember.status, 'COMPLETED'),
           sql`${schema.learningPathMember.removedAt} IS NULL`
         )}),
        0
      )
    `.as('completionsCount');

    const whereConditions = [eq(schema.learningPath.organizationId, organizationId)];

    if (options?.tutorProfileId) {
      whereConditions.push(buildTutorLearningPathCondition(options.tutorProfileId));
    }

    const rows = await dbClient
      .select({
        learningPath: schema.learningPath,
        courseCount: courseCountSql,
        memberCount: memberCountSql,
        completionsCount: completionsCountSql
      })
      .from(schema.learningPath)
      .where(and(...whereConditions))
      .orderBy(desc(schema.learningPath.createdAt));

    return rows.map((row) => {
      const memberCount = Number(row.memberCount || 0);
      const completionsCount = Number(row.completionsCount || 0);
      const completionRate = memberCount > 0 ? Math.round((completionsCount / memberCount) * 100) : 0;

      return {
        ...row.learningPath,
        courseCount: Number(row.courseCount || 0),
        memberCount,
        completionsCount,
        completionRate
      };
    });
  } catch (error) {
    console.error('listLearningPaths error:', error);
    throw new Error(
      `Failed to list learning paths for org "${organizationId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Creates a new learning path with unique publicId and org-scoped unique slug.
 */
export async function createLearningPath(
  data: TCreateLearningPathInput,
  dbClient: DbOrTxClient = db
): Promise<TLearningPath> {
  const MAX_CREATE_ATTEMPTS = 5;

  for (let attempt = 0; attempt < MAX_CREATE_ATTEMPTS; attempt++) {
    try {
      let publicId = '';
      let isUnique = false;
      let attempts = 0;

      while (!isUnique && attempts < 5) {
        attempts++;
        const candidate = generatePublicId(8);
        const [existing] = await dbClient
          .select({ id: schema.learningPath.id })
          .from(schema.learningPath)
          .where(eq(schema.learningPath.publicId, candidate))
          .limit(1);

        if (!existing) {
          publicId = candidate;
          isUnique = true;
        }
      }

      if (!publicId) {
        throw new Error('Failed to generate a unique publicId for learning path');
      }

      const baseSlug = slugifyTitle(data.name || 'untitled');
      const existingRows = await dbClient
        .select({ slug: schema.learningPath.slug })
        .from(schema.learningPath)
        .where(eq(schema.learningPath.organizationId, data.organizationId));

      const takenSlugs = existingRows.map((r) => r.slug);
      // Offset the candidate slug by attempt so a retry does not re-select
      // the same slug that just collided under concurrency.
      const slug =
        attempt === 0
          ? resolveSlugCollision(baseSlug, takenSlugs)
          : resolveSlugCollision(`${baseSlug}-${attempt + 1}`, [...takenSlugs, baseSlug]);

      const payload: TNewLearningPath = {
        ...data,
        publicId,
        slug,
        isPublished: data.isPublished ?? false
      };

      const [created] = await dbClient.insert(schema.learningPath).values(payload).returning();
      if (!created) {
        throw new Error('Failed to create learning path');
      }

      return created;
    } catch (error) {
      // Retry creation after unique-constraint collisions
      const postgresError = getPostgresError(error);
      const isRetryableUniqueViolation =
        postgresError?.code === '23505' &&
        (postgresError.constraint === 'learning_path_public_id_unique' ||
          postgresError.constraint === 'learning_path_organization_id_slug_unique');

      if (isRetryableUniqueViolation && attempt + 1 < MAX_CREATE_ATTEMPTS) {
        continue;
      }

      console.error('createLearningPath error:', error);
      throw new Error(`Failed to create learning path: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  console.error('createLearningPath error:', new Error('Exhausted slug/publicId retries'));
  throw new Error('Failed to create learning path: exhausted slug/publicId retries');
}

/**
 * Fetches a learning path by UUID PK.
 */
export async function getLearningPathById(id: string, dbClient: DbOrTxClient = db): Promise<TLearningPath | null> {
  try {
    const [path] = await dbClient.select().from(schema.learningPath).where(eq(schema.learningPath.id, id)).limit(1);

    return path || null;
  } catch (error) {
    console.error('getLearningPathById error:', error);
    throw new Error(`Failed to get learning path "${id}": ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fetches a learning path by 8-character publicId (for dashboard/LMS URLs).
 */
export async function getLearningPathByPublicId(
  publicId: string,
  dbClient: DbOrTxClient = db
): Promise<TLearningPath | null> {
  try {
    const [path] = await dbClient
      .select()
      .from(schema.learningPath)
      .where(eq(schema.learningPath.publicId, publicId))
      .limit(1);

    return path || null;
  } catch (error) {
    console.error('getLearningPathByPublicId error:', error);
    throw new Error(
      `Failed to get learning path by publicId "${publicId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Fetches a learning path by organizationId and slug (for public org-site URLs).
 */
export async function getLearningPathBySlug(
  organizationId: string,
  slug: string,
  dbClient: DbOrTxClient = db
): Promise<TLearningPath | null> {
  try {
    const [path] = await dbClient
      .select()
      .from(schema.learningPath)
      .where(and(eq(schema.learningPath.organizationId, organizationId), eq(schema.learningPath.slug, slug)))
      .limit(1);

    return path || null;
  } catch (error) {
    console.error('getLearningPathBySlug error:', error);
    throw new Error(
      `Failed to get learning path by slug "${slug}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Updates a learning path by UUID PK.
 */
export async function updateLearningPath(
  id: string,
  data: Partial<TNewLearningPath>,
  dbClient: DbOrTxClient = db
): Promise<TLearningPath | null> {
  try {
    const nowIso = new Date().toISOString();
    const [updated] = await dbClient
      .update(schema.learningPath)
      .set({
        ...data,
        updatedAt: nowIso
      })
      .where(eq(schema.learningPath.id, id))
      .returning();

    return updated || null;
  } catch (error) {
    console.error('updateLearningPath error:', error);
    throw new Error(
      `Failed to update learning path "${id}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Deletes a learning path by UUID PK.
 * Cascades to learning_path_course and learning_path_member.
 * DOES NOT touch course, groupmember, or student progress rows.
 */
export async function deleteLearningPath(id: string, dbClient: DbOrTxClient = db): Promise<TLearningPath | null> {
  try {
    const [deleted] = await dbClient.delete(schema.learningPath).where(eq(schema.learningPath.id, id)).returning();

    return deleted || null;
  } catch (error) {
    console.error('deleteLearningPath error:', error);
    throw new Error(
      `Failed to delete learning path "${id}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
