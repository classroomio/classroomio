#!/usr/bin/env tsx
/**
 * Records `groupmember.completed_at` for completions that predate the column.
 * Two steps, both idempotent:
 *   1. Copies `certificate_earned_at` into `completed_at`. A certificate is
 *      only ever earned on completion, so this is exact. It also corrects a
 *      later date that an evaluation recorded before this ran.
 *   2. Re-evaluates the remaining candidates with the live rule, mainly
 *      completions on plans without certificates, which were never recorded.
 *      A learner who completed before a certificate deadline that has since
 *      passed is not recorded.
 * Sends no certificate, email or analytics event.
 *
 * Deploy steps: `db:setup` repeats step 1 after migrations on every start,
 * so self-hosted upgrades need nothing more; their plan always includes
 * certificates. On cloud, run this once after the deploy (dry run, then
 * --execute) for step 2.
 *
 * Usage:
 *   pnpm --filter @cio/api backfill:course-completion                   # dry run (default)
 *   pnpm --filter @cio/api backfill:course-completion -- --execute      # apply
 *   pnpm --filter @cio/api backfill:course-completion -- --org=<orgId>  # limit to one org
 */
import 'dotenv/config';

import {
  copyEarnedCertificatesToCompletion,
  countCourseCompletionBackfillCandidates,
  countEarnedCertificatesMissingCompletion,
  listCourseCompletionBackfillCandidates
} from '@cio/db/queries/course/people';

import { backfillCourseCompletion } from '../src/services/course/completion';

const PAGE_SIZE = 200;
const CONCURRENCY = 5;

const shouldExecute = process.argv.includes('--execute');
const orgArg = process.argv.find((arg) => arg.startsWith('--org='));
const organizationId = orgArg ? orgArg.slice('--org='.length).trim() : '';

if (orgArg && !organizationId) {
  console.error('--org was passed with no value. Provide --org=<orgId> or omit it to run for every organization.');
  process.exit(1);
}

async function main() {
  const options = organizationId ? { organizationId } : {};
  const scope = organizationId ? ` in org ${organizationId}` : '';
  const missingCopyCount = await countEarnedCertificatesMissingCompletion(options);
  const candidateCount = await countCourseCompletionBackfillCandidates(options);

  console.log(`Found ${missingCopyCount} earned certificate(s) not reflected in completed_at${scope}.`);
  console.log(
    `Found ${candidateCount} membership(s) with no recorded completion that could meet the course rule${scope}.`
  );

  if (missingCopyCount === 0 && candidateCount === 0) {
    console.log('Nothing to do.');
    return;
  }

  if (!shouldExecute) {
    console.log('Dry run: re-run with --execute to copy earned certificates and evaluate the rest.');
    return;
  }

  const copiedCount = await copyEarnedCertificatesToCompletion(options);
  console.log(`Copied ${copiedCount} earned certificate(s) into completed_at.`);

  const remainingCount = await countCourseCompletionBackfillCandidates(options);

  let afterGroupMemberId: string | undefined;
  let evaluatedCount = 0;
  let recordedCount = 0;
  let failedCount = 0;

  while (true) {
    const candidates = await listCourseCompletionBackfillCandidates({
      ...options,
      afterGroupMemberId,
      limit: PAGE_SIZE
    });

    if (candidates.length === 0) break;

    for (let start = 0; start < candidates.length; start += CONCURRENCY) {
      const batch = candidates.slice(start, start + CONCURRENCY);
      const results = await Promise.allSettled(
        batch.map((candidate) => backfillCourseCompletion(candidate.courseId, candidate.profileId))
      );

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          if (result.value) recordedCount += 1;
          return;
        }

        failedCount += 1;
        console.error(`Failed to evaluate membership ${batch[index].groupMemberId}:`, result.reason);
      });
    }

    evaluatedCount += candidates.length;
    afterGroupMemberId = candidates[candidates.length - 1].groupMemberId;
    console.log(`Evaluated ${evaluatedCount}/${remainingCount}, recorded ${recordedCount}, failed ${failedCount}.`);
  }

  console.log(`Done. Recorded ${recordedCount} completion(s)${scope}; ${failedCount} failed.`);

  if (failedCount > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error('backfill-course-completion failed:', error);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
