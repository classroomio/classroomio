/**
 * Copies legacy profile.settings.emailNotifications into
 * organizationmember_email_notifications (one row per membership), then
 * removes the old jsonb key from profile.settings.
 *
 * Usage:
 *   pnpm db:backfill-member-email-notifications           # dry run (default)
 *   pnpm db:backfill-member-email-notifications -- --execute # apply updates
 */
import 'dotenv/config';

import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL ?? process.env.PRIVATE_DATABASE_URL ?? '';
const shouldExecute = process.argv.includes('--execute');

if (!connectionString) {
  console.error('DATABASE_URL or PRIVATE_DATABASE_URL environment variable is required');
  process.exit(1);
}

const AFFECTED_MEMBERSHIPS_SQL = `
  SELECT
    om.id AS organization_member_id,
    p.id AS profile_id,
    om.organization_id,
    p.settings->'emailNotifications' AS legacy_preferences
  FROM organizationmember om
  INNER JOIN profile p ON p.id = om.profile_id
  WHERE p.settings ? 'emailNotifications'
`;

async function main() {
  const sql = postgres(connectionString);

  try {
    const affected = await sql.unsafe(AFFECTED_MEMBERSHIPS_SQL);
    console.log(`Found ${affected.length} organization membership(s) with legacy profile email preferences.`);

    if (affected.length === 0) {
      console.log('Nothing to do.');
      return;
    }

    if (!shouldExecute) {
      console.log('Dry run only. Re-run with --execute to apply updates.');
      console.log('Sample (up to 10):');
      for (const row of affected.slice(0, 10)) {
        console.log(`  member=${row.organization_member_id}  profile=${row.profile_id}  org=${row.organization_id}`);
      }
      return;
    }

    const inserted = await sql`
      INSERT INTO organizationmember_email_notifications (
        organization_member_id,
        new_student,
        new_submission,
        grading_result,
        newsfeed,
        quiz_assigned,
        cohort_reminder,
        session,
        course_completion
      )
      SELECT
        om.id,
        COALESCE((p.settings->'emailNotifications'->>'newStudent')::boolean, true),
        COALESCE((p.settings->'emailNotifications'->>'newSubmission')::boolean, true),
        COALESCE((p.settings->'emailNotifications'->>'gradingResult')::boolean, true),
        COALESCE((p.settings->'emailNotifications'->>'newsfeed')::boolean, true),
        COALESCE((p.settings->'emailNotifications'->>'quizAssigned')::boolean, true),
        COALESCE((p.settings->'emailNotifications'->>'cohortReminder')::boolean, true),
        COALESCE((p.settings->'emailNotifications'->>'session')::boolean, true),
        COALESCE((p.settings->'emailNotifications'->>'courseCompletion')::boolean, true)
      FROM organizationmember om
      INNER JOIN profile p ON p.id = om.profile_id
      WHERE p.settings ? 'emailNotifications'
      ON CONFLICT (organization_member_id) DO NOTHING
      RETURNING organization_member_id
    `;

    const clearedProfiles = await sql`
      UPDATE profile
      SET settings = settings - 'emailNotifications'
      WHERE settings ? 'emailNotifications'
      RETURNING id
    `;

    const remaining = await sql.unsafe(`SELECT COUNT(*)::int AS count FROM (${AFFECTED_MEMBERSHIPS_SQL}) AS affected`);
    const remainingCount = remaining[0]?.count ?? 0;

    console.log(`Inserted ${inserted.length} organizationmember_email_notifications row(s).`);
    console.log(`Cleared legacy preferences from ${clearedProfiles.length} profile(s).`);
    console.log(`Remaining memberships with legacy profile preferences: ${remainingCount}`);

    if (remainingCount > 0) {
      console.warn('Some rows were not migrated — inspect manually before retrying.');
      process.exit(1);
    }

    console.log('Backfill complete.');
  } catch (error) {
    console.error('backfill-member-email-notifications-from-profile error:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

main();
