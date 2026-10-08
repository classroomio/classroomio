/**
 * Reads suspected spam accounts from a CSV export and reports what each account
 * did inside ClassroomIO (orgs, courses, invites, analytics, etc.).
 *
 * Default CSV: company/data-export/dump-28-09-29.csv
 *
 * Usage:
 *   pnpm --filter @cio/db db:analyze-spam-accounts
 *   pnpm --filter @cio/db db:analyze-spam-accounts -- --csv ../../company/data-export/dump-28-09-29.csv
 *   pnpm --filter @cio/db db:analyze-spam-accounts -- --all
 *   pnpm --filter @cio/db db:analyze-spam-accounts -- --json > spam-report.json
 *
 * Requires DATABASE_URL or PRIVATE_DATABASE_URL (read-only is fine).
 */
import 'dotenv/config';

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import postgres from 'postgres';

import {
  analyzeAccounts,
  formatActivityLine,
  isLikelySpam,
  loadCsvAccounts,
  repoCsvPath,
  summarizeActivities,
  type AccountActivity
} from './lib/spam-account-analysis';

const connectionString = process.env.DATABASE_URL ?? process.env.PRIVATE_DATABASE_URL ?? '';
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '../../../..');

function readArg(flag: string): string {
  const flagIndex = process.argv.indexOf(flag);
  const value = flagIndex === -1 ? '' : (process.argv[flagIndex + 1] ?? '');

  if (value.startsWith('--')) {
    console.error(`Missing value for ${flag}`);
    process.exit(1);
  }

  return value.trim();
}

const csvArg = readArg('--csv');
const csvPath = csvArg ? resolve(process.cwd(), csvArg) : repoCsvPath(repoRoot);
const includeAll = process.argv.includes('--all');
const jsonOutput = process.argv.includes('--json');
const verbose = process.argv.includes('--verbose');

if (!connectionString) {
  console.error('DATABASE_URL or PRIVATE_DATABASE_URL environment variable is required');
  process.exit(1);
}

function printHumanReport(activities: AccountActivity[]) {
  const summary = summarizeActivities(activities);

  console.log('');
  console.log('=== Spam account activity summary ===');
  console.log(`CSV rows analyzed: ${summary.totalCsvRows}`);
  console.log(`Likely spam (heuristic score >= 3): ${summary.likelySpamRows}`);
  console.log(`Found in DB: ${summary.foundInDb}`);
  console.log(`Not found in DB: ${summary.notFoundInDb}`);
  console.log(`With admin org: ${summary.withAdminOrg}`);
  console.log(`With any org membership: ${summary.withAnyOrg}`);
  console.log(`Signup only (no org): ${summary.signupOnly}`);
  console.log(`Total courses in their admin orgs: ${summary.createdCourses}`);
  console.log(`Published courses in their admin orgs: ${summary.publishedCourses}`);
  console.log(`Avg courses per admin org: ${summary.avgCoursesPerAdminOrg}`);
  console.log(`Sent invite emails: ${summary.sentAnyInviteEmail}`);
  console.log(`With analytics events: ${summary.withAnalyticsEvents}`);
  console.log(`Email verified: ${summary.emailVerified}`);
  console.log(`Banned: ${summary.banned}`);
  console.log(`Largest signup burst (1h window, likely-spam subset): ${summary.signupBurstAccounts}`);

  console.log('');
  console.log('=== Likely spam pattern signals ===');
  console.log('- URL embedded in fullname at signup');
  console.log('- Cyrillic + promotional copy in fullname');
  console.log('- Gmail plus-address batch (infojobes+...)');
  console.log('- Many signups within a short window with no product usage');
  console.log('- Admin org created but zero courses, invites, or analytics');

  console.log('');
  console.log('=== Per-account lines ===');
  for (const activity of activities) {
    console.log(formatActivityLine(activity));
  }

  if (verbose) {
    console.log('');
    console.log('=== Verbose admin org details ===');
    for (const activity of activities.filter((row) => row.adminOrgCount > 0)) {
      console.log('');
      console.log(`${activity.email} (${activity.csvFullname})`);
      for (const org of activity.adminOrgs) {
        console.log(
          [
            `  org=${org.siteName ?? org.orgName}`,
            `plan=${org.plan ?? 'none'}`,
            `courses=${org.courseCount}`,
            `published=${org.publishedCourseCount}`,
            `lessons=${org.lessonCount}`,
            `exercises=${org.exerciseCount}`,
            `members=${org.orgMemberCount}`,
            `orgInvites=${org.orgInviteCount}`,
            `orgEmailsSent=${org.orgInviteEmailsSent}`,
            `courseInvites=${org.courseInviteCount}`,
            `courseEmailsSent=${org.courseInviteEmailsSent}`,
            `widgets=${org.widgetCount}`,
            `landingLinks=${org.landingPageHasExternalLink ? 'yes' : 'no'}`
          ].join(' | ')
        );
      }
    }
  }
}

async function main() {
  const csvRows = loadCsvAccounts(csvPath);
  const targetRows = includeAll ? csvRows : csvRows.filter(isLikelySpam);

  if (targetRows.length === 0) {
    console.error(`No rows to analyze. CSV: ${csvPath}`);
    process.exit(1);
  }

  const sql = postgres(connectionString, { max: 1 });

  try {
    const activities = await analyzeAccounts(sql, targetRows);

    if (jsonOutput) {
      console.log(
        JSON.stringify(
          {
            csvPath,
            includeAll,
            summary: summarizeActivities(activities),
            accounts: activities
          },
          null,
          2
        )
      );
      return;
    }

    console.log(`CSV: ${csvPath}`);
    console.log(`Mode: ${includeAll ? 'all rows' : 'likely spam only (use --all for every CSV row)'}`);
    printHumanReport(activities);
  } catch (error) {
    console.error('analyze-spam-accounts error:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
