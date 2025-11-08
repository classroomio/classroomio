import * as schema from '@db/schema';

import type { OrganizationPlan, OrganizationWithMemberAndPlans } from './types';
import { eq, sql } from 'drizzle-orm';

import { db } from '@db/drizzle';

export const getOrganizationByProfileId = async (profileId: string): Promise<OrganizationWithMemberAndPlans[]> => {
  const result = await db
    .select({
      organization: schema.organization,
      member: schema.organizationmember,
      plan: {
        planName: schema.organizationPlan.planName,
        isActive: schema.organizationPlan.isActive,
        provider: schema.organizationPlan.provider,
        subscriptionId: schema.organizationPlan.subscriptionId,
        customerId: sql`organization_plan.payload->>'customerId'`.as('customerId')
      }
    })
    .from(schema.organization)
    .innerJoin(schema.organizationmember, eq(schema.organization.id, schema.organizationmember.organizationId))
    .leftJoin(schema.organizationPlan, eq(schema.organization.id, schema.organizationPlan.orgId))
    .where(eq(schema.organizationmember.profileId, profileId));

  // Group by organization and collect plans into an array
  const organizationMap = new Map<
    string,
    {
      organization: typeof schema.organization.$inferSelect;
      member: typeof schema.organizationmember.$inferSelect;
      plans: Array<OrganizationPlan>;
    }
  >();

  for (const row of result) {
    const orgId = row.organization.id;

    if (!organizationMap.has(orgId)) {
      organizationMap.set(orgId, {
        organization: row.organization,
        member: row.member,
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

  return Array.from(organizationMap.values()).map(({ organization, member, plans }) => ({
    ...organization,
    member,
    plans
  }));
};
