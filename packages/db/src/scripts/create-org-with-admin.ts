/**
 * Creates an organization and makes the given email its admin.
 *
 * If no user exists for the email yet, a user + profile are created first so
 * the membership has a profile to point at. The admin is added as ROLE.ADMIN
 * with verified = true and an active plan is attached to the new org.
 *
 * Usage:
 *   pnpm --filter @cio/db db:create-org "<Org Name>" <email> [PLAN] [site-name] [--dry-run]
 *
 * PLAN is one of BASIC (default), EARLY_ADOPTER, ENTERPRISE.
 * site-name defaults to a slug of the org name.
 * --dry-run prints what would be created without writing anything.
 */
import 'dotenv/config';

import { db, eq, organization, organizationmember, organizationPlan, profile, user } from '@db/drizzle';

import { ROLE } from '@cio/utils/constants';
import { PLAN } from '@cio/utils/plans';

type PlanName = keyof typeof PLAN;

const VALID_PLANS = new Set<string>([PLAN.BASIC, PLAN.EARLY_ADOPTER, PLAN.ENTERPRISE]);

function parseArgs() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const [orgName, email, planArg, siteNameArg] = args.filter((arg) => !arg.startsWith('--'));

  if (!orgName || !email) {
    throw new Error('Usage: pnpm --filter @cio/db db:create-org "<Org Name>" <email> [PLAN] [site-name] [--dry-run]');
  }

  const plan = (planArg ?? PLAN.BASIC).toUpperCase() as PlanName;
  if (!VALID_PLANS.has(plan)) {
    throw new Error(`Invalid plan '${planArg}'. Must be one of: ${[...VALID_PLANS].join(', ')}`);
  }

  return {
    orgName: orgName.trim(),
    email: email.trim().toLowerCase(),
    plan,
    siteName: siteNameArg?.trim(),
    isDryRun
  };
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function createUser(email: string): Promise<string> {
  const name = email.split('@')[0] || 'user';
  const [created] = await db.insert(user).values({ name, email, emailVerified: true }).returning({ id: user.id });

  return created.id;
}

async function ensureProfile(userId: string, email: string): Promise<void> {
  const emailPrefix = email.split('@')[0] || 'user';
  const username = `${emailPrefix}${Date.now()}`;

  await db.insert(profile).values({
    id: userId,
    username,
    fullname: emailPrefix,
    email,
    canAddCourse: true,
    isEmailVerified: true
  });
}

async function hasProfile(userId: string): Promise<boolean> {
  const rows = await db.select({ id: profile.id }).from(profile).where(eq(profile.id, userId)).limit(1);

  return rows.length > 0;
}

async function main() {
  const { orgName, email, plan, siteName: providedSiteName, isDryRun } = parseArgs();

  const siteName = providedSiteName || slugify(orgName);
  if (!siteName) {
    throw new Error('Could not derive a site name from the organization name. Pass one explicitly.');
  }

  const existingOrg = await db
    .select({ id: organization.id })
    .from(organization)
    .where(eq(organization.siteName, siteName))
    .limit(1);

  if (existingOrg.length > 0) {
    throw new Error(`Organization with site name '${siteName}' already exists (${existingOrg[0].id})`);
  }

  const existingUser = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
  const userId = existingUser[0]?.id;
  const userExists = Boolean(userId);
  const profileExists = userId ? await hasProfile(userId) : false;

  console.log('');
  console.log(isDryRun ? '[DRY RUN] No changes made.' : 'Creating organization:');
  console.log(`  Name:        ${orgName}`);
  console.log(`  Site name:   ${siteName}`);
  console.log(`  Admin:       ${email}`);
  console.log(`  Admin user:  ${userExists ? `exists (${userId})` : 'will be created'}`);
  console.log(`  Profile:     ${profileExists ? 'exists' : 'will be created'}`);
  console.log(`  Plan:        ${plan}`);

  if (isDryRun) {
    console.log('');
    console.log('Re-run without --dry-run to apply.');
    return;
  }

  const resolvedUserId = userExists ? (userId as string) : await createUser(email);
  if (!profileExists) {
    await ensureProfile(resolvedUserId, email);
  }

  const result = await db.transaction(async (tx) => {
    const [org] = await tx.insert(organization).values({ name: orgName, siteName }).returning();

    const [member] = await tx
      .insert(organizationmember)
      .values({ organizationId: org.id, profileId: resolvedUserId, roleId: ROLE.ADMIN, verified: true })
      .returning();

    await tx.insert(organizationPlan).values({
      orgId: org.id,
      planName: plan,
      subscriptionId: `script-${org.id}`,
      triggeredBy: member.id,
      provider: 'script',
      payload: {},
      isActive: true
    });

    return { org, member };
  });

  console.log('');
  console.log('Created:');
  console.log(`  Org ID:    ${result.org.id}`);
  console.log(`  Member ID: ${result.member.id}`);
  console.log('');
  console.log('The admin has no password yet; use "forgot password" on login to set one.');
}

main().catch((error) => {
  console.error('create-org-with-admin error:', error instanceof Error ? error.message : error);
  process.exit(1);
});
