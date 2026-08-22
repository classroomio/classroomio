/**
 * Backfills widget.deleted_at for widgets archived before archiveWidget()
 * stopped setting it (see the widget-restore fix). Those rows are stuck
 * out of every widget query, including the new restore/archived-list ones,
 * even though they were only ever archived, never actually deleted.
 *
 * Usage:
 *   pnpm db:backfill-archived-widgets           # dry run (default)
 *   pnpm db:backfill-archived-widgets -- --execute # apply updates
 */
import 'dotenv/config';

import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL ?? process.env.PRIVATE_DATABASE_URL ?? '';
const shouldExecute = process.argv.includes('--execute');

if (!connectionString) {
  console.error('DATABASE_URL or PRIVATE_DATABASE_URL environment variable is required');
  process.exit(1);
}

const AFFECTED_WIDGETS_SQL = `
  SELECT id, organization_id, name, updated_at
  FROM widget
  WHERE status = 'ARCHIVED'
    AND deleted_at IS NOT NULL
`;

async function main() {
  const sql = postgres(connectionString);

  try {
    const affected = await sql.unsafe(AFFECTED_WIDGETS_SQL);
    console.log(`Found ${affected.length} archived widget(s) to backfill.`);

    if (affected.length === 0) {
      console.log('Nothing to do.');
      return;
    }

    if (!shouldExecute) {
      console.log('Dry run only. Re-run with --execute to apply updates.');
      console.log('Sample (up to 10):');
      for (const row of affected.slice(0, 10)) {
        console.log(`  ${row.id}  org=${row.organization_id}  ${row.name}`);
      }
      return;
    }

    const updated = await sql`
      UPDATE widget
      SET deleted_at = NULL
      WHERE status = 'ARCHIVED'
        AND deleted_at IS NOT NULL
      RETURNING id, name
    `;

    console.log(`Updated ${updated.length} widget(s).`);
    console.log('Backfill complete.');
  } catch (error) {
    console.error('backfill-archived-widgets error:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

main();
