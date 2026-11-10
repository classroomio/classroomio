/**
 * Creates an organization and makes the given email its admin.
 *
 * If no user exists for the email yet, a user + profile are created first so
 * the membership has a profile to point at. The admin is added as ROLE.ADMIN
 * with verified = true and an active plan is attached to the new org.
 *
 * Usage:
 *   [ADMIN_PASSWORD=...] pnpm --filter @cio/db db:create-org "<Org Name>" <email> [PLAN] [site-name] [--dry-run]
 *
 * PLAN is one of BASIC (default), EARLY_ADOPTER, ENTERPRISE.
 * site-name defaults to a slug of the org name.
 * --dry-run prints what would be created without writing anything.
 *
 * ADMIN_PASSWORD gives the admin an email/password login. It is read from the
 * environment so it stays out of shell history and process listings. Without
 * it the admin has no password and sets one with "Forgot password". It is
 * refused when the user already has a password.
 */
import 'dotenv/config';

import {
  account,
  and,
  db,
  eq,
  organization,
  organizationmember,
  organizationPlan,
  profile,
  user,
  type DbOrTxClient
} from '@db/drizzle';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, hashPassword } from '@db/auth/password';

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
    password: parsePassword(process.env.ADMIN_PASSWORD),
    isDryRun
  };
}

function parsePassword(value: string | undefined): string | undefined {
  if (!value) return undefined;

  if (value.length < PASSWORD_MIN_LENGTH || value.length > PASSWORD_MAX_LENGTH) {
    throw new Error(`ADMIN_PASSWORD must be ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters long.`);
  }

  return value;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function createUser(email: string, client: DbOrTxClient): Promise<string> {
  const name = email.split('@')[0] || 'user';
  const [created] = await client.insert(user).values({ name, email, emailVerified: true }).returning({ id: user.id });

  return created.id;
}

async function ensureProfile(userId: string, email: string, client: DbOrTxClient): Promise<void> {
  const emailPrefix = email.split('@')[0] || 'user';
  const username = `${emailPrefix}${Date.now()}`;

  await client.insert(profile).values({
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

async function hasCredentialAccount(userId: string): Promise<boolean> {
  const rows = await db
    .select({ id: account.id })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, 'credential')))
    .limit(1);

  return rows.length > 0;
}

async function createCredentialAccount(userId: string, password: string, client: DbOrTxClient): Promise<void> {
  const passwordHash = await hashPassword(password);

  await client.insert(account).values({ userId, accountId: userId, providerId: 'credential', password: passwordHash });
}

function describePassword(isSettingPassword: boolean, credentialExists: boolean): string {
  if (isSettingPassword) return 'will be set from ADMIN_PASSWORD';
  if (credentialExists) return 'already set';

  return 'none (set one with "Forgot password")';
}

async function main() {
  const { orgName, email, plan, siteName: providedSiteName, password, isDryRun } = parseArgs();

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
  const credentialExists = userId ? await hasCredentialAccount(userId) : false;

  if (password && credentialExists) {
    throw new Error(`${email} already has a password. Unset ADMIN_PASSWORD, or reset it with "Forgot password".`);
  }

  console.log('');
  console.log(isDryRun ? '[DRY RUN] No changes made.' : 'Creating organization:');
  console.log(`  Name:        ${orgName}`);
  console.log(`  Site name:   ${siteName}`);
  console.log(`  Admin:       ${email}`);
  console.log(`  Admin user:  ${userExists ? `exists (${userId})` : 'will be created'}`);
  console.log(`  Profile:     ${profileExists ? 'exists' : 'will be created'}`);
  console.log(`  Plan:        ${plan}`);
  console.log(`  Password:    ${describePassword(Boolean(password), credentialExists)}`);

  if (isDryRun) {
    console.log('');
    console.log('Re-run without --dry-run to apply.');
    return;
  }

  const result = await db.transaction(async (tx) => {
    const resolvedUserId = userExists ? (userId as string) : await createUser(email, tx);
    if (!profileExists) {
      await ensureProfile(resolvedUserId, email, tx);
    }

    if (password) {
      await createCredentialAccount(resolvedUserId, password, tx);
    }

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

  if (!password && !credentialExists) {
    console.log('');
    console.log('The admin has no password yet; use "forgot password" on login to set one.');
  }
}

main().catch((error) => {
  console.error('create-org-with-admin error:', error instanceof Error ? error.message : error);
  process.exit(1);
});
