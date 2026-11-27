/**
 * Links email-only course, cohort and program rows to the active joined organization member with the same email,
 * using the same claim step as every sign-in and accept path (`claimEmailOnlyMemberships`): duplicates the profile
 * already has are dropped, claimed cohort students are enrolled in the cohort's courses, and compliance records are
 * created for the claimed and cohort courses through the shared compliance service. Invitations are not fulfilled
 * (nothing here proves identity) and no webhooks or emails are sent.
 *
 * Only members that still have claimable rows are visited. Idempotent: a second run finds nothing to do.
 *
 * Usage:
 *   pnpm --filter @cio/api claim:email-only-memberships                         # dry run (default)
 *   pnpm --filter @cio/api claim:email-only-memberships -- --execute            # apply
 *   pnpm --filter @cio/api claim:email-only-memberships -- --execute --org=<orgId>
 */
import 'dotenv/config';

import { db } from '@cio/db/drizzle';
import {
  countEmailOnlyMemberships,
  listEmailOnlyClaimCandidates,
  type TEmailOnlyClaimCandidate,
  type TEmailOnlyMembershipCounts
} from '@cio/db/queries/organization';
import { claimEmailOnlyMemberships } from '@cio/core/services/organization/identity-binding';

import { ensureComplianceEnrollmentRecordsForProfiles } from '@api/services/course/compliance';

const BATCH_SIZE = 500;
const PROGRESS_INTERVAL_MS = 30_000;

const shouldExecute = process.argv.includes('--execute');
const orgArg = process.argv.find((arg) => arg.startsWith('--org='));
const orgId = orgArg ? orgArg.slice('--org='.length).trim() : null;

if (orgArg && !orgId) {
  console.error('--org was passed with no value. Provide --org=<orgId> or omit it to run for every organization.');
  process.exit(1);
}

function printCounts(label: string, counts: TEmailOnlyMembershipCounts) {
  const { claimable, pending } = counts;
  console.log(`  ${label}`);
  console.log(`    claimable: groups=${claimable.groups} cohorts=${claimable.cohorts} programs=${claimable.programs}`);
  console.log(`    pending:   groups=${pending.groups} cohorts=${pending.cohorts} programs=${pending.programs}`);
}

async function claimForCandidate(candidate: TEmailOnlyClaimCandidate) {
  return db.transaction((tx) =>
    claimEmailOnlyMemberships(
      tx,
      { orgId: candidate.organizationId, email: candidate.email, profileId: candidate.profileId },
      {
        ensureComplianceEnrollmentRecords: (courseIds, profileIds, dbClient) =>
          ensureComplianceEnrollmentRecordsForProfiles(courseIds, profileIds, dbClient ?? tx)
      }
    )
  );
}

async function main() {
  console.log(
    `claim-email-only-memberships (${shouldExecute ? 'EXECUTE' : 'DRY RUN'}${orgId ? `, org=${orgId}` : ''})`
  );
  printCounts('before', await countEmailOnlyMemberships(orgId));

  if (!shouldExecute) {
    console.log('Dry run only. Re-run with --execute to link the claimable rows.');
    return;
  }

  const totals = { members: 0, claimed: 0, removedDuplicates: 0, cohortCourseEnrolments: 0, complianceRecords: 0 };
  let after: { organizationId: string; memberId: number } | null = null;
  let lastProgress = Date.now();

  while (true) {
    const batch = await listEmailOnlyClaimCandidates({ orgId, after, limit: BATCH_SIZE });
    if (batch.length === 0) break;

    for (const candidate of batch) {
      const { claimed, enrollment } = await claimForCandidate(candidate);
      totals.members += 1;
      totals.claimed += claimed.groups + claimed.cohorts + claimed.programs;
      totals.removedDuplicates += claimed.removedDuplicates;
      totals.cohortCourseEnrolments += enrollment.enrolledMembers.length;
      totals.complianceRecords += enrollment.complianceRecords.length;
    }

    const last = batch[batch.length - 1];
    after = { organizationId: last.organizationId, memberId: last.memberId };

    if (Date.now() - lastProgress > PROGRESS_INTERVAL_MS) {
      console.log(`  ...${totals.members} members processed, ${totals.claimed} rows linked`);
      lastProgress = Date.now();
    }
  }

  console.log(
    `Done: ${totals.members} member(s), ${totals.claimed} row(s) linked, ${totals.removedDuplicates} duplicate(s) ` +
      `dropped, ${totals.cohortCourseEnrolments} cohort course enrolment(s), ${totals.complianceRecords} compliance ` +
      'record(s) created.'
  );
  printCounts('after (claimable should be zero)', await countEmailOnlyMemberships(orgId));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('claim-email-only-memberships failed:', error);
    process.exit(1);
  });
