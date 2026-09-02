/**
 * Exports every profile that is an ADMIN or TUTOR in at least one organization
 * to a CSV, for manual re-import into UserJot (feedback widget members).
 *
 * Only org managers belong in UserJot — student-only users must not be uploaded.
 *
 * Usage:
 *   pnpm db:export-userjot-managers
 *   pnpm db:export-userjot-managers -- --out ~/userjot-managers.csv
 *
 * Env: DATABASE_URL or PRIVATE_DATABASE_URL
 */
import 'dotenv/config';

import { writeFileSync } from 'node:fs';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL ?? process.env.PRIVATE_DATABASE_URL ?? '';

if (!connectionString) {
  console.error('DATABASE_URL or PRIVATE_DATABASE_URL environment variable is required');
  process.exit(1);
}

const args = process.argv.slice(2);
const outIndex = args.indexOf('--out');
const outFilePath = outIndex !== -1 && args[outIndex + 1] ? args[outIndex + 1] : 'userjot-managers.csv';

// ROLE ids: 1 = ADMIN, 2 = TUTOR (see @cio/utils constants ROLE)
const MANAGER_ROLE_IDS = [1, 2];

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';

  const text = String(value);

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

async function main() {
  const sql = postgres(connectionString);

  try {
    const managers = await sql`
      SELECT
        p.id,
        p.email,
        p.fullname,
        p.avatar_url,
        (
          SELECT string_agg(DISTINCT r.type, ',')
          FROM organizationmember om2
          JOIN role r ON r.id = om2.role_id
          WHERE om2.profile_id = p.id AND om2.role_id IN ${sql(MANAGER_ROLE_IDS)}
        ) AS roles
      FROM profile p
      WHERE p.email IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM organizationmember om
          WHERE om.profile_id = p.id AND om.role_id IN ${sql(MANAGER_ROLE_IDS)}
        )
      ORDER BY p.fullname
    `;

    if (managers.length === 0) {
      console.log('No org managers found — nothing to export.');
      return;
    }

    const header = 'external_id,email,fullname,first_name,last_name,avatar_url,roles';
    const rows = managers.map((manager) => {
      const [firstName, ...rest] = (manager.fullname ?? '').trim().split(/\s+/);

      return [
        manager.id,
        manager.email,
        manager.fullname,
        firstName ?? '',
        rest.join(' '),
        manager.avatar_url,
        manager.roles
      ]
        .map(csvEscape)
        .join(',');
    });

    writeFileSync(outFilePath, [header, ...rows].join('\n') + '\n');

    console.log(`Exported ${managers.length} org manager(s) to ${outFilePath}`);
    console.log('Upload this CSV to UserJot (Settings → Members → Import).');
  } catch (error) {
    console.error('export-userjot-managers error:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

main();
