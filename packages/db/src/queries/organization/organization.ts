import * as schema from '@db/schema';

import type { OrganizationPlan, OrganizationWithMemberAndPlans, OrganizationWithPlans } from './types';
import type {
  TNewOrganization,
  TNewOrganizationPlan,
  TNewOrganizationmember,
  TOrganization,
  TOrganizationPlan
} from '@db/types';
import { and, asc, count, desc, eq, ilike, inArray, isNotNull, or, sql } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants';
import { db, type DbOrTxClient } from '@db/drizzle';
import type { TAudienceSortBy, TAudienceSortOrder } from '@cio/utils/validation/organization';

export function getOrgIdBySiteName(siteName: string) {
  return db.select().from(schema.organization).where(eq(schema.organization.siteName, siteName)).limit(1);
}

/**
 * Hostnames (lowercase) for organizations with a verified custom domain.
 * Used by the API to warm an in-memory CORS / trusted-origin registry at startup.
 */
export async function getVerifiedCustomDomainHostnames(): Promise<string[]> {
  try {
    const rows = await db
      .select({ customDomain: schema.organization.customDomain })
      .from(schema.organization)
      .where(and(eq(schema.organization.isCustomDomainVerified, true), isNotNull(schema.organization.customDomain)));

    return [...new Set(rows.map((row) => row.customDomain?.trim().toLowerCase()).filter(Boolean) as string[])];
  } catch (error) {
    console.error('getVerifiedCustomDomainHostnames error:', error);
    throw new Error(
      `Failed to load verified custom domains: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export const getOrganizationByProfileId = async (profileId: string): Promise<OrganizationWithMemberAndPlans[]> => {
  const result = await db
    .select({
      organization: schema.organization,
      memberId: schema.organizationmember.id,
      roleId: schema.organizationmember.roleId,
      plan: {
        planName: schema.organizationPlan.planName,
        isActive: schema.organizationPlan.isActive,
        provider: schema.organizationPlan.provider,
        subscriptionId: schema.organizationPlan.subscriptionId,
        customerId: sql`organization_plan.payload->>'customerId'`.as('customerId')
      }
    })
    .from(schema.organization)
    .leftJoin(schema.organizationmember, eq(schema.organization.id, schema.organizationmember.organizationId))
    .leftJoin(schema.organizationPlan, eq(schema.organization.id, schema.organizationPlan.orgId))
    .where(eq(schema.organizationmember.profileId, profileId));

  // Group by organization and collect plans into an array
  const organizationMap = new Map<
    string,
    {
      organization: typeof schema.organization.$inferSelect;
      memberId: number | undefined;
      roleId: number | undefined;
      plans: Array<OrganizationPlan>;
    }
  >();

  for (const row of result) {
    const orgId = row.organization.id;

    if (!organizationMap.has(orgId)) {
      organizationMap.set(orgId, {
        organization: row.organization,
        memberId: row.memberId ?? undefined,
        roleId: row.roleId ?? undefined,
        plans: []
      });
    }

    const orgData = organizationMap.get(orgId)!;

    // Add plan to array if it exists (not null)
    if (
      row.plan &&
      (row.plan.planName !== null ||
        row.plan.isActive !== null ||
        row.plan.provider !== null ||
        row.plan.subscriptionId !== null)
    ) {
      orgData.plans.push({
        planName: row.plan.planName,
        isActive: row.plan.isActive,
        provider: row.plan.provider,
        subscriptionId: row.plan.subscriptionId,
        customerId: row.plan.customerId as string | null
      });
    }
  }

  return Array.from(organizationMap.values()).map(({ organization, ...rest }) => ({
    ...(organization as TOrganization),
    ...rest
  }));
};

export const createOrganization = async (data: TNewOrganization, dbClient: DbOrTxClient = db) => {
  const [organization] = await dbClient.insert(schema.organization).values(data).returning();

  return organization;
};

export const createOrganizationMember = async (data: TNewOrganizationmember, dbClient: DbOrTxClient = db) => {
  const [member] = await dbClient.insert(schema.organizationmember).values(data).returning();

  return member;
};

export async function getOrganizationMemberByIdAndOrg(
  memberId: number,
  organizationId: string,
  dbClient: DbOrTxClient = db
): Promise<{ id: number; profileId: string | null } | null> {
  try {
    const [row] = await dbClient
      .select({
        id: schema.organizationmember.id,
        profileId: schema.organizationmember.profileId
      })
      .from(schema.organizationmember)
      .where(
        and(eq(schema.organizationmember.id, memberId), eq(schema.organizationmember.organizationId, organizationId))
      )
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getOrganizationMemberByIdAndOrg error:', error);
    throw new Error(
      `Failed to resolve organization membership: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getOrganizationMemberIdByOrgAndProfile(
  organizationId: string,
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<number | null> {
  try {
    const [row] = await dbClient
      .select({ id: schema.organizationmember.id })
      .from(schema.organizationmember)
      .where(
        and(
          eq(schema.organizationmember.organizationId, organizationId),
          eq(schema.organizationmember.profileId, profileId)
        )
      )
      .limit(1);

    return row?.id ?? null;
  } catch (error) {
    console.error('getOrganizationMemberIdByOrgAndProfile error:', error);
    throw new Error(
      `Failed to resolve organization membership: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Creates multiple organization members in a single query
 * @param data Array of organization member creation data
 * @returns Array of created members
 */
export const createOrganizationMembers = async (data: TNewOrganizationmember[]) => {
  const members = await db.insert(schema.organizationmember).values(data).onConflictDoNothing().returning();

  return members;
};

export async function insertOrganizationMembersOnConflictDoNothing(
  data: TNewOrganizationmember[],
  dbClient: DbOrTxClient = db
): Promise<void> {
  if (data.length === 0) {
    return;
  }

  try {
    await dbClient.insert(schema.organizationmember).values(data).onConflictDoNothing();
  } catch (error) {
    console.error('insertOrganizationMembersOnConflictDoNothing error:', error);
    throw new Error(
      `Failed to insert organization members: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export const checkSiteNameExists = async (siteName: string): Promise<boolean> => {
  const result = await db
    .select({ id: schema.organization.id })
    .from(schema.organization)
    .where(eq(schema.organization.siteName, siteName))
    .limit(1);

  console.debug('checkSiteNameExists result:', result);

  return result.length > 0;
};

/**
 * Gets an organization by siteName
 * @param siteName Organization site name
 * @returns Organization or null if not found
 */
export const getOrganizationBySiteName = async (siteName: string): Promise<TOrganization | null> => {
  const [organization] = await db
    .select()
    .from(schema.organization)
    .where(eq(schema.organization.siteName, siteName))
    .limit(1);

  return organization || null;
};

/**
 * Gets an organization by its verified custom domain.
 * Only matches rows where isCustomDomainVerified is true so we never auto-enroll
 * a signup into an org just because someone pointed DNS at us.
 */
export const getOrganizationByCustomDomain = async (customDomain: string): Promise<TOrganization | null> => {
  const [organization] = await db
    .select()
    .from(schema.organization)
    .where(
      and(
        eq(schema.organization.customDomain, customDomain.toLowerCase()),
        eq(schema.organization.isCustomDomainVerified, true)
      )
    )
    .limit(1);

  return organization || null;
};

/**
 * Gets an organization by ID
 * @param id Organization ID
 * @returns Organization or null if not found
 */
export const getOrganizationById = async (id: string): Promise<TOrganization | null> => {
  const [organization] = await db.select().from(schema.organization).where(eq(schema.organization.id, id)).limit(1);

  return organization || null;
};

export const deleteOrganizationById = async (id: string) => {
  await db.delete(schema.organization).where(eq(schema.organization.id, id));
};

/**
 * Checks if an email already exists as a team member in an organization
 * @param orgId Organization ID
 * @param email Email address to check
 * @returns True if email exists, false otherwise
 */
export const checkEmailExistsInOrg = async (orgId: string, email: string): Promise<boolean> => {
  const result = await db
    .select({ id: schema.organizationmember.id })
    .from(schema.organizationmember)
    .where(
      and(eq(schema.organizationmember.organizationId, orgId), eq(schema.organizationmember.email, email.toLowerCase()))
    )
    .limit(1);

  return result.length > 0;
};

/**
 * Checks if an org has a member matching the given profileId or email.
 * Used to avoid creating duplicate members (e.g. when user has a pending invite).
 */
export const hasOrgMemberByProfileIdOrEmail = async (
  orgId: string,
  profileId: string,
  email: string | null | undefined
): Promise<boolean> => {
  const conditions = [eq(schema.organizationmember.organizationId, orgId)];

  const profileOrEmailMatch = or(
    eq(schema.organizationmember.profileId, profileId),
    ...(email ? [eq(schema.organizationmember.email, email.toLowerCase().trim())] : [])
  );

  const result = await db
    .select({ id: schema.organizationmember.id })
    .from(schema.organizationmember)
    .where(and(...conditions, profileOrEmailMatch))
    .limit(1);

  return result.length > 0;
};

/**
 * Checks which emails already exist as team members in an organization (bulk check)
 * Checks both organizationmember.email and profile.email (via organizationmember.profileId)
 * @param orgId Organization ID
 * @param emails Array of email addresses to check (should already be normalized)
 * @returns Array of emails that already exist in the organization
 */
export const checkEmailsExistInOrg = async (orgId: string, emails: string[]): Promise<string[]> => {
  if (emails.length === 0) {
    return [];
  }

  const [orgMemberEmails, profileEmails] = await Promise.all([
    db
      .select({ email: schema.organizationmember.email })
      .from(schema.organizationmember)
      .where(
        and(eq(schema.organizationmember.organizationId, orgId), inArray(schema.organizationmember.email, emails))
      ),
    db
      .select({ email: schema.profile.email })
      .from(schema.organizationmember)
      .innerJoin(schema.profile, eq(schema.organizationmember.profileId, schema.profile.id))
      .where(and(eq(schema.organizationmember.organizationId, orgId), inArray(schema.profile.email, emails)))
  ]);

  const existingEmails = new Set<string>();
  orgMemberEmails.forEach((r) => {
    if (r.email) {
      existingEmails.add(r.email.toLowerCase());
    }
  });
  profileEmails.forEach((r) => {
    if (r.email) {
      existingEmails.add(r.email.toLowerCase());
    }
  });

  return Array.from(existingEmails);
};

/**
 * Deletes an organization member by ID
 * @param orgId Organization ID
 * @param memberId Member ID to delete
 * @returns Deleted member or null if not found
 */
export const deleteOrganizationMember = async (orgId: string, memberId: number) => {
  const [deleted] = await db
    .delete(schema.organizationmember)
    .where(and(eq(schema.organizationmember.organizationId, orgId), eq(schema.organizationmember.id, memberId)))
    .returning();

  return deleted || null;
};

/**
 * Deletes a student organization member by ID
 * @param orgId Organization ID
 * @param memberId Member ID to delete
 * @returns Deleted member or null if not found
 */
export const deleteOrganizationAudienceMember = async (orgId: string, memberId: number) => {
  const [deleted] = await db
    .delete(schema.organizationmember)
    .where(
      and(
        eq(schema.organizationmember.organizationId, orgId),
        eq(schema.organizationmember.id, memberId),
        eq(schema.organizationmember.roleId, ROLE.STUDENT)
      )
    )
    .returning();

  return deleted || null;
};

export const getOrganizationAudienceMember = async (orgId: string, memberId: number) => {
  const [row] = await db
    .select({
      memberId: schema.organizationmember.id,
      profileId: schema.organizationmember.profileId,
      fullname: schema.profile.fullname,
      email: sql<string>`coalesce(${schema.profile.email}, ${schema.organizationmember.email})`.as('email'),
      avatarUrl: schema.profile.avatarUrl,
      profileCreatedAt: schema.profile.createdAt,
      memberCreatedAt: schema.organizationmember.createdAt
    })
    .from(schema.organizationmember)
    .leftJoin(schema.profile, eq(schema.organizationmember.profileId, schema.profile.id))
    .where(
      and(
        eq(schema.organizationmember.organizationId, orgId),
        eq(schema.organizationmember.id, memberId),
        eq(schema.organizationmember.roleId, ROLE.STUDENT)
      )
    )
    .limit(1);

  if (!row) {
    return null;
  }

  const email = row.email?.trim() ?? '';
  const name = row.fullname?.trim() || (email.includes('@') ? email.split('@')[0] : email) || '';
  const createdAtRaw = row.profileId ? row.profileCreatedAt : row.memberCreatedAt;
  const createdAt = createdAtRaw ? new Date(createdAtRaw).toDateString() : '';

  return {
    id: row.memberId,
    profileId: row.profileId ?? null,
    name,
    email,
    avatarUrl: row.avatarUrl || '',
    createdAt
  };
};

export const updateOrganizationAudienceMember = async (
  orgId: string,
  memberId: number,
  data: Partial<Pick<TNewOrganizationmember, 'email' | 'verified'>>
) => {
  const [updated] = await db
    .update(schema.organizationmember)
    .set(data)
    .where(
      and(
        eq(schema.organizationmember.organizationId, orgId),
        eq(schema.organizationmember.id, memberId),
        eq(schema.organizationmember.roleId, ROLE.STUDENT)
      )
    )
    .returning();

  return updated || null;
};

/**
 * Checks if a user is an admin of an organization
 * @param orgId Organization ID
 * @param profileId Profile ID to check
 * @returns True if user is admin, false otherwise
 */
export const isUserOrgAdmin = async (orgId: string, profileId: string): Promise<boolean> => {
  const result = await db
    .select({ roleId: schema.organizationmember.roleId })
    .from(schema.organizationmember)
    .where(
      and(
        eq(schema.organizationmember.organizationId, orgId),
        eq(schema.organizationmember.profileId, profileId),
        eq(schema.organizationmember.roleId, ROLE.ADMIN)
      )
    )
    .limit(1);

  return result.length > 0;
};

/**
 * Gets a user's role in an organization
 * @param orgId Organization ID
 * @param profileId Profile ID to check
 * @returns Role ID if user is a member, null otherwise
 */
export const getUserOrgRole = async (orgId: string, profileId: string): Promise<number | null> => {
  const result = await db
    .select({ roleId: schema.organizationmember.roleId })
    .from(schema.organizationmember)
    .where(and(eq(schema.organizationmember.organizationId, orgId), eq(schema.organizationmember.profileId, profileId)))
    .limit(1);

  return result.length > 0 ? Number(result[0].roleId) : null;
};

/**
 * Gets all org memberships for a user as { [orgId]: roleId }.
 * Used to attach org roles to the Better Auth session so middleware can
 * read membership/role from the session cookie cache instead of hitting the DB.
 */
export const getUserOrgRolesMap = async (profileId: string): Promise<Record<string, number>> => {
  try {
    const rows = await db
      .select({
        organizationId: schema.organizationmember.organizationId,
        roleId: schema.organizationmember.roleId
      })
      .from(schema.organizationmember)
      .where(eq(schema.organizationmember.profileId, profileId));

    const map: Record<string, number> = {};
    for (const row of rows) {
      map[row.organizationId] = Number(row.roleId);
    }

    return map;
  } catch (error) {
    console.error('getUserOrgRolesMap error:', error);
    throw new Error('Failed to fetch user org roles map');
  }
};

/**
 * Checks if a user is a team member (ADMIN or TUTOR) of an organization
 * @param orgId Organization ID
 * @param profileId Profile ID to check
 * @returns True if user is ADMIN or TUTOR, false otherwise
 */
export const isUserOrgTeamMember = async (orgId: string, profileId: string): Promise<boolean> => {
  const result = await db
    .select({ roleId: schema.organizationmember.roleId })
    .from(schema.organizationmember)
    .where(
      and(
        eq(schema.organizationmember.organizationId, orgId),
        eq(schema.organizationmember.profileId, profileId),
        or(eq(schema.organizationmember.roleId, ROLE.ADMIN), eq(schema.organizationmember.roleId, ROLE.TUTOR))
      )
    )
    .limit(1);

  return result.length > 0;
};

/**
 * Gets organization team members (non-students)
 * @param orgId Organization ID
 * @returns Array of team members with profile information
 */
export const getOrganizationTeam = async (orgId: string) => {
  const result = await db
    .select({
      id: schema.organizationmember.id,
      email: schema.organizationmember.email,
      verified: schema.organizationmember.verified,
      roleId: schema.organizationmember.roleId,
      profile: {
        id: schema.profile.id,
        fullname: schema.profile.fullname,
        email: schema.profile.email
      }
    })
    .from(schema.organizationmember)
    .leftJoin(schema.profile, eq(schema.organizationmember.profileId, schema.profile.id))
    .where(
      and(
        eq(schema.organizationmember.organizationId, orgId),
        sql`${schema.organizationmember.roleId} != ${ROLE.STUDENT}`
      )
    )
    .orderBy(sql`${schema.organizationmember.id} DESC`);

  return result.map((member) => ({
    id: member.id,
    email: member.profile?.email || member.email || '',
    verified: member.verified,
    roleId: member.roleId,
    profileId: member.profile?.id,
    fullname: member.profile?.fullname || ''
  }));
};

/**
 * Gets organization audience (all organization members with student role).
 * Includes invited members without a profile (LEFT JOIN profile).
 * Row id is organizationmember.id; use profileId for profile-backed actions when present.
 */
type GetOrganizationAudienceOptions = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: TAudienceSortBy;
  sortOrder?: TAudienceSortOrder;
};

export const getOrganizationAudience = async (orgId: string, options: GetOrganizationAudienceOptions = {}) => {
  const page = options.page && options.page > 0 ? options.page : 1;
  const limit = options.limit && options.limit > 0 ? Math.min(options.limit, 100) : 20;
  const offset = (page - 1) * limit;
  const search = options.search?.trim();
  const sortBy = options.sortBy ?? 'createdAt';
  const sortOrder = options.sortOrder ?? 'desc';

  const audienceNameSql = sql<string>`COALESCE(NULLIF(${schema.profile.fullname}, ''), ${schema.profile.email}, ${schema.organizationmember.email})`;
  const audienceEmailSql = sql<string>`COALESCE(${schema.profile.email}, ${schema.organizationmember.email})`;
  const audienceCreatedAtSql = sql<string>`COALESCE(${schema.profile.createdAt}, ${schema.organizationmember.createdAt})`;

  const conditions = [
    eq(schema.organizationmember.organizationId, orgId),
    eq(schema.organizationmember.roleId, ROLE.STUDENT)
  ];

  if (search) {
    const searchValue = `%${search}%`;
    conditions.push(
      or(
        ilike(schema.profile.fullname, searchValue),
        ilike(schema.profile.email, searchValue),
        ilike(schema.organizationmember.email, searchValue)
      )!
    );
  }

  const whereClause = and(...conditions);
  const [totalRow] = await db
    .select({ count: count(schema.organizationmember.id) })
    .from(schema.organizationmember)
    .leftJoin(schema.profile, eq(schema.organizationmember.profileId, schema.profile.id))
    .where(whereClause);

  const total = Number(totalRow?.count ?? 0);

  const orderByExpression =
    sortBy === 'name' ? audienceNameSql : sortBy === 'email' ? audienceEmailSql : audienceCreatedAtSql;
  const orderedExpression = sortOrder === 'asc' ? asc(orderByExpression) : desc(orderByExpression);

  const result = await db
    .select({
      memberId: schema.organizationmember.id,
      profileId: schema.profile.id,
      fullname: schema.profile.fullname,
      email: audienceEmailSql.as('email'),
      avatarUrl: schema.profile.avatarUrl,
      profileCreatedAt: schema.profile.createdAt,
      memberCreatedAt: schema.organizationmember.createdAt
    })
    .from(schema.organizationmember)
    .leftJoin(schema.profile, eq(schema.organizationmember.profileId, schema.profile.id))
    .where(whereClause)
    .orderBy(orderedExpression, desc(schema.organizationmember.id))
    .limit(limit)
    .offset(offset);

  return {
    items: result.map((row) => {
      const email = row.email?.trim() ?? '';
      const name = row.fullname?.trim() || (email.includes('@') ? email.split('@')[0] : email) || '';
      const createdAtRaw = row.profileId ? row.profileCreatedAt : row.memberCreatedAt;
      const createdAt = createdAtRaw ? new Date(createdAtRaw).toDateString() : '';

      return {
        id: row.memberId,
        profileId: row.profileId ?? null,
        name,
        email,
        avatarUrl: row.avatarUrl || '',
        createdAt
      };
    }),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit))
  };
};

/**
 * Student org member matched by profile email or organizationmember.email (for audience invite actions).
 */
export async function getStudentOrganizationMemberByOrgAndEmail(
  orgId: string,
  email: string
): Promise<{ id: number; profileId: string | null; email: string } | null> {
  const normalized = email.toLowerCase().trim();
  if (!normalized) {
    return null;
  }

  try {
    const [row] = await db
      .select({
        id: schema.organizationmember.id,
        profileId: schema.organizationmember.profileId,
        displayEmail: sql<string>`COALESCE(${schema.profile.email}, ${schema.organizationmember.email})`.as(
          'displayEmail'
        )
      })
      .from(schema.organizationmember)
      .leftJoin(schema.profile, eq(schema.organizationmember.profileId, schema.profile.id))
      .where(
        and(
          eq(schema.organizationmember.organizationId, orgId),
          eq(schema.organizationmember.roleId, ROLE.STUDENT),
          or(eq(schema.organizationmember.email, normalized), eq(schema.profile.email, normalized))
        )
      )
      .limit(1);

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      profileId: row.profileId,
      email: (row.displayEmail ?? normalized).trim()
    };
  } catch (error) {
    console.error('getStudentOrganizationMemberByOrgAndEmail error:', error);
    throw new Error(
      `Failed to get organization student member: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Gets organizations with optional filters
 * @param filters Filter options (siteName, customDomain, isCustomDomainVerified)
 * @returns Array of organizations with plans
 */
export const getOrganizations = async (filters?: {
  siteName?: string;
  customDomain?: string;
  isCustomDomainVerified?: boolean;
}): Promise<OrganizationWithPlans[]> => {
  const conditions: Parameters<typeof and>[0][] = [];

  if (filters?.siteName) {
    conditions.push(eq(schema.organization.siteName, filters.siteName));
  }

  if (filters?.customDomain) {
    const customDomainConditions: Parameters<typeof and>[0][] = [
      eq(schema.organization.customDomain, filters.customDomain)
    ];
    if (filters.isCustomDomainVerified !== undefined) {
      customDomainConditions.push(eq(schema.organization.isCustomDomainVerified, filters.isCustomDomainVerified));
    }
    conditions.push(and(...customDomainConditions));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const result = await db
    .select({
      organization: schema.organization,
      plan: {
        planName: schema.organizationPlan.planName,
        isActive: schema.organizationPlan.isActive,
        provider: schema.organizationPlan.provider,
        subscriptionId: schema.organizationPlan.subscriptionId,
        customerId: sql`organization_plan.payload->>'customerId'`.as('customerId')
      }
    })
    .from(schema.organization)
    .leftJoin(schema.organizationPlan, eq(schema.organization.id, schema.organizationPlan.orgId))
    .where(whereClause);

  // Group by organization and collect plans into an array
  const organizationMap = new Map<
    string,
    {
      organization: typeof schema.organization.$inferSelect;
      plans: Array<OrganizationPlan>;
    }
  >();

  for (const row of result) {
    const orgId = row.organization.id;

    if (!organizationMap.has(orgId)) {
      organizationMap.set(orgId, {
        organization: row.organization,
        plans: []
      });
    }

    const orgData = organizationMap.get(orgId)!;

    // Add plan to array if it exists (not null)
    if (
      row.plan &&
      (row.plan.planName !== null ||
        row.plan.isActive !== null ||
        row.plan.provider !== null ||
        row.plan.subscriptionId !== null)
    ) {
      orgData.plans.push({
        planName: row.plan.planName,
        isActive: row.plan.isActive,
        provider: row.plan.provider,
        subscriptionId: row.plan.subscriptionId,
        customerId: row.plan.customerId as string | null
      });
    }
  }

  return Array.from(organizationMap.values()).map(({ organization, plans }) => ({
    ...(organization as TOrganization),
    plans
  }));
};

/**
 * Gets the first (and typically only) organization - used for self-hosted single-org mode
 * @returns First organization by createdAt, or null if none exist
 */
export const getFirstOrganization = async (): Promise<TOrganization | null> => {
  const [organization] = await db.select().from(schema.organization).orderBy(schema.organization.createdAt).limit(1);

  return organization || null;
};

/**
 * Gets the first organization with plans - for self-hosted single-org mode
 * @returns First organization with plans (by createdAt), or null if none exist
 */
export const getFirstOrganizationWithPlans = async (): Promise<
  (TOrganization & { plans: Array<OrganizationPlan> }) | null
> => {
  // Get the first organization ID (by createdAt) - avoid limit(1) on joined result
  // which would discard plan rows when an org has multiple plans
  const [firstOrg] = await db
    .select({ id: schema.organization.id })
    .from(schema.organization)
    .orderBy(schema.organization.createdAt)
    .limit(1);

  if (!firstOrg) return null;

  const result = await db
    .select({
      organization: schema.organization,
      plan: {
        planName: schema.organizationPlan.planName,
        isActive: schema.organizationPlan.isActive,
        provider: schema.organizationPlan.provider,
        subscriptionId: schema.organizationPlan.subscriptionId,
        customerId: sql`organization_plan.payload->>'customerId'`.as('customerId')
      }
    })
    .from(schema.organization)
    .leftJoin(schema.organizationPlan, eq(schema.organization.id, schema.organizationPlan.orgId))
    .where(eq(schema.organization.id, firstOrg.id));

  const organizationMap = new Map<
    string,
    {
      organization: typeof schema.organization.$inferSelect;
      plans: Array<OrganizationPlan>;
    }
  >();

  for (const row of result) {
    const orgId = row.organization.id;
    if (!organizationMap.has(orgId)) {
      organizationMap.set(orgId, {
        organization: row.organization,
        plans: []
      });
    }
    const orgData = organizationMap.get(orgId)!;
    if (
      row.plan &&
      (row.plan.planName !== null ||
        row.plan.isActive !== null ||
        row.plan.provider !== null ||
        row.plan.subscriptionId !== null)
    ) {
      orgData.plans.push({
        planName: row.plan.planName,
        isActive: row.plan.isActive,
        provider: row.plan.provider,
        subscriptionId: row.plan.subscriptionId,
        customerId: row.plan.customerId as string | null
      });
    }
  }

  const first = Array.from(organizationMap.values())[0];
  return first
    ? ({
        ...(first.organization as TOrganization),
        plans: first.plans
      } as TOrganization & { plans: Array<OrganizationPlan> })
    : null;
};

/**
 * Gets the number of organizations - used for self-hosted to block org creation when org exists
 * @returns Count of organizations
 */
export const getOrganizationCount = async (): Promise<number> => {
  const [result] = await db.select({ count: sql<number>`count(*)::int`.as('count') }).from(schema.organization);

  return result?.count ?? 0;
};

/**
 * Creates a new organization plan
 * @param data Organization plan creation data
 * @param dbClient Optional DB or transaction client for use within transactions
 * @returns Created organization plan record
 */
export const getOrganizationPlanBySubscriptionId = async (
  subscriptionId: string,
  dbClient: DbOrTxClient = db
): Promise<TOrganizationPlan | null> => {
  try {
    const [plan] = await dbClient
      .select()
      .from(schema.organizationPlan)
      .where(eq(schema.organizationPlan.subscriptionId, subscriptionId))
      .limit(1);

    return plan ?? null;
  } catch (error) {
    console.error('getOrganizationPlanBySubscriptionId error:', error);
    throw new Error(
      `Failed to fetch organization plan: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

export const createOrganizationPlan = async (
  data: TNewOrganizationPlan,
  dbClient: DbOrTxClient = db
): Promise<TOrganizationPlan> => {
  const [plan] = await dbClient.insert(schema.organizationPlan).values(data).returning();
  return plan;
};

/**
 * Updates an organization plan by subscription ID
 * @param subscriptionId Subscription ID
 * @param payload Payload data to update
 * @returns Updated organization plan record
 */
export const updateOrganizationPlan = async (
  subscriptionId: string,
  payload: TOrganizationPlan['payload']
): Promise<TOrganizationPlan> => {
  const [plan] = await db
    .update(schema.organizationPlan)
    .set({ payload, updatedAt: sql`timezone('utc'::text, now())` })
    .where(eq(schema.organizationPlan.subscriptionId, subscriptionId))
    .returning();
  return plan;
};

/**
 * Cancels an organization plan by subscription ID
 * @param subscriptionId Subscription ID
 * @param payload Payload data to update
 * @returns Updated organization plan record
 */
export const cancelOrganizationPlan = async (
  subscriptionId: string,
  payload: TOrganizationPlan['payload']
): Promise<TOrganizationPlan> => {
  const [plan] = await db
    .update(schema.organizationPlan)
    .set({
      isActive: false,
      deactivatedAt: sql`timezone('utc'::text, now())`,
      payload,
      updatedAt: sql`timezone('utc'::text, now())`
    })
    .where(eq(schema.organizationPlan.subscriptionId, subscriptionId))
    .returning();

  return plan;
};

/**
 * Updates an organization
 * @param id Organization ID
 * @param data Partial organization data to update. When `settings` is provided, it is deep-merged with existing settings.
 * @returns Updated organization record
 */
export const updateOrganization = async (id: string, data: Partial<TOrganization>): Promise<TOrganization> => {
  let setData = { ...data };

  if (data.settings !== undefined) {
    const [existing] = await db
      .select({ settings: schema.organization.settings })
      .from(schema.organization)
      .where(eq(schema.organization.id, id))
      .limit(1);

    const existingSettings = (existing?.settings as Record<string, unknown>) ?? {};
    const newSettings = data.settings as Record<string, unknown>;
    const mergedSettings: Record<string, unknown> = { ...existingSettings };
    for (const key of Object.keys(newSettings ?? {})) {
      const existingVal = existingSettings[key];
      const newVal = newSettings[key];
      if (newVal !== undefined) {
        if (
          existingVal &&
          typeof existingVal === 'object' &&
          !Array.isArray(existingVal) &&
          newVal &&
          typeof newVal === 'object' &&
          !Array.isArray(newVal)
        ) {
          mergedSettings[key] = { ...(existingVal as Record<string, unknown>), ...(newVal as Record<string, unknown>) };
        } else {
          mergedSettings[key] = newVal;
        }
      }
    }
    setData = { ...setData, settings: mergedSettings as TOrganization['settings'] };
  }

  const [organization] = await db
    .update(schema.organization)
    .set(setData)
    .where(eq(schema.organization.id, id))
    .returning();

  return organization;
};

/**
 * Get organization plan status for SSO entitlement check
 * @param orgId Organization ID
 * @returns Array of plan records
 */
export const getOrganizationPlanStatus = async (orgId: string) => {
  const result = await db
    .select({
      planName: schema.organizationPlan.planName,
      isActive: schema.organizationPlan.isActive
    })
    .from(schema.organizationPlan)
    .where(eq(schema.organizationPlan.orgId, orgId));

  return result;
};

export const getActiveOrganizationPlan = async (orgId: string) => {
  const [plan] = await db
    .select()
    .from(schema.organizationPlan)
    .where(and(eq(schema.organizationPlan.orgId, orgId), eq(schema.organizationPlan.isActive, true)))
    .limit(1);

  if (plan) return plan;

  // Secondary workspaces inherit their primary's plan.
  const [org] = await db
    .select({ parentOrganizationId: schema.organization.parentOrganizationId })
    .from(schema.organization)
    .where(eq(schema.organization.id, orgId))
    .limit(1);

  if (!org?.parentOrganizationId) return null;

  const [parentPlan] = await db
    .select()
    .from(schema.organizationPlan)
    .where(and(eq(schema.organizationPlan.orgId, org.parentOrganizationId), eq(schema.organizationPlan.isActive, true)))
    .limit(1);

  return parentPlan ?? null;
};

/**
 * Gets organization members by profile IDs
 * @param orgId Organization ID
 * @param profileIds Array of profile IDs to look up
 * @returns Array of { profileId, email } for matching members
 */
export async function getOrgMembersByProfileIds(orgId: string, profileIds: string[]) {
  try {
    if (profileIds.length === 0) return [];

    return db
      .select({
        profileId: schema.organizationmember.profileId,
        email: schema.organizationmember.email,
        roleId: schema.organizationmember.roleId
      })
      .from(schema.organizationmember)
      .where(
        and(
          eq(schema.organizationmember.organizationId, orgId),
          inArray(schema.organizationmember.profileId, profileIds)
        )
      );
  } catch (error) {
    console.error('getOrgMembersByProfileIds error:', error);
    throw new Error(
      `Failed to get org members by profile IDs: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export type TOrganizationMemberByEmail = {
  normalizedEmail: string;
  profileId: string | null;
  roleId: number;
};

/**
 * Resolves organization members matching normalized emails (profile email or organizationmember.email).
 */
export async function getOrganizationMembersByNormalizedEmails(
  orgId: string,
  emails: string[]
): Promise<TOrganizationMemberByEmail[]> {
  try {
    if (emails.length === 0) return [];

    const normalized = [...new Set(emails.map((e) => e.toLowerCase().trim()).filter(Boolean))];

    const rows = await db
      .select({
        roleId: schema.organizationmember.roleId,
        profileId: schema.organizationmember.profileId,
        matchEmail: sql<string>`lower(trim(coalesce(${schema.profile.email}, ${schema.organizationmember.email})))`.as(
          'matchEmail'
        )
      })
      .from(schema.organizationmember)
      .leftJoin(schema.profile, eq(schema.organizationmember.profileId, schema.profile.id))
      .where(
        and(
          eq(schema.organizationmember.organizationId, orgId),
          inArray(sql`lower(trim(coalesce(${schema.profile.email}, ${schema.organizationmember.email})))`, normalized)
        )
      );

    return rows.map((row) => ({
      normalizedEmail: row.matchEmail,
      profileId: row.profileId,
      roleId: row.roleId
    }));
  } catch (error) {
    console.error('getOrganizationMembersByNormalizedEmails error:', error);
    throw new Error(
      `Failed to get organization members by emails: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
