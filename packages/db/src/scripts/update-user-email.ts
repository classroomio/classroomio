/**
 * Updates a user's email address everywhere it is stored:
 * "user" (auth), profile, organizationmember, groupmember and cohort_member.
 *
 * Membership tables are matched by profile_id OR the old email so rows that
 * only carry the denormalized email (pre-signup invites) are updated too.
 * Pending organization_invite rows are reported but not modified.
 *
 * Usage:
 *   pnpm db:update-user-email -- --old old@example.com --new new@example.com            # dry run (default)
 *   pnpm db:update-user-email -- --old old@example.com --new new@example.com --execute  # apply updates
 */
import 'dotenv/config';

import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL ?? process.env.PRIVATE_DATABASE_URL ?? '';
const shouldExecute = process.argv.includes('--execute');

function readArg(flag: string): string {
  const flagIndex = process.argv.indexOf(flag);
  const value = flagIndex === -1 ? '' : (process.argv[flagIndex + 1] ?? '');

  return value.trim().toLowerCase();
}

const oldEmail = readArg('--old');
const newEmail = readArg('--new');

if (!connectionString) {
  console.error('DATABASE_URL or PRIVATE_DATABASE_URL environment variable is required');
  process.exit(1);
}

if (!oldEmail || !newEmail) {
  console.error('Usage: pnpm db:update-user-email -- --old old@example.com --new new@example.com [--execute]');
  process.exit(1);
}

if (oldEmail === newEmail) {
  console.error('The old and new email addresses are identical.');
  process.exit(1);
}

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
  console.error(`"${newEmail}" does not look like a valid email address.`);
  process.exit(1);
}

async function main() {
  const sql = postgres(connectionString);

  try {
    const users = await sql`
      SELECT id, name, email, email_verified FROM "user" WHERE lower(email) = ${oldEmail}
    `;

    if (users.length === 0) {
      console.error(`No user found with email ${oldEmail}`);
      process.exit(1);
    }

    const targetUser = users[0];
    console.log(`Found user ${targetUser.id} (${targetUser.name}) <${targetUser.email}>`);

    const conflicts = await sql`
      SELECT 'user' AS source, id::text FROM "user" WHERE lower(email) = ${newEmail}
      UNION ALL
      SELECT 'profile' AS source, id::text FROM profile WHERE lower(email) = ${newEmail}
    `;

    if (conflicts.length > 0) {
      console.error(`The email ${newEmail} is already taken:`);
      for (const conflict of conflicts) {
        console.error(`  ${conflict.source} ${conflict.id}`);
      }
      process.exit(1);
    }

    const userId = targetUser.id;

    const [profileRows, orgMemberRows, groupMemberRows, cohortMemberRows, pendingInvites] = await Promise.all([
      sql`SELECT id FROM profile WHERE id = ${userId}`,
      sql`SELECT id FROM organizationmember WHERE profile_id = ${userId} OR lower(email) = ${oldEmail}`,
      sql`SELECT id FROM groupmember WHERE profile_id = ${userId} OR lower(email) = ${oldEmail}`,
      sql`SELECT id FROM cohort_member WHERE profile_id = ${userId} OR lower(email) = ${oldEmail}`,
      sql`SELECT id FROM organization_invite WHERE lower(email) = ${oldEmail}`
    ]);

    console.log('');
    console.log(`Rows to update with ${newEmail}:`);
    console.log(`  user:               1`);
    console.log(`  profile:            ${profileRows.length}`);
    console.log(`  organizationmember: ${orgMemberRows.length}`);
    console.log(`  groupmember:        ${groupMemberRows.length}`);
    console.log(`  cohort_member:      ${cohortMemberRows.length}`);

    if (pendingInvites.length > 0) {
      console.log('');
      console.warn(
        `Note: ${pendingInvites.length} pending organization_invite row(s) still reference ${oldEmail} and will NOT be modified.`
      );
    }

    if (!shouldExecute) {
      console.log('');
      console.log('Dry run only. Re-run with --execute to apply updates.');
      return;
    }

    await sql.begin(async (tx) => {
      await tx`
        UPDATE "user" SET email = ${newEmail}, updated_at = NOW() WHERE id = ${userId}
      `;
      await tx`
        UPDATE profile SET email = ${newEmail}, updated_at = NOW() WHERE id = ${userId}
      `;
      await tx`
        UPDATE organizationmember SET email = ${newEmail}
        WHERE profile_id = ${userId} OR lower(email) = ${oldEmail}
      `;
      await tx`
        UPDATE groupmember SET email = ${newEmail}
        WHERE profile_id = ${userId} OR lower(email) = ${oldEmail}
      `;
      await tx`
        UPDATE cohort_member SET email = ${newEmail}
        WHERE profile_id = ${userId} OR lower(email) = ${oldEmail}
      `;
    });

    console.log('');
    console.log(`Done. ${oldEmail} → ${newEmail} for user ${userId}.`);
    console.log(
      `email_verified was left as-is (${targetUser.email_verified}). The user logs in with the new email; their password is unchanged.`
    );
  } catch (error) {
    console.error('update-user-email error:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
