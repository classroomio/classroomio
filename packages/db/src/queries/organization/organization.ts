import * as schema from '@db/schema';

import type { OrganizationPlan, OrganizationWithMemberAndPlans, OrganizationWithPlans } from './types';
import type {
  TNewOrganization,
  TNewOrganizationPlan,
  TNewOrganizationmember,
  TOrganization,
  TOrganizationPlan
} from '@db/types';
import { and, eq, inArray, or, sql } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants';
import { db, type DbOrTxClient } from '@db/drizzle';

export function getOrgIdBySiteName(siteName: string) {
  return db.select().from(schema.organization).where(eq(schema.organization.siteName, siteName)).limit(1);
}

export const getOrganizationByProfileId = async (profileId: string): Promise<OrganizationWithMemberAndPlans[]> => {
  const result = await db
    .select({
      organization: schema.organization,
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
      roleId: number | undefined;
      plans: Array<OrganizationPlan>;
    }
  >();

  for (const row of result) {
    const orgId = row.organization.id;

    if (!organizationMap.has(orgId)) {
      organizationMap.set(orgId, {
        organization: row.organization,
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

/**
 * Creates multiple organization members in a single query
 * @param data Array of organization member creation data
 * @returns Array of created members
 */
export const createOrganizationMembers = async (data: TNewOrganizationmember[]) => {
  const members = await db.insert(schema.organizationmember).values(data).returning();

  return members;
};

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
 * Gets organization audience (all organization members with student role)
 * @param orgId Organization ID
 * @returns Array of student profiles
 */
export const getOrganizationAudience = async (orgId: string) => {
  const result = await db
    .select({
      id: schema.profile.id,
      fullname: schema.profile.fullname,
      email: schema.profile.email,
      avatarUrl: schema.profile.avatarUrl,
      createdAt: schema.profile.createdAt
    })
    .from(schema.organizationmember)
    .innerJoin(schema.profile, eq(schema.organizationmember.profileId, schema.profile.id))
    .where(
      and(eq(schema.organizationmember.organizationId, orgId), eq(schema.organizationmember.roleId, ROLE.STUDENT))
    );

  return result.map((profile) => ({
    id: profile.id,
    name: profile.fullname,
    email: profile.email || '',
    avatarUrl: profile.avatarUrl || '',
    createdAt: profile.createdAt ? new Date(profile.createdAt).toDateString() : ''
  }));
};

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
