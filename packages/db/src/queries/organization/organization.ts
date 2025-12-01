import * as schema from '@db/schema';

import type { OrganizationPlan, OrganizationWithMemberAndPlans, OrganizationWithPlans } from './types';
import type {
  TNewOrganization,
  TNewOrganizationPlan,
  TNewOrganizationmember,
  TOrganization,
  TOrganizationPlan
} from '@db/types';
import { and, eq, sql } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants';
import { db } from '@db/drizzle';

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

export const createOrganization = async (data: TNewOrganization) => {
  const [organization] = await db.insert(schema.organization).values(data).returning();

  return organization;
};

export const createOrganizationMember = async (data: TNewOrganizationmember) => {
  const [member] = await db.insert(schema.organizationmember).values(data).returning();

  return member;
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

export const deleteOrganizationById = async (id: string) => {
  await db.delete(schema.organization).where(eq(schema.organization.id, id));
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
 * Gets organization audience (students who are participants in any course)
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
    .from(schema.profile)
    .innerJoin(schema.groupmember, eq(schema.profile.id, schema.groupmember.profileId))
    .innerJoin(schema.group, eq(schema.groupmember.groupId, schema.group.id))
    .where(and(eq(schema.group.organizationId, orgId), eq(schema.groupmember.roleId, ROLE.STUDENT)));

  return result.map((profile) => ({
    id: profile.id,
    name: profile.fullname,
    email: profile.email || '',
    avatar_url: profile.avatarUrl || '',
    date_joined: profile.createdAt ? new Date(profile.createdAt).toDateString() : ''
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
 * Creates a new organization plan
 * @param data Organization plan creation data
 * @returns Created organization plan record
 */
export const createOrganizationPlan = async (data: TNewOrganizationPlan): Promise<TOrganizationPlan> => {
  const [plan] = await db.insert(schema.organizationPlan).values(data).returning();
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
 * @param data Partial organization data to update
 * @returns Updated organization record
 */
export const updateOrganization = async (id: string, data: Partial<TOrganization>): Promise<TOrganization> => {
  const [organization] = await db
    .update(schema.organization)
    .set(data)
    .where(eq(schema.organization.id, id))
    .returning();

  return organization;
};
