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

const STUDENT_ROLE_ID = 3;

/** Members linked to a profile and missing a groupmember row for an ACTIVE cohort course. */
function buildAffectedSql(limitToOrg: boolean) {
  return `
    SELECT DISTINCT
      cm.profile_id,
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
      ${limitToOrg ? 'AND co.organization_id = $1' : ''}
  `;
}

async function main() {
  const sql = postgres(connectionString);

  try {
    const affectedSql = buildAffectedSql(!!orgId);
    const affected = orgId ? await sql.unsafe(affectedSql, [orgId]) : await sql.unsafe(affectedSql);

    const cohorts = new Set(affected.map((row) => row.cohort_id));
    const students = new Set(affected.map((row) => row.profile_id));
    console.log(
      `Found ${affected.length} missing enrolment(s) across ${cohorts.size} cohort(s) and ${students.size} student(s).`
    );

    if (affected.length === 0) {
      console.log('Nothing to do.');
      return;
    }

    if (!shouldExecute) {
      console.log('Dry run only. Re-run with --execute to apply.');
      console.log('Sample (up to 10):');
      for (const row of affected.slice(0, 10)) {
        console.log(`  profile=${row.profile_id}  course=${row.course_id}  cohort=${row.cohort_id}`);
      }
      return;
    }

    const insertSql = `
      INSERT INTO groupmember (group_id, role_id, profile_id, email)
      SELECT DISTINCT ON (c.group_id, cm.profile_id)
        c.group_id,
        $${orgId ? '2' : '1'}::bigint,
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
        ${orgId ? 'AND co.organization_id = $1' : ''}
      ON CONFLICT DO NOTHING
      RETURNING id
    `;

    const inserted = orgId
      ? await sql.unsafe(insertSql, [orgId, STUDENT_ROLE_ID])
      : await sql.unsafe(insertSql, [STUDENT_ROLE_ID]);

    const remainingRows = orgId ? await sql.unsafe(affectedSql, [orgId]) : await sql.unsafe(affectedSql);

    console.log(`Inserted ${inserted.length} groupmember row(s).`);
    console.log(`Remaining missing enrolment(s): ${remainingRows.length}`);
    console.log('Course lists are cached per org; org stats caches refresh on their own TTL.');
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error('backfill-cohort-course-enrollment failed:', error);
  process.exit(1);
});
