import { and, asc, count, desc, eq, inArray, isNull, or, sql } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';

import { db, type DbOrTxClient } from '@db/drizzle';
import { getPostgresError } from '@cio/utils/errors';
import { ROLE } from '@cio/utils/constants';

import * as schema from '../../schema';
import type { TLearningPath, TLearningPathMember, TNewLearningPath } from '../../types';

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
    const whereConditions = [eq(schema.learningPath.organizationId, orgId), eq(schema.learningPath.status, 'ACTIVE')];

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

    const whereConditions = [
      eq(schema.learningPath.organizationId, organizationId),
      eq(schema.learningPath.status, 'ACTIVE')
    ];

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
 * Creates a new learning path with unique publicId and no slug.
 * The public slug is minted later at landing/go-live time.
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

      const payload: TNewLearningPath = {
        ...data,
        publicId,
        slug: null,
        isPublished: data.isPublished ?? false
      };

      const [created] = await dbClient.insert(schema.learningPath).values(payload).returning();
      if (!created) {
        throw new Error('Failed to create learning path');
      }

      return created;
    } catch (error) {
      // Retry creation after publicId unique-constraint collisions
      const postgresError = getPostgresError(error);
      const isRetryableUniqueViolation =
        postgresError?.code === '23505' && postgresError.constraint === 'learning_path_public_id_unique';

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
    const [path] = await dbClient
      .select()
      .from(schema.learningPath)
      .where(and(eq(schema.learningPath.id, id), eq(schema.learningPath.status, 'ACTIVE')))
      .limit(1);

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
      .where(and(eq(schema.learningPath.publicId, publicId), eq(schema.learningPath.status, 'ACTIVE')))
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
      .where(
        and(
          eq(schema.learningPath.organizationId, organizationId),
          eq(schema.learningPath.slug, slug),
          eq(schema.learningPath.status, 'ACTIVE')
        )
      )
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
 * Returns the id, name and enrollment settings for learning paths in an organization.
 * Used to validate audience-import path assignments and to label invite emails.
 */
export async function getOrgLearningPathsByIds(
  orgId: string,
  pathIds: string[],
  dbClient: DbOrTxClient = db
): Promise<Array<Pick<TLearningPath, 'id' | 'name' | 'autoEnroll' | 'sequentialUnlock' | 'welcomeEmailMessage'>>> {
  if (pathIds.length === 0) {
    return [];
  }

  try {
    const rows = await dbClient
      .select({
        id: schema.learningPath.id,
        name: schema.learningPath.name,
        autoEnroll: schema.learningPath.autoEnroll,
        sequentialUnlock: schema.learningPath.sequentialUnlock,
        welcomeEmailMessage: schema.learningPath.welcomeEmailMessage
      })
      .from(schema.learningPath)
      .where(
        and(
          eq(schema.learningPath.organizationId, orgId),
          inArray(schema.learningPath.id, pathIds),
          eq(schema.learningPath.status, 'ACTIVE')
        )
      );

    return rows;
  } catch (error) {
    console.error('getOrgLearningPathsByIds error:', error);
    throw new Error(
      `Failed to get learning paths by organization: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Returns the organization ID for a learning path.
 */
export async function getLearningPathOrgId(
  learningPathId: string,
  dbClient: DbOrTxClient = db
): Promise<string | null> {
  try {
    const [row] = await dbClient
      .select({ organizationId: schema.learningPath.organizationId })
      .from(schema.learningPath)
      .where(eq(schema.learningPath.id, learningPathId))
      .limit(1);

    return row?.organizationId ?? null;
  } catch (error) {
    console.error('getLearningPathOrgId error:', error);
    throw new Error(
      `Failed to get organization ID for learning path "${learningPathId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Returns ordered list of active course UUIDs in a learning path (with transaction support).
 */
export async function getCourseIdsByLearningPathId(
  learningPathId: string,
  dbClient: DbOrTxClient = db
): Promise<string[]> {
  try {
    const rows = await dbClient
      .select({ courseId: schema.learningPathCourse.courseId })
      .from(schema.learningPathCourse)
      .where(
        and(eq(schema.learningPathCourse.learningPathId, learningPathId), isNull(schema.learningPathCourse.removedAt))
      )
      .orderBy(asc(schema.learningPathCourse.order));

    return rows.map((r) => r.courseId);
  } catch (error) {
    console.error('getCourseIdsByLearningPathId error:', error);
    throw new Error(
      `Failed to get course ids in learning path: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Inserts a learning path member if not already present. Returns the created member or null if already exists.
 */
export async function insertLearningPathMemberIfAbsent(
  data: { learningPathId: string; roleId: number; profileId: string; email: string },
  dbClient: DbOrTxClient = db
): Promise<TLearningPathMember | null> {
  try {
    const [member] = await dbClient
      .insert(schema.learningPathMember)
      .values({
        learningPathId: data.learningPathId,
        profileId: data.profileId,
        email: data.email,
        roleId: data.roleId,
        status: 'NOT_STARTED',
        enrolledAt: new Date().toISOString()
      })
      .onConflictDoNothing({
        target: [schema.learningPathMember.learningPathId, schema.learningPathMember.profileId]
      })
      .returning();

    return member ?? null;
  } catch (error) {
    console.error('insertLearningPathMemberIfAbsent error:', error);
    throw new Error(
      `Failed to insert learning path member: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Locks a learning path row for update and returns it.
 * Used to prevent concurrent state changes during invite acceptance.
 */
export async function lockLearningPathStatusForAccept(
  learningPathId: string,
  dbClient: DbOrTxClient = db
): Promise<{ id: string; isPublished: boolean; status: string } | null> {
  try {
    const [row] = await dbClient
      .select({
        id: schema.learningPath.id,
        isPublished: schema.learningPath.isPublished,
        status: schema.learningPath.status
      })
      .from(schema.learningPath)
      .where(eq(schema.learningPath.id, learningPathId))
      .for('update')
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('lockLearningPathStatusForAccept error:', error);
    throw new Error(
      `Failed to lock learning path for accept: ${error instanceof Error ? error.message : 'Unknown error'}`
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
    // Deletion is soft: the row stays with status DELETED so
    // public reads (filtered to ACTIVE) hide it while history is preserved.
    const [deleted] = await dbClient
      .update(schema.learningPath)
      .set({ status: 'DELETED', updatedAt: new Date().toISOString() })
      .where(eq(schema.learningPath.id, id))
      .returning();

    return deleted || null;
  } catch (error) {
    console.error('deleteLearningPath error:', error);
    throw new Error(
      `Failed to delete learning path "${id}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
