import { and, db, eq, organizationPlan } from '@db/drizzle';

export async function seedEnterpriseOrganizationPlan({ enterpriseOrgId }: { enterpriseOrgId: string }) {
  const existing = await db
    .select()
    .from(organizationPlan)
    .where(
      and(
        eq(organizationPlan.orgId, enterpriseOrgId),
        eq(organizationPlan.planName, 'ENTERPRISE'),
        eq(organizationPlan.isActive, true)
      )
    );

  if (existing.length > 0) {
    console.log('   ✓ Enterprise organization plan already exists, skipping');
    return;
  }

  await db.insert(organizationPlan).values({
    orgId: enterpriseOrgId,
    planName: 'ENTERPRISE',
    isActive: true,
    subscriptionId: 'seed-coursera-test-enterprise',
    provider: 'seed'
  });
  console.log('   ✓ Inserted enterprise organization plan');
}

export async function seedTestOrganizationPlan({ testOrgId }: { testOrgId: string }) {
  const existing = await db
    .select()
    .from(organizationPlan)
    .where(
      and(eq(organizationPlan.orgId, testOrgId), eq(organizationPlan.planName, 'ENTERPRISE'), eq(organizationPlan.isActive, true))
    );

  if (existing.length > 0) {
    console.log('   ✓ Test organization plan already exists, skipping');
    return;
  }

  await db.insert(organizationPlan).values({
    orgId: testOrgId,
    planName: 'ENTERPRISE',
    isActive: true,
    subscriptionId: 'seed-udemy-test-enterprise',
    provider: 'seed'
  });
  console.log('   ✓ Inserted test organization plan (ENTERPRISE for udemy-test demo)');
}

export async function seedEarlyAdopterOrganizationPlan({ earlyAdopterOrgId }: { earlyAdopterOrgId: string }) {
  const existing = await db
    .select()
    .from(organizationPlan)
    .where(
      and(
        eq(organizationPlan.orgId, earlyAdopterOrgId),
        eq(organizationPlan.planName, 'EARLY_ADOPTER'),
        eq(organizationPlan.isActive, true)
      )
    );

  if (existing.length > 0) {
    console.log('   ✓ Early adopter organization plan already exists, skipping');
    return;
  }

  await db.insert(organizationPlan).values({
    orgId: earlyAdopterOrgId,
    planName: 'EARLY_ADOPTER',
    isActive: true,
    subscriptionId: 'seed-skillshare-test-early-adopter',
    provider: 'seed'
  });
  console.log('   ✓ Inserted early adopter organization plan');
}
