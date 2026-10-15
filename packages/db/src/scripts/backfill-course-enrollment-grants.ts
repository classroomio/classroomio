/**
 * Backfills `course_enrollment_grant` rows for enrollments that predate the
 * grant ledger, so grant-existence checks keep working for them. Idempotent.
 *
 * Order matters: cohort-driven enrollments are derived first so they keep
 * their true `COHORT` source; everything still missing afterwards is
 * recorded as `IMPORT`. Only STUDENT groupmember rows are backfilled; staff
 * access is role-based and intentionally grant-less.
 *
 * Deploy steps (no safety-net writer: bugs must fail loudly):
 *   1. Migration at merge, which includes the backfill.
 *   2. Run this fixed script once after cutover (dry run, then --execute)
 *      to catch rows written in between.
 *
 * Usage:
 *   pnpm db:backfill-course-enrollment-grants                      # dry run (default)
 *   pnpm db:backfill-course-enrollment-grants -- --execute         # apply
 *   pnpm db:backfill-course-enrollment-grants -- --org=<orgId>     # limit to one org
 */
import 'dotenv/config';

import { db } from '../drizzle';
import {
  backfillCohortCourseEnrollmentGrants,
  backfillMissingCourseEnrollmentGrants,
  countMissingCohortCourseEnrollmentGrants,
  countMissingCourseEnrollmentGrants
} from '../queries/learning-path/enrollment-grant';

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

async function main() {
  const options = orgId ? { organizationId: orgId } : undefined;
  const scope = orgId ? ` in org ${orgId}` : '';
  const missingCohort = await countMissingCohortCourseEnrollmentGrants(options, db);
  const missingTotal = await countMissingCourseEnrollmentGrants(options, db);

  console.log(`Found ${missingCohort} cohort-driven enrolment(s) without a grant${scope}.`);
  console.log(`Found ${missingTotal} groupmember row(s) without any enrollment grant${scope}.`);

  if (missingCohort === 0 && missingTotal === 0) {
    console.log('Nothing to do.');
    return;
  }

  if (!shouldExecute) {
    console.log('Dry run only. Re-run with --execute to apply.');
    return;
  }

  const cohortInserted = await backfillCohortCourseEnrollmentGrants(options, db);
  const importInserted = await backfillMissingCourseEnrollmentGrants(options, db);
  const remainingCohort = await countMissingCohortCourseEnrollmentGrants(options, db);
  const remainingTotal = await countMissingCourseEnrollmentGrants(options, db);

  console.log(`Inserted ${cohortInserted} COHORT grant(s) and ${importInserted} IMPORT grant(s).`);
  console.log(`Remaining: ${remainingCohort} cohort-driven, ${remainingTotal} total without a grant.`);

  if (remainingCohort > 0 || remainingTotal > 0) {
    console.error('Some grants could not be created. Investigate before treating this as complete.');
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('backfill-course-enrollment-grants failed:', error);
  process.exit(1);
});
