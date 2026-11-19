/**
 * Deletes an organization and ALL associated data for a given user email.
 *
 * Only processes organizations where the user has an ADMIN role.
 * For each admin org, cascades through every child table (courses, lessons,
 * exercises, submissions, groupmembers, tags, assets, widgets, programs,
 * cohorts, AI data, analytics, etc.) before removing the org.
 *
 * After all orgs are deleted, also removes the user account (profile,
 * sessions, accounts, SSO providers) if no RESTRICT FKs remain. If the
 * user still has references elsewhere (e.g. widgets in other orgs), the
 * user is left intact and a warning is printed.
 *
 * Usage:
 *   pnpm --filter @cio/db db:delete-org -- --email user@example.com                # dry run (default)
 *   pnpm --filter @cio/db db:delete-org -- --email user@example.com --execute      # permanent delete
 */
import 'dotenv/config';

import postgres from 'postgres';

import { countOrgData, deleteOrganization, printCounts } from './lib/org-deletion';

const connectionString = process.env.DATABASE_URL ?? process.env.PRIVATE_DATABASE_URL ?? '';
const shouldExecute = process.argv.includes('--execute');

function readArg(flag: string): string {
  const flagIndex = process.argv.indexOf(flag);
  const value = flagIndex === -1 ? '' : (process.argv[flagIndex + 1] ?? '');

  if (value.startsWith('--')) {
    console.error(`Missing value for ${flag}`);
    process.exit(1);
  }

  return value.trim();
}

const email = readArg('--email').toLowerCase();

if (!connectionString) {
  console.error('DATABASE_URL or PRIVATE_DATABASE_URL environment variable is required');
  process.exit(1);
}

if (!email) {
  console.error('Usage: pnpm --filter @cio/db db:delete-org -- --email user@example.com [--execute]');
  process.exit(1);
}

const ROLE_ADMIN = 1;

async function main() {
  const sql = postgres(connectionString);

  try {
    // 1. Find the user
    const users = await sql`
      SELECT id, name, email FROM "user" WHERE lower(email) = ${email}
    `;

    if (users.length === 0) {
      console.error(`No user found with email ${email}`);
      process.exit(1);
    }

    if (users.length > 1) {
      console.error(
        `${users.length} users match ${email} case-insensitively: ${users.map((u) => u.id).join(', ')}. Resolve the ambiguity before running this script.`
      );
      process.exit(1);
    }

    const targetUser = users[0];
    console.log(`Found user ${targetUser.id} (${targetUser.name}) <${targetUser.email}>`);

    // 2. Find organizations where this user is an admin
    const adminMemberships = await sql`
      SELECT om.id AS member_id, om.organization_id, o.name AS org_name
      FROM organizationmember om
      JOIN organization o ON o.id = om.organization_id
      WHERE om.profile_id = ${targetUser.id} AND om.role_id = ${ROLE_ADMIN}
    `;

    if (adminMemberships.length === 0) {
      console.error(`User ${email} is not an admin of any organization. Nothing to delete.`);
      process.exit(1);
    }

    console.log(`\nUser is admin of ${adminMemberships.length} organization(s):`);
    for (const m of adminMemberships) {
      console.log(`  - ${m.org_name} (${m.organization_id})`);
    }

    if (!shouldExecute) {
      console.log('\n--- DRY RUN: would delete the following for each organization ---\n');

      for (const m of adminMemberships) {
        const orgId = m.organization_id;
        const counts = await countOrgData(sql, orgId);

        console.log(`Organization: ${m.org_name} (${orgId})`);
        printCounts(counts);
        console.log('');
      }

      console.log('Dry run only. Re-run with --execute to permanently delete.');
      return;
    }

    // 3. Execute deletion for each org
    for (const m of adminMemberships) {
      const orgId = m.organization_id;
      console.log(`\nDeleting organization: ${m.org_name} (${orgId}) ...`);

      await deleteOrganization(sql, orgId);
      console.log(`  ✓ Organization "${m.org_name}" and all associated data deleted.`);
    }

    // 4. Clean up the user account itself
    console.log('\nCleaning up user account ...');
    const userDeleted = await deleteUserAccount(sql, targetUser.id);

    if (userDeleted) {
      console.log(`  ✓ User account ${targetUser.id} (${targetUser.email}) deleted.`);
    } else {
      console.log(`  ⚠ User account ${targetUser.id} could not be deleted (remaining references in other tables).`);
      console.log('    The user may still belong to other organizations or own data outside the deleted orgs.');
    }

    console.log('\nDone. All targeted organizations and their data have been permanently removed.');
  } catch (error) {
    console.error('delete-org error:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

/**
 * Attempts to fully delete a user and all their data.
 *
 * FK order:
 *   1. session       (CASCADE from user — but explicit for safety)
 *   2. account       (CASCADE from user)
 *   3. sso_provider  (CASCADE from user)
 *   4. analytics_login_events  (RESTRICT to user.id)
 *   5. widget        (RESTRICT to user.id via createdByUserId)
 *   6. profile       (RESTRICT to user.id)
 *   7. user
 *
 * Returns true if the user was deleted, false if blocked by RESTRICT FKs.
 */
async function deleteUserAccount(sql: postgres.Sql, userId: string): Promise<boolean> {
  return sql
    .begin(async (tx) => {
      // Delete sessions (CASCADE, but explicit)
      await tx`DELETE FROM session WHERE user_id = ${userId}`;

      // Delete accounts (CASCADE, but explicit)
      await tx`DELETE FROM account WHERE user_id = ${userId}`;

      // Delete SSO providers (CASCADE, but explicit)
      await tx`DELETE FROM sso_provider WHERE user_id = ${userId}`;

      // Delete login events (RESTRICT FK)
      await tx`DELETE FROM analytics_login_events WHERE user_id = ${userId}`;

      // Delete widgets where this user is the creator (RESTRICT FK on createdByUserId)
      // First delete child tables, then the widget itself
      const userWidgets = await tx`SELECT id FROM widget WHERE created_by_user_id = ${userId}`;
      const widgetIds = userWidgets.map((w) => w.id);

      if (widgetIds.length > 0) {
        await tx`DELETE FROM widget_course WHERE widget_id IN ${tx(widgetIds)}`;
        await tx`DELETE FROM widget_version WHERE widget_id IN ${tx(widgetIds)}`;
        await tx`DELETE FROM widget WHERE id IN ${tx(widgetIds)}`;
      }

      // Delete profile (RESTRICT FK — profile.id = user.id)
      await tx`DELETE FROM profile WHERE id = ${userId}`;

      // Delete the user (session/account/sso cascade)
      await tx`DELETE FROM "user" WHERE id = ${userId}`;

      return true;
    })
    .then(() => true)
    .catch(() => false);
}

main();
