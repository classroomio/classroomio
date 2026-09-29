/**
 * Deletes organizations administered by accounts in a spam CSV, then deletes
 * those user accounts. Dry run unless --execute is passed.
 *
 * Usage:
 *   pnpm --filter @cio/db db:purge-spam-accounts
 *   pnpm --filter @cio/db db:purge-spam-accounts -- --execute
 *   pnpm --filter @cio/db db:purge-spam-accounts -- --all
 */
import 'dotenv/config';

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import postgres from 'postgres';

import { isLikelySpam, loadCsvAccounts, repoCsvPath } from './lib/spam-account-analysis';
import { deleteOrganization, deleteUserAccount } from './lib/org-deletion';

const connectionString = process.env.DATABASE_URL ?? process.env.PRIVATE_DATABASE_URL ?? '';
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '../../../..');
const shouldExecute = process.argv.includes('--execute');
const includeAll = process.argv.includes('--all');

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
const ROLE_ADMIN = 1;

if (!connectionString) {
  console.error('DATABASE_URL or PRIVATE_DATABASE_URL environment variable is required');
  process.exit(1);
}

async function main() {
  const rows = loadCsvAccounts(csvPath);
  const targets = includeAll ? rows : rows.filter(isLikelySpam);
  const sql = postgres(connectionString, { max: 1 });

  let deletedOrgs = 0;
  let deletedUsers = 0;
  let missing = 0;

  try {
    console.log(`CSV: ${csvPath}`);
    console.log(`Accounts: ${targets.length}${shouldExecute ? '' : ' (dry run)'}`);

    for (const target of targets) {
      const users = await sql`
        SELECT id, email, name FROM "user" WHERE lower(email) = ${target.email}
      `;

      if (users.length !== 1) {
        missing += 1;
        console.log(`skip ${target.email}: ${users.length} user rows`);
        continue;
      }

      const account = users[0];
      const adminOrgs = await sql`
        SELECT om.organization_id, o.name AS org_name
        FROM organizationmember om
        JOIN organization o ON o.id = om.organization_id
        WHERE om.profile_id = ${account.id}
          AND om.role_id = ${ROLE_ADMIN}
      `;

      console.log(`${account.email} admin orgs: ${adminOrgs.length}`);

      if (!shouldExecute) continue;

      for (const org of adminOrgs) {
        await deleteOrganization(sql, org.organization_id);
        deletedOrgs += 1;
        console.log(`  deleted org ${org.org_name} (${org.organization_id})`);
      }

      const userDeleted = await deleteUserAccount(sql, account.id);
      if (userDeleted) {
        deletedUsers += 1;
        console.log(`  deleted user ${account.email}`);
      } else {
        console.log(`  user ${account.email} still has references outside those orgs`);
      }
    }

    console.log('');
    console.log(
      shouldExecute
        ? `Done. Deleted ${deletedOrgs} org(s) and ${deletedUsers} user(s). Missing: ${missing}.`
        : `Dry run only. Re-run with --execute to delete. Missing: ${missing}.`
    );
  } catch (error) {
    console.error('purge-spam-accounts error:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
