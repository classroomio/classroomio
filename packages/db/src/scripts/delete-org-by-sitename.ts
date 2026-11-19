/**
 * Deletes an organization (academy) identified by its site name, and ALL
 * associated data (courses, lessons, exercises, submissions, groupmembers,
 * tags, assets, widgets, programs, cohorts, AI data, analytics, etc.).
 *
 * Unlike db:delete-org (which targets every org a user is admin of and then
 * removes the user account), this script deletes exactly one org and leaves
 * all user accounts intact — members are removed from the org only.
 *
 * Usage:
 *   pnpm --filter @cio/db db:delete-org-by-sitename -- --site-name udemy-test                # dry run (default)
 *   pnpm --filter @cio/db db:delete-org-by-sitename -- --site-name udemy-test --execute      # permanent delete
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

const siteName = readArg('--site-name');

if (!connectionString) {
  console.error('DATABASE_URL or PRIVATE_DATABASE_URL environment variable is required');
  process.exit(1);
}

if (!siteName) {
  console.error('Usage: pnpm --filter @cio/db db:delete-org-by-sitename -- --site-name <site-name> [--execute]');
  process.exit(1);
}

async function main() {
  const sql = postgres(connectionString);

  try {
    // 1. Find the organization by site name (case-insensitive)
    const orgs = await sql`
      SELECT id, name, "siteName" FROM organization WHERE lower("siteName") = lower(${siteName})
    `;

    if (orgs.length === 0) {
      console.error(`No organization found with site name '${siteName}'`);
      process.exit(1);
    }

    if (orgs.length > 1) {
      console.error(
        `${orgs.length} organizations match site name '${siteName}': ${orgs.map((o) => o.id).join(', ')}. Resolve the ambiguity before running this script.`
      );
      process.exit(1);
    }

    const org = orgs[0];
    console.log(`Found organization ${org.name} (${org.id}) with site name '${org.siteName}'`);

    const counts = await countOrgData(sql, org.id);

    if (!shouldExecute) {
      console.log('\n--- DRY RUN: would delete the following ---\n');
      printCounts(counts);
      console.log('\nDry run only. Re-run with --execute to permanently delete.');
      return;
    }

    console.log('\nDeleting organization ...');
    await deleteOrganization(sql, org.id);
    console.log(`  ✓ Organization "${org.name}" and all associated data deleted.`);
    console.log('\nDone.');
  } catch (error) {
    console.error('delete-org-by-sitename error:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
