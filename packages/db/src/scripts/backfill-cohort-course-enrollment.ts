/**
 * Enrols existing cohort members into their cohort's courses, for members added
 * before joining a cohort granted course access. Idempotent.
 *
 * Usage:
 *   pnpm db:backfill-cohort-course-enrollment                      # dry run (default)
 *   pnpm db:backfill-cohort-course-enrollment -- --execute         # apply
 *   pnpm db:backfill-cohort-course-enrollment -- --org=<orgId>     # limit to one org
 */
import 'dotenv/config';

import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL ?? process.env.PRIVATE_DATABASE_URL ?? '';
const shouldExecute = process.argv.includes('--execute');
const orgArg = process.argv.find((arg) => arg.startsWith('--org='));
const orgId = orgArg ? orgArg.slice('--org='.length).trim() : '';

if (!connectionString) {
  console.error('DATABASE_URL or PRIVATE_DATABASE_URL environment variable is required');
  process.exit(1);
}

// Without this, `--org=` would silently widen an intended single-org run to every org.
if (orgArg && !orgId) {
  console.error('--org was passed with no value. Provide --org=<orgId> or omit it to run for every organization.');
  process.exit(1);
}

const ORG_FILTER = orgId ? 'AND co.organization_id = $1' : '';

/** Members linked to a profile and missing a groupmember row for an ACTIVE cohort course. */
const AFFECTED_SQL = `
  SELECT DISTINCT
    cm.profile_id,
    cm.role_id,
    cm.email,
    c.group_id,
    c.id AS course_id,
    co.id AS cohort_id,
    co.organization_id
  FROM cohort_member cm
  INNER JOIN cohort co ON co.id = cm.cohort_id
  INNER JOIN cohort_course cc ON cc.cohort_id = co.id
  INNER JOIN course c ON c.id = cc.course_id
  LEFT JOIN groupmember gm ON gm.group_id = c.group_id AND gm.profile_id = cm.profile_id
  WHERE cm.profile_id IS NOT NULL
    AND c.group_id IS NOT NULL
    AND c.status = 'ACTIVE'
    AND gm.id IS NULL
    ${ORG_FILTER}
`;

/**
 * Carries the cohort role across: a cohort tutor or admin must not become a
 * student. Where one profile holds several cohort roles for the same course,
 * ORDER BY takes the most privileged so the result is deterministic.
 */
const INSERT_SQL = `
  INSERT INTO groupmember (group_id, role_id, profile_id, email)
  SELECT DISTINCT ON (c.group_id, cm.profile_id)
    c.group_id,
    cm.role_id,
    cm.profile_id,
    cm.email
  FROM cohort_member cm
  INNER JOIN cohort co ON co.id = cm.cohort_id
  INNER JOIN cohort_course cc ON cc.cohort_id = co.id
  INNER JOIN course c ON c.id = cc.course_id
  LEFT JOIN groupmember gm ON gm.group_id = c.group_id AND gm.profile_id = cm.profile_id
  WHERE cm.profile_id IS NOT NULL
    AND c.group_id IS NOT NULL
    AND c.status = 'ACTIVE'
    AND gm.id IS NULL
    ${ORG_FILTER}
  ORDER BY c.group_id, cm.profile_id, cm.role_id ASC
  ON CONFLICT DO NOTHING
  RETURNING id
`;

async function main() {
  const sql = postgres(connectionString);
  const params = orgId ? [orgId] : [];

  try {
    const affected = await sql.unsafe(AFFECTED_SQL, params);

    const cohorts = new Set(affected.map((row) => row.cohort_id));
    const profiles = new Set(affected.map((row) => row.profile_id));
    console.log(
      `Found ${affected.length} missing enrolment(s) across ${cohorts.size} cohort(s) and ${profiles.size} member(s).`
    );

    if (affected.length === 0) {
      console.log('Nothing to do.');
      return;
    }

    if (!shouldExecute) {
      const staff = affected.filter((row) => Number(row.role_id) !== 3);
      console.log(`  of which non-student cohort roles: ${staff.length}`);
      console.log('Dry run only. Re-run with --execute to apply.');
      console.log('Sample (up to 10):');
      for (const row of affected.slice(0, 10)) {
        console.log(
          `  profile=${row.profile_id}  course=${row.course_id}  cohort=${row.cohort_id}  role=${row.role_id}`
        );
      }
      return;
    }

    const inserted = await sql.unsafe(INSERT_SQL, params);
    const remaining = await sql.unsafe(AFFECTED_SQL, params);

    console.log(`Inserted ${inserted.length} groupmember row(s).`);
    console.log(`Remaining missing enrolment(s): ${remaining.length}`);

    if (remaining.length > 0) {
      console.error('Some enrolments could not be created. Investigate before treating this as complete.');
      process.exitCode = 1;
    }
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error('backfill-cohort-course-enrollment failed:', error);
  process.exit(1);
});
