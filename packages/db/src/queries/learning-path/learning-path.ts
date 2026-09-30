import { and, count, desc, eq, ilike, inArray, isNull, or, sql } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';

import { db, type DbOrTxClient } from '@db/drizzle';
import { getPostgresError } from '@cio/utils/errors';
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
 * Optionally filters to paths assigned to a tutor and/or matching a search term.
 */
export async function countLearningPathsByOrg(
  orgId: string,
  options?: { tutorProfileId?: string; search?: string },
  dbClient: DbOrTxClient = db
): Promise<number> {
  try {
    const whereConditions = [eq(schema.learningPath.organizationId, orgId), eq(schema.learningPath.status, 'ACTIVE')];

    if (options?.tutorProfileId) {
      whereConditions.push(buildTutorLearningPathCondition(options.tutorProfileId));
    }

    const search = options?.search?.trim();
    if (search) {
      const pattern = `%${search}%`;
      whereConditions.push(
        or(ilike(schema.learningPath.name, pattern), ilike(schema.learningPath.description, pattern))!
      );
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

export interface TListLearningPathsOptions {
  tutorProfileId?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface TPaginatedLearningPaths {
  data: TLearningPathWithCounts[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Lists learning paths for an organization with course, member, and completion counts.
 * Optionally filters to paths assigned to a tutor and/or matching a search term.
 * Paginates with limit/offset when a limit is provided; otherwise returns all rows.
 */
export async function listLearningPaths(
  organizationId: string,
  options?: TListLearningPathsOptions,
  dbClient: DbOrTxClient = db
): Promise<TPaginatedLearningPaths> {
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

    const search = options?.search?.trim();
    if (search) {
      const pattern = `%${search}%`;
      whereConditions.push(
        or(ilike(schema.learningPath.name, pattern), ilike(schema.learningPath.description, pattern))!
      );
    }

    const page = options?.page && options.page > 0 ? Math.floor(options.page) : 1;
    const limit = options?.limit && options.limit > 0 ? Math.floor(options.limit) : undefined;

    const [total, rows] = await Promise.all([
      countLearningPathsByOrg(organizationId, { tutorProfileId: options?.tutorProfileId, search }, dbClient),
      (async () => {
        const baseQuery = dbClient
          .select({
            learningPath: schema.learningPath,
            courseCount: courseCountSql,
            memberCount: memberCountSql,
            completionsCount: completionsCountSql
          })
          .from(schema.learningPath)
          .where(and(...whereConditions))
          .orderBy(desc(schema.learningPath.createdAt));

        if (limit !== undefined) {
          return baseQuery.limit(limit).offset((page - 1) * limit);
        }

        return baseQuery;
      })()
    ]);

    const data = rows.map((row) => {
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

    const effectiveLimit = limit ?? total;

    return {
      data,
      pagination: {
        page,
        limit: effectiveLimit,
        total,
        totalPages: effectiveLimit > 0 ? Math.ceil(total / effectiveLimit) : 0
      }
    };
  } catch (error) {
    console.error('listLearningPaths error:', error);
    throw new Error(
      `Failed to list learning paths for org "${organizationId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Public catalog row: only the fields an org-site visitor may see.
 * Post-enrollment content (welcome messages, certificate email copy) and
 * team internals (member counts, completion rates) are excluded here; the
 * public detail endpoint serves the full landing payload per path.
 */
export interface TPublicLearningPathListItem {
  id: string;
  publicId: string;
  slug: string | null;
  name: string;
  description: string;
  coverImage: string | null;
  cost: number;
  currency: string;
  landingPage: TLearningPath['landingPage'];
  courseCount: number;
}

export interface TPublicLearningPathsOptions {
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * Lists published learning paths for an organization's public catalog.
 * Unauthenticated-safe: published + ACTIVE only, with a public projection.
 * Paginates with limit/offset when a limit is provided.
 */
export async function listPublicLearningPaths(
  organizationId: string,
  options?: TPublicLearningPathsOptions,
  dbClient: DbOrTxClient = db
): Promise<{ data: TPublicLearningPathListItem[]; pagination: TPaginatedLearningPaths['pagination'] }> {
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

    const whereConditions = [
      eq(schema.learningPath.organizationId, organizationId),
      eq(schema.learningPath.status, 'ACTIVE'),
      eq(schema.learningPath.isPublished, true)
    ];

    const search = options?.search?.trim();
    if (search) {
      const pattern = `%${search}%`;
      whereConditions.push(
        or(ilike(schema.learningPath.name, pattern), ilike(schema.learningPath.description, pattern))!
      );
    }

    const page = options?.page && options.page > 0 ? Math.floor(options.page) : 1;
    const limit = options?.limit && options.limit > 0 ? Math.floor(options.limit) : undefined;

    const [totalRows, rows] = await Promise.all([
      dbClient
        .select({ total: count() })
        .from(schema.learningPath)
        .where(and(...whereConditions)),
      (async () => {
        const baseQuery = dbClient
          .select({
            id: schema.learningPath.id,
            publicId: schema.learningPath.publicId,
            slug: schema.learningPath.slug,
            name: schema.learningPath.name,
            description: schema.learningPath.description,
            coverImage: schema.learningPath.coverImage,
            cost: schema.learningPath.cost,
            currency: schema.learningPath.currency,
            landingPage: schema.learningPath.landingPage,
            courseCount: courseCountSql
          })
          .from(schema.learningPath)
          .where(and(...whereConditions))
          .orderBy(desc(schema.learningPath.createdAt));

        if (limit !== undefined) {
          return baseQuery.limit(limit).offset((page - 1) * limit);
        }

        return baseQuery;
      })()
    ]);

    const total = Number(totalRows[0]?.total ?? 0);
    const data = rows.map((row) => ({ ...row, courseCount: Number(row.courseCount || 0) }));
    const effectiveLimit = limit ?? total;

    return {
      data,
      pagination: {
        page,
        limit: effectiveLimit,
        total,
        totalPages: effectiveLimit > 0 ? Math.ceil(total / effectiveLimit) : 0
      }
    };
  } catch (error) {
    console.error('listPublicLearningPaths error:', error);
    throw new Error(
      `Failed to list public learning paths for org "${organizationId}": ${error instanceof Error ? error.message : 'Unknown error'}`
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
): Promise<
  Array<
    Pick<
      TLearningPath,
      'id' | 'name' | 'autoEnroll' | 'sequentialUnlock' | 'welcomeEmailMessage' | 'organizationId' | 'publicId'
    >
  >
> {
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
        welcomeEmailMessage: schema.learningPath.welcomeEmailMessage,
        organizationId: schema.learningPath.organizationId,
        publicId: schema.learningPath.publicId
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

export interface TSearchLearningPath {
  id: string;
  publicId: string;
  name: string;
  description: string | null;
  status: string;
  updatedAt: string | null;
}

/**
 * Searches an organization's learning paths by name or description.
 * Powers the team command palette; includes unpublished paths since the
 * callers are team members managing the catalog.
 */
export async function searchOrgLearningPaths(
  orgId: string,
  search: string,
  limit: number
): Promise<TSearchLearningPath[]> {
  try {
    const searchValue = `%${search.trim()}%`;

    return await db
      .select({
        id: schema.learningPath.id,
        publicId: schema.learningPath.publicId,
        name: schema.learningPath.name,
        description: schema.learningPath.description,
        status: schema.learningPath.status,
        updatedAt: schema.learningPath.updatedAt
      })
      .from(schema.learningPath)
      .where(
        and(
          eq(schema.learningPath.organizationId, orgId),
          or(ilike(schema.learningPath.name, searchValue), ilike(schema.learningPath.description, searchValue))
        )
      )
      .orderBy(desc(schema.learningPath.updatedAt))
      .limit(limit);
  } catch (error) {
    console.error('searchOrgLearningPaths error:', error);
    throw new Error(`Failed to search org learning paths: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Searches the learning paths a learner is enrolled in.
 * Powers the LMS palette; never surfaces paths the learner has not joined.
 */
export async function searchLmsLearningPaths(
  orgId: string,
  profileId: string,
  search: string,
  limit: number
): Promise<TSearchLearningPath[]> {
  try {
    const searchValue = `%${search.trim()}%`;

    return await db
      .select({
        id: schema.learningPath.id,
        publicId: schema.learningPath.publicId,
        name: schema.learningPath.name,
        description: schema.learningPath.description,
        status: schema.learningPath.status,
        updatedAt: schema.learningPath.updatedAt
      })
      .from(schema.learningPathMember)
      .innerJoin(schema.learningPath, eq(schema.learningPathMember.learningPathId, schema.learningPath.id))
      .where(
        and(
          eq(schema.learningPathMember.profileId, profileId),
          isNull(schema.learningPathMember.removedAt),
          eq(schema.learningPath.organizationId, orgId),
          or(ilike(schema.learningPath.name, searchValue), ilike(schema.learningPath.description, searchValue))
        )
      )
      .orderBy(desc(schema.learningPath.updatedAt))
      .limit(limit);
  } catch (error) {
    console.error('searchLmsLearningPaths error:', error);
    throw new Error(`Failed to search LMS learning paths: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    // Tombstone the slug to free the clean slug for reuse while preserving
    // the original value for restore if need be (`original.split('__deleted_')[0]`).
    const [existing] = await dbClient
      .select({ slug: schema.learningPath.slug })
      .from(schema.learningPath)
      .where(eq(schema.learningPath.id, id));

    const tombstoneSlug = existing?.slug ? `${existing.slug}__deleted_${Date.now()}` : null;

    const [deleted] = await dbClient
      .update(schema.learningPath)
      .set({ status: 'DELETED', slug: tombstoneSlug, updatedAt: new Date().toISOString() })
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
