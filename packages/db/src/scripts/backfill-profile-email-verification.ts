/**
 * Backfills profile.is_email_verified for users already verified in auth
 * (user.email_verified or a linked OAuth/SSO account) but stale on profile.
 *
 * Usage:
 *   pnpm --filter @cio/db db:backfill-profile-email-verification           # dry run (default)
 *   pnpm --filter @cio/db db:backfill-profile-email-verification --execute # apply updates
 */
import 'dotenv/config';

import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL ?? process.env.PRIVATE_DATABASE_URL ?? '';
const shouldExecute = process.argv.includes('--execute');

if (!connectionString) {
  console.error('DATABASE_URL or PRIVATE_DATABASE_URL environment variable is required');
  process.exit(1);
}

const AFFECTED_PROFILES_SQL = `
  SELECT
    p.id,
    u.email,
    u.email_verified AS user_email_verified,
    p.is_email_verified AS profile_is_email_verified
  FROM profile p
  JOIN "user" u ON u.id = p.id
  WHERE COALESCE(p.is_email_verified, false) = false
    AND (
      u.email_verified = true
      OR EXISTS (
        SELECT 1
        FROM account a
        WHERE a.user_id = u.id
          AND a.provider_id <> 'credential'
      )
    )
`;

async function main() {
  const sql = postgres(connectionString);

  try {
    const affected = await sql.unsafe(AFFECTED_PROFILES_SQL);
    console.log(`Found ${affected.length} profile(s) to backfill.`);

    if (affected.length === 0) {
      console.log('Nothing to do.');
      return;
    }

    if (!shouldExecute) {
      console.log('Dry run only. Re-run with --execute to apply updates.');
      console.log('Sample (up to 10):');
      for (const row of affected.slice(0, 10)) {
        console.log(`  ${row.id}  ${row.email}  user=${row.user_email_verified}  profile=${row.profile_is_email_verified}`);
      }
      return;
    }

    const updated = await sql`
      UPDATE profile p
      SET
        is_email_verified = true,
        verified_at = COALESCE(p.verified_at, NOW()),
        updated_at = NOW()
      FROM "user" u
      WHERE p.id = u.id
        AND COALESCE(p.is_email_verified, false) = false
        AND (
          u.email_verified = true
          OR EXISTS (
            SELECT 1
            FROM account a
            WHERE a.user_id = u.id
              AND a.provider_id <> 'credential'
          )
        )
      RETURNING p.id, p.email
    `;

    const remaining = await sql.unsafe(`SELECT COUNT(*)::int AS count FROM (${AFFECTED_PROFILES_SQL}) AS affected`);
    const remainingCount = remaining[0]?.count ?? 0;

    console.log(`Updated ${updated.length} profile(s).`);
    console.log(`Remaining mismatches: ${remainingCount}`);

    if (remainingCount > 0) {
      console.warn('Some rows were not updated — inspect manually before retrying.');
      process.exit(1);
    }

    console.log('Backfill complete.');
  } catch (error) {
    console.error('backfill-profile-email-verification error:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

main();
