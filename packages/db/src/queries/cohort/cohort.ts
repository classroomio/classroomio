import * as schema from '@db/schema';

import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  or,
  sql,
  type SQL,
  type SQLWrapper
} from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants';
import {
  COHORT_PEOPLE_WINDOW_DAYS,
  type TCohortPeopleActivityWindow,
  type TCohortPeopleMembership,
  type TCohortPeopleSortBy,
  type TCohortPeopleSortOrder
} from '@cio/utils/validation/cohort';
import { db, type DbOrTxClient } from '@db/drizzle';

// ─── Types ───────────────────────────────────────────────────────────────────

export type TCohort = typeof schema.cohort.$inferSelect;
export type TNewCohort = typeof schema.cohort.$inferInsert;
export type TCohortMember = typeof schema.cohortMember.$inferSelect;
export type TNewCohortMember = typeof schema.cohortMember.$inferInsert;
export type TCohortCourse = typeof schema.cohortCourse.$inferSelect;
export type TCohortNewsfeed = typeof schema.cohortNewsfeed.$inferSelect;
export type TNewCohortNewsfeed = typeof schema.cohortNewsfeed.$inferInsert;
export type TCohortNewsfeedComment = typeof schema.cohortNewsfeedComment.$inferSelect;
export type TNewCohortNewsfeedComment = typeof schema.cohortNewsfeedComment.$inferInsert;
export type TCohortListPage = { page: number; limit: number };

export type TCohortListFilters = {
  search?: string;
  status?: TCohort['status'];
  sortBy?: 'createdAt' | 'name' | 'courses' | 'students' | 'status';
  sortOrder?: 'asc' | 'desc';
};

const toOffset = (page: TCohortListPage) => (page.page - 1) * page.limit;

const cohortCourseCountSql = () => sql<number>`
  COALESCE(
    (SELECT COUNT(*)::int
     FROM ${schema.cohortCourse}
     WHERE ${eq(schema.cohortCourse.cohortId, schema.cohort.id)}),
    0
  )
`;

const cohortStudentCountSql = () => sql<number>`
  COALESCE(
    (SELECT COUNT(*)::int
     FROM ${schema.cohortMember}
     WHERE ${and(eq(schema.cohortMember.cohortId, schema.cohort.id), eq(schema.cohortMember.roleId, ROLE.STUDENT))}),
    0
  )
`;

function cohortListConditions(organizationId: string, cohortIds: string[] | undefined, filters: TCohortListFilters) {
  const conditions: SQL[] = [eq(schema.cohort.organizationId, organizationId)];

  if (cohortIds && cohortIds.length > 0) {
    conditions.push(inArray(schema.cohort.id, cohortIds));
  }

  if (filters.status) {
    conditions.push(eq(schema.cohort.status, filters.status));
  }

  if (filters.search) {
    const term = `%${filters.search}%`;
    conditions.push(or(ilike(schema.cohort.name, term), ilike(schema.cohort.description, term))!);
  }

  return and(...conditions)!;
}

function cohortListOrderBy({ sortBy = 'createdAt', sortOrder = 'desc' }: TCohortListFilters): SQL[] {
  const ordered = (column: SQLWrapper) => (sortOrder === 'asc' ? asc(column) : desc(column));
  const column =
    sortBy === 'name'
      ? sql`lower(${schema.cohort.name})`
      : sortBy === 'courses'
        ? cohortCourseCountSql()
        : sortBy === 'students'
          ? cohortStudentCountSql()
          : sortBy === 'status'
            ? sql`${schema.cohort.status}::text`
            : schema.cohort.createdAt;

  return [ordered(column), ordered(schema.cohort.id)];
}

// ─── Program CRUD ────────────────────────────────────────────────────────────

export async function createCohort(data: TNewCohort): Promise<TCohort> {
  try {
    const [cohort] = await db.insert(schema.cohort).values(data).returning();
    if (!cohort) throw new Error('Failed to create cohort');
    return cohort;
  } catch (error) {
    console.error('createCohort error:', error);
    throw new Error(`Failed to create cohort: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/** Inserts the cohort and adds `creatorProfileId` as a cohort team member (tutor) in one transaction. */
export async function createCohortWithCreatorMembership(
  cohortData: TNewCohort,
  creatorProfileId: string
): Promise<TCohort> {
  try {
    return await db.transaction(async (tx) => {
      const [cohort] = await tx.insert(schema.cohort).values(cohortData).returning();
      if (!cohort) {
        throw new Error('Failed to create cohort');
      }

      await tx.insert(schema.cohortMember).values({
        cohortId: cohort.id,
        profileId: creatorProfileId,
        roleId: ROLE.TUTOR
      });

      return cohort;
    });
  } catch (error) {
    console.error('createCohortWithCreatorMembership error:', error);
    throw new Error(`Failed to create cohort: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getCohortTitlesByIds(cohortIds: string[]): Promise<Map<string, string | null>> {
  if (cohortIds.length === 0) return new Map();

  try {
    const rows = await db
      .select({ id: schema.cohort.id, name: schema.cohort.name })
      .from(schema.cohort)
      .where(inArray(schema.cohort.id, cohortIds));

    return new Map(rows.map((row) => [row.id, row.name]));
  } catch (error) {
    console.error('getCohortTitlesByIds error:', error);
    throw new Error('Failed to load cohort names');
  }
}

export async function getCohortById(cohortId: string): Promise<TCohort | null> {
  try {
    const [cohort] = await db.select().from(schema.cohort).where(eq(schema.cohort.id, cohortId)).limit(1);
    return cohort || null;
  } catch (error) {
    console.error('getCohortById error:', error);
    throw new Error(`Failed to get cohort "${cohortId}": ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getCohortOrganizationId(cohortId: string): Promise<string | null> {
  try {
    const [row] = await db
      .select({ organizationId: schema.cohort.organizationId })
      .from(schema.cohort)
      .where(eq(schema.cohort.id, cohortId))
      .limit(1);

    return row?.organizationId ?? null;
  } catch (error) {
    console.error('getCohortOrganizationId error:', error);
    throw new Error('Failed to get cohort organization id');
  }
}

export async function getCohortsByOrg(
  organizationId: string,
  cohortIds?: string[],
  page?: TCohortListPage,
  filters: TCohortListFilters = {}
): Promise<Array<TCohort & { courseCount: number; studentCount: number }>> {
  try {
    const query = db
      .select({
        cohort: schema.cohort,
        courseCount: cohortCourseCountSql().as('courseCount'),
        studentCount: cohortStudentCountSql().as('studentCount')
      })
      .from(schema.cohort)
      .where(cohortListConditions(organizationId, cohortIds, filters))
      .orderBy(...cohortListOrderBy(filters))
      .$dynamic();
    const result = await (page ? query.limit(page.limit).offset(toOffset(page)) : query);

    return result.map((row) => ({
      ...row.cohort,
      courseCount: Number(row.courseCount || 0),
      studentCount: Number(row.studentCount || 0)
    }));
  } catch (error) {
    console.error('getCohortsByOrg error:', error);
    throw new Error(
      `Failed to get cohorts for org "${organizationId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Returns org cohorts the given profile can access.
 * Org admins see all cohorts; other members see only cohorts they belong to.
 */
export async function getCohortsByOrgForProfile(
  organizationId: string,
  profileId: string,
  page?: TCohortListPage,
  filters: TCohortListFilters = {}
): Promise<Array<TCohort & { courseCount: number; studentCount: number }>> {
  try {
    const [adminRow] = await db
      .select({ id: schema.organizationmember.id })
      .from(schema.organizationmember)
      .where(
        and(
          eq(schema.organizationmember.organizationId, organizationId),
          eq(schema.organizationmember.profileId, profileId),
          eq(schema.organizationmember.roleId, ROLE.ADMIN)
        )
      )
      .limit(1);

    if (adminRow) {
      return getCohortsByOrg(organizationId, undefined, page, filters);
    }

    const memberRows = await db
      .select({ cohortId: schema.cohortMember.cohortId })
      .from(schema.cohortMember)
      .innerJoin(schema.cohort, eq(schema.cohortMember.cohortId, schema.cohort.id))
      .where(and(eq(schema.cohortMember.profileId, profileId), eq(schema.cohort.organizationId, organizationId)));

    const cohortIds = memberRows.map((r) => r.cohortId);
    if (cohortIds.length === 0) return [];

    return getCohortsByOrg(organizationId, cohortIds, page, filters);
  } catch (error) {
    console.error('getCohortsByOrgForProfile error:', error);
    throw new Error(
      `Failed to get cohorts for profile "${profileId}" in org "${organizationId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function countCohortsByOrgForProfile(
  organizationId: string,
  profileId: string,
  filters: TCohortListFilters = {}
): Promise<number> {
  try {
    const [adminRow] = await db
      .select({ id: schema.organizationmember.id })
      .from(schema.organizationmember)
      .where(
        and(
          eq(schema.organizationmember.organizationId, organizationId),
          eq(schema.organizationmember.profileId, profileId),
          eq(schema.organizationmember.roleId, ROLE.ADMIN)
        )
      )
      .limit(1);

    const conditions = cohortListConditions(organizationId, undefined, filters);
    const [countRow] = adminRow
      ? await db
          .select({ count: count(schema.cohort.id) })
          .from(schema.cohort)
          .where(conditions)
      : await db
          .select({ count: count(schema.cohort.id) })
          .from(schema.cohort)
          .innerJoin(schema.cohortMember, eq(schema.cohortMember.cohortId, schema.cohort.id))
          .where(and(conditions, eq(schema.cohortMember.profileId, profileId)));

    return Number(countRow?.count ?? 0);
  } catch (error) {
    console.error('countCohortsByOrgForProfile error:', error);
    throw new Error(
      `Failed to count cohorts for profile "${profileId}" in org "${organizationId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export interface TSearchOrgCohort {
  id: string;
  name: string;
  description: string | null;
  status: string;
  updatedAt: string | null;
}

export async function searchOrgCohorts(orgId: string, search: string, limit: number): Promise<TSearchOrgCohort[]> {
  try {
    const searchValue = `%${search.trim()}%`;

    return await db
      .select({
        id: schema.cohort.id,
        name: schema.cohort.name,
        description: schema.cohort.description,
        status: schema.cohort.status,
        updatedAt: schema.cohort.updatedAt
      })
      .from(schema.cohort)
      .where(
        and(
          eq(schema.cohort.organizationId, orgId),
          eq(schema.cohort.status, 'ACTIVE'),
          or(ilike(schema.cohort.name, searchValue), ilike(schema.cohort.description, searchValue))
        )
      )
      .orderBy(desc(schema.cohort.updatedAt))
      .limit(limit);
  } catch (error) {
    console.error('searchOrgCohorts error:', error);
    throw new Error(`Failed to search org cohorts: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function searchLmsCohorts(
  orgId: string,
  profileId: string,
  search: string,
  limit: number
): Promise<TSearchOrgCohort[]> {
  try {
    const searchValue = `%${search.trim()}%`;

    return await db
      .select({
        id: schema.cohort.id,
        name: schema.cohort.name,
        description: schema.cohort.description,
        status: schema.cohort.status,
        updatedAt: schema.cohort.updatedAt
      })
      .from(schema.cohortMember)
      .innerJoin(schema.cohort, eq(schema.cohortMember.cohortId, schema.cohort.id))
      .where(
        and(
          eq(schema.cohortMember.profileId, profileId),
          eq(schema.cohort.organizationId, orgId),
          eq(schema.cohort.status, 'ACTIVE'),
          or(ilike(schema.cohort.name, searchValue), ilike(schema.cohort.description, searchValue))
        )
      )
      .orderBy(desc(schema.cohort.updatedAt))
      .limit(limit);
  } catch (error) {
    console.error('searchLmsCohorts error:', error);
    throw new Error(`Failed to search LMS cohorts: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getExistingCohortMembers(
  pairs: Array<{ cohortId: string; profileId: string }>,
  dbClient: DbOrTxClient = db
): Promise<Set<string>> {
  if (pairs.length === 0) {
    return new Set();
  }

  try {
    const cohortIds = [...new Set(pairs.map((pair) => pair.cohortId))];
    const profileIds = [...new Set(pairs.map((pair) => pair.profileId))];

    const rows = await dbClient
      .select({ cohortId: schema.cohortMember.cohortId, profileId: schema.cohortMember.profileId })
      .from(schema.cohortMember)
      .where(and(inArray(schema.cohortMember.cohortId, cohortIds), inArray(schema.cohortMember.profileId, profileIds)));

    return new Set(
      rows
        .filter((row): row is { cohortId: string; profileId: string } => Boolean(row.cohortId && row.profileId))
        .map((row) => `${row.cohortId}:${row.profileId}`)
    );
  } catch (error) {
    console.error('getExistingCohortMembers error:', error);
    throw new Error(
      `Failed to check existing cohort members: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

function normalizeCohortEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hasCohortEmail(email: string | null | undefined): email is string {
  return Boolean(email && email.trim());
}

export type TCohortEmailClaimResult = {
  claimed: number;
  removedDuplicates: number;
  /** Cohorts where a STUDENT row was linked. */
  claimedCohortIds: string[];
};

async function claimEmailOnlyCohortRows(
  scope: SQL,
  profileId: string,
  email: string,
  dbClient: DbOrTxClient
): Promise<TCohortEmailClaimResult> {
  const normalizedEmail = normalizeCohortEmail(email);
  const emailOnlyRow = and(
    scope,
    isNull(schema.cohortMember.profileId),
    eq(sql`lower(trim(${schema.cohortMember.email}))`, normalizedEmail)
  );

  const removed = await dbClient
    .delete(schema.cohortMember)
    .where(
      and(
        emailOnlyRow,
        or(
          sql`exists (select 1 from ${schema.cohortMember} as kept where kept.cohort_id = ${schema.cohortMember.cohortId} and kept.profile_id = ${profileId})`,
          sql`exists (select 1 from ${schema.cohortMember} as kept where kept.cohort_id = ${schema.cohortMember.cohortId} and kept.profile_id is null and lower(trim(kept.email)) = ${normalizedEmail} and kept.id < ${schema.cohortMember.id})`
        )
      )
    )
    .returning({ id: schema.cohortMember.id });

  const claimedRows = await dbClient
    .update(schema.cohortMember)
    .set({ profileId })
    .where(emailOnlyRow)
    .returning({ cohortId: schema.cohortMember.cohortId, roleId: schema.cohortMember.roleId });

  return {
    claimed: claimedRows.length,
    removedDuplicates: removed.length,
    claimedCohortIds: claimedRows.filter((row) => Number(row.roleId) === ROLE.STUDENT).map((row) => row.cohortId)
  };
}

/**
 * Links each user's email-only rows in these cohorts to their profile. Where the profile already has a row in a
 * cohort, the email-only duplicate is deleted instead. Returns counts and the cohorts that gained a linked student row.
 */
export async function claimEmailOnlyCohortMembersForCohorts(
  cohortIds: string[],
  users: Array<{ profileId: string; email?: string | null }>,
  dbClient: DbOrTxClient = db
): Promise<TCohortEmailClaimResult> {
  const uniqueCohortIds = [...new Set(cohortIds)];
  const claimableUsers = users.filter((user) => hasCohortEmail(user.email));

  if (uniqueCohortIds.length === 0 || claimableUsers.length === 0) {
    return { claimed: 0, removedDuplicates: 0, claimedCohortIds: [] };
  }

  try {
    const scope = inArray(schema.cohortMember.cohortId, uniqueCohortIds);
    let claimed = 0;
    let removedDuplicates = 0;
    const claimedCohortIds = new Set<string>();
    for (const user of claimableUsers) {
      const result = await claimEmailOnlyCohortRows(scope, user.profileId, user.email!, dbClient);
      claimed += result.claimed;
      removedDuplicates += result.removedDuplicates;
      result.claimedCohortIds.forEach((cohortId) => claimedCohortIds.add(cohortId));
    }

    return { claimed, removedDuplicates, claimedCohortIds: [...claimedCohortIds] };
  } catch (error) {
    console.error('claimEmailOnlyCohortMembersForCohorts error:', error);
    throw new Error(
      `Failed to claim email-only cohort members: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Links every email-only cohort row for `email` in the organization to `profileId`, with the same duplicate rule as
 * `claimEmailOnlyCohortMembersForCohorts`.
 */
export async function claimEmailOnlyCohortMembers(
  orgId: string,
  email: string,
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<TCohortEmailClaimResult> {
  if (!hasCohortEmail(email)) return { claimed: 0, removedDuplicates: 0, claimedCohortIds: [] };

  try {
    const scope = sql`${schema.cohortMember.cohortId} in (select ${schema.cohort.id} from ${schema.cohort} where ${schema.cohort.organizationId} = ${orgId})`;

    return await claimEmailOnlyCohortRows(scope, profileId, email, dbClient);
  } catch (error) {
    console.error('claimEmailOnlyCohortMembers error:', error);
    throw new Error(
      `Failed to claim email-only cohort members: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Links every email-only program row for `email` in the organization to `profileId`. Where the profile already has
 * a row in a program, the email-only duplicate is deleted instead.
 */
export async function claimEmailOnlyProgramMembers(
  orgId: string,
  email: string,
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<{ claimed: number; removedDuplicates: number }> {
  if (!hasCohortEmail(email)) return { claimed: 0, removedDuplicates: 0 };

  try {
    const normalizedEmail = normalizeCohortEmail(email);
    const emailOnlyRow = and(
      sql`${schema.programMember.programId} in (select ${schema.program.id} from ${schema.program} where ${schema.program.organizationId} = ${orgId})`,
      isNull(schema.programMember.profileId),
      eq(sql`lower(trim(${schema.programMember.email}))`, normalizedEmail)
    );

    const removed = await dbClient
      .delete(schema.programMember)
      .where(
        and(
          emailOnlyRow,
          or(
            sql`exists (select 1 from ${schema.programMember} as kept where kept.program_id = ${schema.programMember.programId} and kept.profile_id = ${profileId})`,
            sql`exists (select 1 from ${schema.programMember} as kept where kept.program_id = ${schema.programMember.programId} and kept.profile_id is null and lower(trim(kept.email)) = ${normalizedEmail} and kept.id < ${schema.programMember.id})`
          )
        )
      )
      .returning({ id: schema.programMember.id });

    const claimedRows = await dbClient
      .update(schema.programMember)
      .set({ profileId })
      .where(emailOnlyRow)
      .returning({ id: schema.programMember.id });

    return { claimed: claimedRows.length, removedDuplicates: removed.length };
  } catch (error) {
    console.error('claimEmailOnlyProgramMembers error:', error);
    throw new Error(
      `Failed to claim email-only program members: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function updateCohort(cohortId: string, data: Partial<TNewCohort>): Promise<TCohort | null> {
  try {
    const [updated] = await db
      .update(schema.cohort)
      .set({ ...data, updatedAt: sql`now()` })
      .where(eq(schema.cohort.id, cohortId))
      .returning();
    return updated || null;
  } catch (error) {
    console.error('updateCohort error:', error);
    throw new Error(
      `Failed to update cohort "${cohortId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function deleteCohort(cohortId: string, dbClient: DbOrTxClient = db): Promise<TCohort | null> {
  try {
    const [deleted] = await dbClient.delete(schema.cohort).where(eq(schema.cohort.id, cohortId)).returning();
    return deleted || null;
  } catch (error) {
    console.error('deleteCohort error:', error);
    throw new Error(
      `Failed to delete cohort "${cohortId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ─── Program Membership ──────────────────────────────────────────────────────

export async function getCohortMemberById(
  cohortId: string,
  memberId: string,
  dbClient: DbOrTxClient = db
): Promise<TCohortMember | null> {
  try {
    const [member] = await dbClient
      .select()
      .from(schema.cohortMember)
      .where(and(eq(schema.cohortMember.cohortId, cohortId), eq(schema.cohortMember.id, memberId)))
      .limit(1);
    return member || null;
  } catch (error) {
    console.error('getCohortMemberById error:', error);
    throw new Error(`Failed to get cohort member: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getCohortMemberByProfileId(cohortId: string, profileId: string): Promise<TCohortMember | null> {
  try {
    const [member] = await db
      .select()
      .from(schema.cohortMember)
      .where(and(eq(schema.cohortMember.cohortId, cohortId), eq(schema.cohortMember.profileId, profileId)))
      .limit(1);
    return member || null;
  } catch (error) {
    console.error('getCohortMemberByProfileId error:', error);
    throw new Error(`Failed to get cohort member: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getCohortMemberByEmail(cohortId: string, email: string): Promise<TCohortMember | null> {
  try {
    const [member] = await db
      .select()
      .from(schema.cohortMember)
      .where(
        and(
          eq(schema.cohortMember.cohortId, cohortId),
          sql`lower(trim(${schema.cohortMember.email})) = ${email.toLowerCase().trim()}`
        )
      )
      .limit(1);
    return member || null;
  } catch (error) {
    console.error('getCohortMemberByEmail error:', error);
    throw new Error(`Failed to get cohort member: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function isCohortMember(cohortId: string, profileId: string): Promise<boolean> {
  try {
    const member = await getCohortMemberByProfileId(cohortId, profileId);
    return member !== null;
  } catch (error) {
    console.error('isCohortMember error:', error);
    throw new Error(`Failed to check cohort membership: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getCohortMemberRole(cohortId: string, profileId: string): Promise<number | null> {
  try {
    const member = await getCohortMemberByProfileId(cohortId, profileId);
    return member?.roleId || null;
  } catch (error) {
    console.error('getCohortMemberRole error:', error);
    throw new Error(`Failed to get cohort member role: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function isOrgAdminByCohortId(cohortId: string, profileId: string): Promise<boolean> {
  try {
    const result = await db
      .select({ orgMemberId: schema.organizationmember.id })
      .from(schema.cohort)
      .innerJoin(
        schema.organizationmember,
        and(
          eq(schema.organizationmember.organizationId, schema.cohort.organizationId),
          eq(schema.organizationmember.profileId, profileId),
          eq(schema.organizationmember.roleId, ROLE.ADMIN)
        )
      )
      .where(eq(schema.cohort.id, cohortId))
      .limit(1);
    return result.length > 0;
  } catch (error) {
    console.error('isOrgAdminByCohortId error:', error);
    throw new Error(`Failed to check org admin status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function addCohortMember(data: TNewCohortMember, dbClient: DbOrTxClient = db): Promise<TCohortMember> {
  try {
    if (data.profileId) {
      if (hasCohortEmail(data.email)) {
        await claimEmailOnlyCohortMembersForCohorts(
          [data.cohortId],
          [{ profileId: data.profileId, email: data.email }],
          dbClient
        );
      }

      const [existing] = await dbClient
        .select()
        .from(schema.cohortMember)
        .where(and(eq(schema.cohortMember.cohortId, data.cohortId), eq(schema.cohortMember.profileId, data.profileId)))
        .limit(1);

      if (existing) {
        return existing;
      }
    }

    const [member] = await dbClient.insert(schema.cohortMember).values(data).returning();
    if (!member) throw new Error('Failed to add cohort member');
    return member;
  } catch (error) {
    console.error('addCohortMember error:', error);
    throw new Error(`Failed to add cohort member: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Inserts a cohort member if absent, relying on the unique constraint rather than a
 * read-then-write. Returns null when the membership already existed.
 */
export async function insertCohortMemberIfAbsent(
  data: TNewCohortMember,
  dbClient: DbOrTxClient = db
): Promise<TCohortMember | null> {
  try {
    if (data.profileId && hasCohortEmail(data.email)) {
      await claimEmailOnlyCohortMembersForCohorts(
        [data.cohortId],
        [{ profileId: data.profileId, email: data.email }],
        dbClient
      );
    }

    const [member] = await dbClient
      .insert(schema.cohortMember)
      .values(data)
      .onConflictDoNothing({ target: [schema.cohortMember.cohortId, schema.cohortMember.profileId] })
      .returning();

    return member ?? null;
  } catch (error) {
    console.error('insertCohortMemberIfAbsent error:', error);
    throw new Error(`Failed to add cohort member: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/** Locks the cohort row so a concurrent status change can't slip past an accept in progress. */
export async function lockCohortStatusForAccept(
  dbClient: DbOrTxClient,
  cohortId: string
): Promise<{ status: string } | null> {
  try {
    const [row] = await dbClient
      .select({ status: schema.cohort.status })
      .from(schema.cohort)
      .where(eq(schema.cohort.id, cohortId))
      .limit(1)
      .for('update');

    return row ?? null;
  } catch (error) {
    console.error('lockCohortStatusForAccept error:', error);
    throw new Error(`Failed to lock cohort: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function removeCohortMember(
  cohortId: string,
  memberId: string,
  dbClient: DbOrTxClient = db
): Promise<TCohortMember | null> {
  try {
    const [deleted] = await dbClient
      .delete(schema.cohortMember)
      .where(and(eq(schema.cohortMember.id, memberId), eq(schema.cohortMember.cohortId, cohortId)))
      .returning();
    return deleted || null;
  } catch (error) {
    console.error('removeCohortMember error:', error);
    throw new Error(
      `Failed to remove cohort member "${memberId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function updateCohortMember(
  cohortId: string,
  memberId: string,
  data: Partial<TNewCohortMember>,
  dbClient: DbOrTxClient = db
): Promise<TCohortMember | null> {
  try {
    const [updated] = await dbClient
      .update(schema.cohortMember)
      .set(data)
      .where(and(eq(schema.cohortMember.id, memberId), eq(schema.cohortMember.cohortId, cohortId)))
      .returning();
    return updated || null;
  } catch (error) {
    console.error('updateCohortMember error:', error);
    throw new Error(
      `Failed to update cohort member "${memberId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getCohortMembers(
  cohortId: string,
  page?: TCohortListPage
): Promise<
  Array<
    TCohortMember & {
      profile: {
        id: string;
        fullname: string | null;
        username: string | null;
        avatarUrl: string | null;
        email: string | null;
      } | null;
    }
  >
> {
  try {
    const query = db
      .select({
        member: schema.cohortMember,
        profile: {
          id: schema.profile.id,
          fullname: schema.profile.fullname,
          username: schema.profile.username,
          avatarUrl: schema.profile.avatarUrl,
          email: schema.profile.email
        }
      })
      .from(schema.cohortMember)
      .leftJoin(schema.profile, eq(schema.cohortMember.profileId, schema.profile.id))
      .where(eq(schema.cohortMember.cohortId, cohortId))
      .orderBy(asc(schema.cohortMember.createdAt), asc(schema.cohortMember.id))
      .$dynamic();
    const result = await (page ? query.limit(page.limit).offset(toOffset(page)) : query);

    return result.map((row) => ({
      ...row.member,
      profile: row.profile?.id ? row.profile : null
    }));
  } catch (error) {
    console.error('getCohortMembers error:', error);
    throw new Error(
      `Failed to get cohort members for "${cohortId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export type PaginatedCohortPeopleOptions = {
  page: number;
  limit: number;
  search?: string;
  roleId?: number;
  sortBy: TCohortPeopleSortBy;
  sortOrder: TCohortPeopleSortOrder;
  membership?: TCohortPeopleMembership;
  lastLoginBefore?: TCohortPeopleActivityWindow;
  /** Row offset that overrides `page` when a caller pages across several lists. */
  offset?: number;
};

export type PaginatedCohortPerson = TCohortMember & {
  profile: {
    id: string;
    fullname: string | null;
    username: string | null;
    avatarUrl: string | null;
    email: string | null;
  } | null;
  lastLoginAt: string | null;
};

export type PaginatedCohortPeopleResult = {
  items: PaginatedCohortPerson[];
  total: number;
};

const cohortPersonProfileSelection = {
  id: schema.profile.id,
  fullname: schema.profile.fullname,
  username: schema.profile.username,
  avatarUrl: schema.profile.avatarUrl,
  email: schema.profile.email
};

/** Login events only; `session.updated_at` is pruned on expiry and so cannot answer "never". */
const cohortLastLoginAtSql = sql<string | null>`(
  SELECT MAX(le.logged_in_at)
  FROM analytics_login_events le
  WHERE le.user_id = ${schema.cohortMember.profileId}
)`;

function cohortStalenessCondition(window: TCohortPeopleActivityWindow): SQL | undefined {
  if (window === 'never') return sql`${cohortLastLoginAtSql} IS NULL`;

  return sql`(${cohortLastLoginAtSql} IS NULL OR ${cohortLastLoginAtSql} < now() - make_interval(days => ${COHORT_PEOPLE_WINDOW_DAYS[window]}))`;
}

function buildCohortPeopleOrderBy(sortBy: TCohortPeopleSortBy, sortOrder: TCohortPeopleSortOrder): SQL[] {
  const ascending = sortOrder === 'asc';
  const ordered = (column: SQLWrapper) => (ascending ? asc(column) : desc(column));
  const tiebreaker = asc(schema.cohortMember.id);

  if (sortBy === 'name') {
    return [
      ordered(
        sql`COALESCE(NULLIF(${schema.profile.fullname}, ''), ${schema.profile.email}, ${schema.cohortMember.email})`
      ),
      tiebreaker
    ];
  }

  if (sortBy === 'lastLogin') {
    return [desc(sql`${cohortLastLoginAtSql} IS NOT NULL`), ordered(cohortLastLoginAtSql), tiebreaker];
  }

  if (sortBy === 'role') {
    return [ordered(schema.cohortMember.roleId), tiebreaker];
  }

  return [ordered(schema.cohortMember.createdAt), tiebreaker];
}

export type TInvitedCohortPersonKind = 'org_invite' | 'email_only_member';

export type TInvitedCohortPersonRow = {
  kind: TInvitedCohortPersonKind;
  email: string | null;
  cohortMemberId: string | null;
  orgInviteId: string | null;
  roleId: number | null;
  memberCreatedAt: string | null;
  inviteCreatedAt: string | null;
  inviteExpiresAt: string | null;
  courseIds: string[];
  cohortIds: string[];
};

/**
 * People invited to a cohort who have not joined: pending organization members whose latest open student invite
 * carries this cohort (expired ones included so they can be resent), and legacy email-only cohort rows. One row per
 * email; the invite wins over a legacy row.
 */
export async function getPaginatedInvitedCohortPeople(
  cohortId: string,
  options: { page: number; limit: number; search?: string; roleId?: number; offset?: number },
  client: DbOrTxClient = db
): Promise<{ items: TInvitedCohortPersonRow[]; total: number }> {
  const searchTerm = options.search?.trim() ? `%${options.search.trim()}%` : null;
  const filters = [
    ...(searchTerm ? [sql`deduped.email ILIKE ${searchTerm}`] : []),
    ...(options.roleId ? [sql`deduped."roleId" = ${options.roleId}`] : [])
  ];
  const offset = options.offset ?? (options.page - 1) * options.limit;
  const invitedUnion = sql`
    SELECT DISTINCT ON (lower(email)) *
    FROM (
      SELECT
        'org_invite'::text AS kind,
        om.email AS email,
        NULL::uuid AS "cohortMemberId",
        oi.id AS "orgInviteId",
        oi.role_id::int AS "roleId",
        NULL::timestamptz AS "memberCreatedAt",
        oi.created_at AS "inviteCreatedAt",
        oi.expires_at AS "inviteExpiresAt",
        COALESCE(ARRAY(SELECT jsonb_array_elements_text(oi.metadata->'courseIds')), '{}') AS "courseIds",
        COALESCE(ARRAY(SELECT jsonb_array_elements_text(oi.metadata->'cohortIds')), '{}') AS "cohortIds",
        1 AS priority
      FROM cohort co
      JOIN organizationmember om ON om.organization_id = co.organization_id
      JOIN organization_invite oi
        ON oi.organization_id = om.organization_id
        AND lower(oi.email) = lower(om.email)
        AND oi.role_id = ${ROLE.STUDENT}
        AND oi.is_revoked = false
        AND oi.accepted_at IS NULL
        AND NOT EXISTS (
          SELECT 1
          FROM organization_invite newer
          WHERE newer.organization_id = oi.organization_id
            AND lower(newer.email) = lower(oi.email)
            AND newer.role_id = oi.role_id
            AND newer.is_revoked = false
            AND newer.accepted_at IS NULL
            AND newer.created_at > oi.created_at
        )
      WHERE co.id = ${cohortId}
        AND om.profile_id IS NULL
        AND om.email IS NOT NULL
        AND (oi.metadata->'cohortIds') ? ${cohortId}
      UNION ALL
      SELECT
        'email_only_member'::text AS kind,
        cm.email AS email,
        cm.id AS "cohortMemberId",
        NULL::uuid AS "orgInviteId",
        cm.role_id::int AS "roleId",
        cm.created_at AS "memberCreatedAt",
        NULL::timestamptz AS "inviteCreatedAt",
        NULL::timestamptz AS "inviteExpiresAt",
        '{}'::text[] AS "courseIds",
        '{}'::text[] AS "cohortIds",
        2 AS priority
      FROM cohort_member cm
      WHERE cm.cohort_id = ${cohortId}
        AND cm.profile_id IS NULL
        AND cm.email IS NOT NULL
    ) AS u
    ORDER BY lower(email), priority, "inviteCreatedAt" DESC NULLS LAST
  `;
  const searchFilter = filters.length > 0 ? sql`WHERE ${sql.join(filters, sql` AND `)}` : sql``;

  try {
    const [countRow] = await client.execute(sql`
      SELECT COUNT(*)::int AS total FROM (${invitedUnion}) AS deduped ${searchFilter}
    `);
    const rows = await client.execute(sql`
      SELECT * FROM (${invitedUnion}) AS deduped
      ${searchFilter}
      ORDER BY deduped."inviteCreatedAt" DESC NULLS LAST, deduped."memberCreatedAt" DESC NULLS LAST, lower(deduped.email)
      LIMIT ${options.limit} OFFSET ${offset}
    `);

    return {
      items: rows.map((row) => row as unknown as TInvitedCohortPersonRow),
      total: Number((countRow as unknown as { total: number } | undefined)?.total ?? 0)
    };
  } catch (error) {
    console.error('getPaginatedInvitedCohortPeople error:', error);
    throw new Error(
      `Failed to get invited cohort people for "${cohortId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getPaginatedCohortPeople(
  cohortId: string,
  options: PaginatedCohortPeopleOptions,
  client: DbOrTxClient = db
): Promise<PaginatedCohortPeopleResult> {
  try {
    const conditions = [eq(schema.cohortMember.cohortId, cohortId)];

    if (options.roleId !== undefined) {
      conditions.push(eq(schema.cohortMember.roleId, options.roleId));
    }

    if (options.membership === 'joined') {
      conditions.push(sql`${schema.cohortMember.profileId} IS NOT NULL`);
    } else if (options.membership === 'invited') {
      conditions.push(sql`${schema.cohortMember.profileId} IS NULL`);
    }

    if (options.lastLoginBefore) {
      conditions.push(cohortStalenessCondition(options.lastLoginBefore)!);
    }

    if (options.search) {
      const term = `%${options.search}%`;
      conditions.push(
        or(
          ilike(schema.profile.fullname, term),
          ilike(schema.profile.email, term),
          ilike(schema.cohortMember.email, term)
        )!
      );
    }

    const whereClause = and(...conditions)!;

    const listQuery = client
      .select({
        member: schema.cohortMember,
        profile: cohortPersonProfileSelection,
        lastLoginAt: cohortLastLoginAtSql
      })
      .from(schema.cohortMember)
      .leftJoin(schema.profile, eq(schema.cohortMember.profileId, schema.profile.id))
      .where(whereClause)
      .orderBy(...buildCohortPeopleOrderBy(options.sortBy, options.sortOrder))
      .limit(options.limit)
      .offset(options.offset ?? toOffset(options));

    const countQuery = client
      .select({ count: count(schema.cohortMember.id) })
      .from(schema.cohortMember)
      .leftJoin(schema.profile, eq(schema.cohortMember.profileId, schema.profile.id))
      .where(whereClause);

    const [rows, [countRow]] = await Promise.all([listQuery, countQuery]);

    return {
      items: rows.map((row) => ({
        ...row.member,
        profile: row.profile?.id ? row.profile : null,
        lastLoginAt: row.lastLoginAt
      })),
      total: Number(countRow?.count ?? 0)
    };
  } catch (error) {
    console.error('getPaginatedCohortPeople error:', error);
    throw new Error(
      `Failed to get paginated cohort people for "${cohortId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function countCohortMembers(cohortId: string): Promise<number> {
  try {
    const [row] = await db
      .select({ count: count(schema.cohortMember.id) })
      .from(schema.cohortMember)
      .where(eq(schema.cohortMember.cohortId, cohortId));

    return Number(row?.count ?? 0);
  } catch (error) {
    console.error('countCohortMembers error:', error);
    throw new Error(
      `Failed to count cohort members for "${cohortId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getEnrolledCohortsByProfile(
  profileId: string
): Promise<Array<TCohort & { roleId: number; courseCount: number; studentCount: number }>> {
  try {
    const result = await db
      .select({
        cohort: schema.cohort,
        roleId: schema.cohortMember.roleId,
        courseCount: sql<number>`
          COALESCE(
            (SELECT COUNT(*)::int
             FROM ${schema.cohortCourse}
             INNER JOIN ${schema.course}
               ON ${schema.cohortCourse.courseId} = ${schema.course.id}
             WHERE ${schema.cohortCourse.cohortId} = ${schema.cohort.id}
               AND (
                 ${schema.cohortMember.roleId} <> ${ROLE.STUDENT}
                 OR ${schema.course.isPublished} = true
               )),
            0
          )
        `.as('courseCount'),
        studentCount: sql<number>`
          COALESCE(
            (SELECT COUNT(*)::int
             FROM ${schema.cohortMember} AS student_member
             WHERE student_member.cohort_id = ${schema.cohort.id}
               AND student_member.role_id = ${ROLE.STUDENT}),
            0
          )
        `.as('studentCount')
      })
      .from(schema.cohortMember)
      .innerJoin(schema.cohort, eq(schema.cohortMember.cohortId, schema.cohort.id))
      .where(eq(schema.cohortMember.profileId, profileId))
      .orderBy(desc(schema.cohort.createdAt));

    return result.map((row) => ({
      ...row.cohort,
      roleId: row.roleId,
      courseCount: Number(row.courseCount || 0),
      studentCount: Number(row.studentCount || 0)
    }));
  } catch (error) {
    console.error('getEnrolledCohortsByProfile error:', error);
    throw new Error(
      `Failed to get enrolled cohorts for profile "${profileId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ─── Program Courses ─────────────────────────────────────────────────────────

export async function addCourseToCohort(
  cohortId: string,
  courseId: string,
  dbClient: DbOrTxClient = db
): Promise<TCohortCourse> {
  try {
    const [row] = await dbClient.insert(schema.cohortCourse).values({ cohortId, courseId }).returning();
    if (!row) throw new Error('Failed to add course to cohort');
    return row;
  } catch (error) {
    console.error('addCourseToCohort error:', error);
    throw new Error(`Failed to add course to cohort: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/** Cohort members that already have a profile, including their cohort role. */
export async function listCohortEnrollmentMembers(cohortId: string, dbClient: DbOrTxClient = db) {
  try {
    return await dbClient
      .select({
        profileId: schema.cohortMember.profileId,
        email: schema.cohortMember.email,
        roleId: schema.cohortMember.roleId
      })
      .from(schema.cohortMember)
      .where(and(eq(schema.cohortMember.cohortId, cohortId), isNotNull(schema.cohortMember.profileId)));
  } catch (error) {
    console.error('listCohortEnrollmentMembers error:', error);
    throw new Error(
      `Failed to list cohort enrollment members: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function removeCourseFromCohort(
  cohortId: string,
  courseId: string,
  dbClient: DbOrTxClient = db
): Promise<TCohortCourse | null> {
  try {
    const [deleted] = await dbClient
      .delete(schema.cohortCourse)
      .where(and(eq(schema.cohortCourse.cohortId, cohortId), eq(schema.cohortCourse.courseId, courseId)))
      .returning();
    return deleted || null;
  } catch (error) {
    console.error('removeCourseFromCohort error:', error);
    throw new Error(`Failed to remove course from cohort: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

const cohortCourseCondition = (cohortId: string, onlyPublished: boolean) =>
  onlyPublished
    ? and(eq(schema.cohortCourse.cohortId, cohortId), eq(schema.course.isPublished, true))
    : eq(schema.cohortCourse.cohortId, cohortId);

export async function getCoursesByCohort(
  cohortId: string,
  onlyPublished = false,
  page?: TCohortListPage
): Promise<
  Array<
    TCohortCourse & {
      course: {
        id: string;
        title: string | null;
        description: string | null;
        coverImage: string | null;
        slug: string | null;
        status: string | null;
        isPublished: boolean | null;
      };
    }
  >
> {
  try {
    const query = db
      .select({
        cohortCourse: schema.cohortCourse,
        course: {
          id: schema.course.id,
          title: schema.course.title,
          description: schema.course.description,
          coverImage: sql<string | null>`coalesce(nullif(${schema.course.bannerImage}, ''), ${schema.course.logo})`,
          slug: schema.course.slug,
          status: schema.course.status,
          isPublished: schema.course.isPublished
        }
      })
      .from(schema.cohortCourse)
      .innerJoin(schema.course, eq(schema.cohortCourse.courseId, schema.course.id))
      .where(cohortCourseCondition(cohortId, onlyPublished))
      .orderBy(asc(schema.cohortCourse.addedAt), asc(schema.cohortCourse.id))
      .$dynamic();
    const result = await (page ? query.limit(page.limit).offset(toOffset(page)) : query);

    return result.map((row) => ({ ...row.cohortCourse, course: row.course }));
  } catch (error) {
    console.error('getCoursesByCohort error:', error);
    throw new Error(
      `Failed to get courses for cohort "${cohortId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function countCoursesByCohort(cohortId: string, onlyPublished = false): Promise<number> {
  try {
    const [row] = await db
      .select({ count: count(schema.cohortCourse.id) })
      .from(schema.cohortCourse)
      .innerJoin(schema.course, eq(schema.cohortCourse.courseId, schema.course.id))
      .where(cohortCourseCondition(cohortId, onlyPublished));

    return Number(row?.count ?? 0);
  } catch (error) {
    console.error('countCoursesByCohort error:', error);
    throw new Error(
      `Failed to count courses for cohort "${cohortId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getCourseIdsByCohortIds(cohortIds: string[], dbClient: DbOrTxClient = db): Promise<string[]> {
  try {
    if (cohortIds.length === 0) return [];

    const rows = await dbClient
      .selectDistinct({ courseId: schema.cohortCourse.courseId })
      .from(schema.cohortCourse)
      .where(inArray(schema.cohortCourse.cohortId, cohortIds));

    return rows.map((row) => row.courseId).filter((courseId): courseId is string => !!courseId);
  } catch (error) {
    console.error('getCourseIdsByCohortIds error:', error);
    throw new Error(`Failed to get cohort course IDs: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function isCohortCourse(cohortId: string, courseId: string): Promise<boolean> {
  try {
    const [row] = await db
      .select({ id: schema.cohortCourse.id })
      .from(schema.cohortCourse)
      .where(and(eq(schema.cohortCourse.cohortId, cohortId), eq(schema.cohortCourse.courseId, courseId)))
      .limit(1);
    return !!row;
  } catch (error) {
    console.error('isCohortCourse error:', error);
    throw new Error(`Failed to check cohort course: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ─── Program Newsfeed ────────────────────────────────────────────────────────

export async function getCohortNewsfeed(
  cohortId: string,
  options: { cursor?: string; limit: number }
): Promise<{
  items: Array<
    TCohortNewsfeed & {
      authorProfileId: string | null;
      authorFullname: string | null;
      authorUsername: string | null;
      authorAvatarUrl: string | null;
      commentCount: number;
    }
  >;
  totalCount: number;
  hasMore: boolean;
  nextCursor: string | null;
}> {
  try {
    const { cursor, limit } = options;

    const whereConditions = [eq(schema.cohortNewsfeed.cohortId, cohortId)];
    if (cursor) {
      const [cursorCreatedAt, cursorId] = cursor.split('|');
      whereConditions.push(
        cursorId
          ? sql`(${schema.cohortNewsfeed.createdAt}, ${schema.cohortNewsfeed.id}) < (${cursorCreatedAt}::timestamptz, ${cursorId}::uuid)`
          : sql`${schema.cohortNewsfeed.createdAt} < ${cursorCreatedAt}`
      );
    }

    const totalCountResult = await db
      .select({ count: sql<number>`count(*)`.as('count') })
      .from(schema.cohortNewsfeed)
      .where(eq(schema.cohortNewsfeed.cohortId, cohortId));
    const totalCount = Number(totalCountResult[0]?.count || 0);

    const feeds = await db
      .select({
        feed: schema.cohortNewsfeed,
        profile: schema.profile,
        commentCount: sql<number>`
          COALESCE(
            (SELECT COUNT(*)::int
             FROM ${schema.cohortNewsfeedComment}
             WHERE ${eq(schema.cohortNewsfeedComment.cohortNewsfeedId, schema.cohortNewsfeed.id)}),
            0
          )
        `.as('commentCount')
      })
      .from(schema.cohortNewsfeed)
      .leftJoin(schema.cohortMember, eq(schema.cohortNewsfeed.authorId, schema.cohortMember.id))
      .leftJoin(schema.profile, eq(schema.cohortMember.profileId, schema.profile.id))
      .where(and(...whereConditions))
      .orderBy(desc(schema.cohortNewsfeed.createdAt), desc(schema.cohortNewsfeed.id))
      .limit(limit + 1);

    const hasMore = feeds.length > limit;
    const items = feeds.slice(0, limit);
    const lastFeed = items[items.length - 1]?.feed;
    const nextCursor = hasMore && lastFeed ? `${lastFeed.createdAt}|${lastFeed.id}` : null;

    return {
      items: items.map((row) => ({
        ...row.feed,
        authorProfileId: row.profile?.id || null,
        authorFullname: row.profile?.fullname || null,
        authorUsername: row.profile?.username || null,
        authorAvatarUrl: row.profile?.avatarUrl || null,
        commentCount: Number(row.commentCount || 0)
      })),
      totalCount,
      hasMore,
      nextCursor
    };
  } catch (error) {
    console.error('getCohortNewsfeed error:', error);
    throw new Error(
      `Failed to get cohort newsfeed "${cohortId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getCohortNewsfeedById(cohortId: string, feedId: string): Promise<TCohortNewsfeed | null> {
  try {
    const [feed] = await db
      .select()
      .from(schema.cohortNewsfeed)
      .where(and(eq(schema.cohortNewsfeed.id, feedId), eq(schema.cohortNewsfeed.cohortId, cohortId)))
      .limit(1);
    return feed || null;
  } catch (error) {
    console.error('getCohortNewsfeedById error:', error);
    throw new Error(
      `Failed to get cohort newsfeed item "${feedId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function createCohortNewsfeed(data: TNewCohortNewsfeed): Promise<TCohortNewsfeed> {
  try {
    const [feed] = await db.insert(schema.cohortNewsfeed).values(data).returning();
    if (!feed) throw new Error('Failed to create cohort newsfeed');
    return feed;
  } catch (error) {
    console.error('createCohortNewsfeed error:', error);
    throw new Error(`Failed to create cohort newsfeed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function updateCohortNewsfeed(
  cohortId: string,
  feedId: string,
  data: Partial<TNewCohortNewsfeed>
): Promise<TCohortNewsfeed | null> {
  try {
    const [updated] = await db
      .update(schema.cohortNewsfeed)
      .set(data)
      .where(and(eq(schema.cohortNewsfeed.id, feedId), eq(schema.cohortNewsfeed.cohortId, cohortId)))
      .returning();
    return updated || null;
  } catch (error) {
    console.error('updateCohortNewsfeed error:', error);
    throw new Error(
      `Failed to update cohort newsfeed "${feedId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function updateCohortNewsfeedReaction(
  cohortId: string,
  feedId: string,
  reaction: { clap: string[]; smile: string[]; thumbsup: string[]; thumbsdown: string[] }
): Promise<TCohortNewsfeed | null> {
  try {
    const [updated] = await db
      .update(schema.cohortNewsfeed)
      .set({ reaction })
      .where(and(eq(schema.cohortNewsfeed.id, feedId), eq(schema.cohortNewsfeed.cohortId, cohortId)))
      .returning();
    return updated || null;
  } catch (error) {
    console.error('updateCohortNewsfeedReaction error:', error);
    throw new Error(
      `Failed to update cohort newsfeed reaction "${feedId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

type TCohortNewsfeedReaction = NonNullable<TCohortNewsfeed['reaction']>;

/**
 * Read-modify-write of a post's reactions under a row lock, so concurrent reactions from
 * different members don't overwrite each other. Returns null when the post is not in the cohort.
 */
export async function updateCohortNewsfeedReactionLocked(
  cohortId: string,
  feedId: string,
  update: (current: TCohortNewsfeed['reaction']) => TCohortNewsfeedReaction
): Promise<TCohortNewsfeed | null> {
  try {
    return await db.transaction(async (tx) => {
      const [feed] = await tx
        .select({ reaction: schema.cohortNewsfeed.reaction })
        .from(schema.cohortNewsfeed)
        .where(and(eq(schema.cohortNewsfeed.id, feedId), eq(schema.cohortNewsfeed.cohortId, cohortId)))
        .for('update');
      if (!feed) return null;

      const [updated] = await tx
        .update(schema.cohortNewsfeed)
        .set({ reaction: update(feed.reaction) })
        .where(and(eq(schema.cohortNewsfeed.id, feedId), eq(schema.cohortNewsfeed.cohortId, cohortId)))
        .returning();
      return updated || null;
    });
  } catch (error) {
    console.error('updateCohortNewsfeedReactionLocked error:', error);
    throw new Error(
      `Failed to update cohort newsfeed reaction "${feedId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function deleteCohortNewsfeed(cohortId: string, feedId: string): Promise<TCohortNewsfeed | null> {
  try {
    const [deleted] = await db
      .delete(schema.cohortNewsfeed)
      .where(and(eq(schema.cohortNewsfeed.id, feedId), eq(schema.cohortNewsfeed.cohortId, cohortId)))
      .returning();
    return deleted || null;
  } catch (error) {
    console.error('deleteCohortNewsfeed error:', error);
    throw new Error(
      `Failed to delete cohort newsfeed "${feedId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ─── Program Newsfeed Comments ────────────────────────────────────────────────

const cohortNewsfeedCommentCondition = (cohortId: string, feedId: string) =>
  and(eq(schema.cohortNewsfeedComment.cohortNewsfeedId, feedId), eq(schema.cohortNewsfeed.cohortId, cohortId));

export async function getCohortNewsfeedComments(
  cohortId: string,
  feedId: string,
  page?: TCohortListPage
): Promise<
  Array<
    TCohortNewsfeedComment & {
      authorProfileId: string | null;
      authorFullname: string | null;
      authorUsername: string | null;
      authorAvatarUrl: string | null;
    }
  >
> {
  try {
    const query = db
      .select({
        comment: schema.cohortNewsfeedComment,
        profile: schema.profile
      })
      .from(schema.cohortNewsfeedComment)
      .innerJoin(schema.cohortNewsfeed, eq(schema.cohortNewsfeed.id, schema.cohortNewsfeedComment.cohortNewsfeedId))
      .leftJoin(schema.cohortMember, eq(schema.cohortNewsfeedComment.authorId, schema.cohortMember.id))
      .leftJoin(schema.profile, eq(schema.cohortMember.profileId, schema.profile.id))
      .where(cohortNewsfeedCommentCondition(cohortId, feedId))
      .orderBy(asc(schema.cohortNewsfeedComment.createdAt), asc(schema.cohortNewsfeedComment.id))
      .$dynamic();
    const result = await (page ? query.limit(page.limit).offset(toOffset(page)) : query);

    return result.map((row) => ({
      ...row.comment,
      authorProfileId: row.profile?.id || null,
      authorFullname: row.profile?.fullname || null,
      authorUsername: row.profile?.username || null,
      authorAvatarUrl: row.profile?.avatarUrl || null
    }));
  } catch (error) {
    console.error('getCohortNewsfeedComments error:', error);
    throw new Error(
      `Failed to get cohort newsfeed comments for "${feedId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function countCohortNewsfeedComments(cohortId: string, feedId: string): Promise<number> {
  try {
    const [row] = await db
      .select({ count: count(schema.cohortNewsfeedComment.id) })
      .from(schema.cohortNewsfeedComment)
      .innerJoin(schema.cohortNewsfeed, eq(schema.cohortNewsfeed.id, schema.cohortNewsfeedComment.cohortNewsfeedId))
      .where(cohortNewsfeedCommentCondition(cohortId, feedId));

    return Number(row?.count ?? 0);
  } catch (error) {
    console.error('countCohortNewsfeedComments error:', error);
    throw new Error(
      `Failed to count cohort newsfeed comments for "${feedId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function createCohortNewsfeedComment(data: TNewCohortNewsfeedComment): Promise<TCohortNewsfeedComment> {
  try {
    const [comment] = await db.insert(schema.cohortNewsfeedComment).values(data).returning();
    if (!comment) throw new Error('Failed to create cohort newsfeed comment');
    return comment;
  } catch (error) {
    console.error('createCohortNewsfeedComment error:', error);
    throw new Error(
      `Failed to create cohort newsfeed comment: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function deleteCohortNewsfeedComment(
  feedId: string,
  commentId: number
): Promise<TCohortNewsfeedComment | null> {
  try {
    const [deleted] = await db
      .delete(schema.cohortNewsfeedComment)
      .where(
        and(eq(schema.cohortNewsfeedComment.id, commentId), eq(schema.cohortNewsfeedComment.cohortNewsfeedId, feedId))
      )
      .returning();
    return deleted || null;
  } catch (error) {
    console.error('deleteCohortNewsfeedComment error:', error);
    throw new Error(
      `Failed to delete cohort newsfeed comment "${commentId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getCohortNewsfeedCommentById(commentId: number): Promise<TCohortNewsfeedComment | null> {
  try {
    const [comment] = await db
      .select()
      .from(schema.cohortNewsfeedComment)
      .where(eq(schema.cohortNewsfeedComment.id, commentId))
      .limit(1);
    return comment || null;
  } catch (error) {
    console.error('getCohortNewsfeedCommentById error:', error);
    throw new Error(
      `Failed to get cohort newsfeed comment "${commentId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * The cohorts among `cohortIds` that `profileId` is not a member of, with their organization.
 */
export async function getUnjoinedCohortsByIds(
  cohortIds: string[],
  profileId: string
): Promise<{ id: string; organizationId: string; name: string | null }[]> {
  if (cohortIds.length === 0) return [];

  try {
    return await db
      .select({ id: schema.cohort.id, organizationId: schema.cohort.organizationId, name: schema.cohort.name })
      .from(schema.cohort)
      .where(
        and(
          inArray(schema.cohort.id, cohortIds),
          sql`NOT EXISTS (
            SELECT 1 FROM ${schema.cohortMember}
            WHERE ${schema.cohortMember.cohortId} = ${schema.cohort.id}
              AND ${schema.cohortMember.profileId} = ${profileId}
          )`
        )
      );
  } catch (error) {
    console.error('getUnjoinedCohortsByIds error:', error);
    throw new Error(`Failed to load invitation cohorts: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
