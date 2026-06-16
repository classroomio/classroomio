import 'dotenv/config';

import crypto from 'node:crypto';
import fs from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres, { type Sql } from 'postgres';

const scriptPath = fileURLToPath(import.meta.url);
// .../packages/db/src/scripts/baseline.ts → migrations live at ../migrations
const migrationsDir = resolve(dirname(scriptPath), '../migrations');

type JournalEntry = { idx: number; when: number; tag: string };

/**
 * Reads the drizzle journal and computes each migration's hash the SAME way drizzle-orm's
 * `readMigrationFiles` does: sha256 of the raw `<tag>.sql` file contents, paired with the
 * journal `when` timestamp (drizzle's `created_at`).
 */
function readJournal(): { tag: string; when: number; hash: string }[] {
  const journalPath = resolve(migrationsDir, 'meta/_journal.json');
  const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8')) as { entries: JournalEntry[] };
  return journal.entries.map((entry) => {
    const sqlText = fs.readFileSync(resolve(migrationsDir, `${entry.tag}.sql`), 'utf8');
    return {
      tag: entry.tag,
      when: entry.when,
      hash: crypto.createHash('sha256').update(sqlText).digest('hex')
    };
  });
}

/**
 * Adopt an existing database into drizzle's migration history so `drizzle-kit migrate` is safe.
 *
 * drizzle applies every journal entry whose `when` is greater than the max `created_at` in
 * `drizzle.__drizzle_migrations`. A database that already has the schema but no journal — created
 * by the old `drizzle-kit push` or by the prior supabase setup — would make `migrate` re-run the
 * baseline migration and fail with `type/table "..." already exists`. Seeding the journal marks
 * those migrations as already applied so only *future* migrations run.
 *
 * No-ops when:
 *  - the journal already has rows (DB is already migrate-tracked), or
 *  - the `public` schema has no tables (fresh DB — let `migrate` create everything).
 */
export async function baselineMigrationsIfNeeded(sql: Sql): Promise<void> {
  // 1. Already migrate-tracked? Leave it alone.
  const journalTable = await sql<{ count: number }[]>`
    SELECT count(*)::int AS count
    FROM information_schema.tables
    WHERE table_schema = 'drizzle' AND table_name = '__drizzle_migrations'
  `;
  if (journalTable[0].count > 0) {
    const rows = await sql<{ count: number }[]>`SELECT count(*)::int AS count FROM drizzle.__drizzle_migrations`;
    if (rows[0].count > 0) return;
  }

  // 2. Fresh database? Let `migrate` create the schema normally.
  const publicTables = await sql<{ count: number }[]>`
    SELECT count(*)::int AS count
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  `;
  if (publicTables[0].count === 0) return;

  // 3. Existing schema, no journal → baseline current migrations as already applied.
  const entries = readJournal();
  await sql`CREATE SCHEMA IF NOT EXISTS drizzle`;
  await sql`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `;

  let inserted = 0;
  for (const entry of entries) {
    const existing = await sql<{ count: number }[]>`
      SELECT count(*)::int AS count FROM drizzle.__drizzle_migrations WHERE hash = ${entry.hash}
    `;
    if (existing[0].count === 0) {
      await sql`INSERT INTO drizzle.__drizzle_migrations ("hash", "created_at") VALUES (${entry.hash}, ${entry.when})`;
      inserted += 1;
    }
  }

  console.log(
    `Existing schema detected without migration history — baselined ${inserted} migration(s) as already applied.`
  );
}

// Allow running standalone: `pnpm --filter @cio/db db:baseline`
const invokedDirectly = Boolean(process.argv[1]) && scriptPath === resolve(process.argv[1]);
if (invokedDirectly) {
  const connectionString = process.env.DATABASE_URL ?? process.env.PRIVATE_DATABASE_URL ?? '';
  if (!connectionString) {
    console.error('DATABASE_URL or PRIVATE_DATABASE_URL environment variable is required');
    process.exit(1);
  }
  const sql = postgres(connectionString);
  baselineMigrationsIfNeeded(sql)
    .then(() => sql.end())
    .then(() => process.exit(0))
    .catch(async (error) => {
      console.error('Baseline failed:', error);
      await sql.end();
      process.exit(1);
    });
}
