import 'dotenv/config';

import crypto from 'node:crypto';
import fs from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const migrationsDir = resolve(dirname(fileURLToPath(import.meta.url)), '../migrations');

interface JournalEntry {
  idx: number;
  when: number;
  tag: string;
}

/** Same hash drizzle-orm records: sha256 of the raw `<tag>.sql` contents. */
export function readJournal(): { tag: string; when: number; hash: string }[] {
  const journalPath = resolve(migrationsDir, 'meta/_journal.json');
  const { entries } = JSON.parse(fs.readFileSync(journalPath, 'utf8')) as { entries: JournalEntry[] };

  return entries.map((entry) => ({
    tag: entry.tag,
    when: entry.when,
    hash: crypto
      .createHash('sha256')
      .update(fs.readFileSync(resolve(migrationsDir, `${entry.tag}.sql`), 'utf8'))
      .digest('hex')
  }));
}

/**
 * Hashes recorded in `drizzle.__drizzle_migrations`.
 *
 * A missing ledger means "nothing applied yet" and is reported as an empty
 * array. Every other failure — auth, TLS, host — is rethrown, because treating
 * it as an empty ledger would make a broken connection look like a fresh
 * database and let a comparison pass for the wrong reason.
 */
export async function readAppliedHashes(sql: postgres.Sql): Promise<string[]> {
  try {
    const rows = await sql<{ hash: string }[]>`
      SELECT hash FROM drizzle.__drizzle_migrations ORDER BY created_at
    `;

    return rows.map((row) => row.hash);
  } catch (error) {
    const code = (error as { code?: string }).code;
    // 42P01 undefined_table, 3F000 invalid_schema_name
    if (code === '42P01' || code === '3F000') return [];

    throw error;
  }
}

export interface LedgerComparison {
  applied: number;
  expected: number;
  missing: string[];
  unknown: string[];
}

/** Compares by hash, not by count: equal totals can still be different migrations. */
export function compareLedger(journal: ReturnType<typeof readJournal>, appliedHashes: string[]): LedgerComparison {
  const appliedSet = new Set(appliedHashes);
  const journalSet = new Set(journal.map((entry) => entry.hash));

  return {
    applied: appliedHashes.length,
    expected: journal.length,
    missing: journal.filter((entry) => !appliedSet.has(entry.hash)).map((entry) => entry.tag),
    unknown: appliedHashes.filter((hash) => !journalSet.has(hash))
  };
}

const invokedDirectly = fileURLToPath(import.meta.url) === resolve(process.argv[1] ?? '');

if (invokedDirectly) {
  const mode = process.argv[2] ?? 'report';
  const connectionString = process.env.DATABASE_URL ?? process.env.PRIVATE_DATABASE_URL ?? '';

  if (!connectionString) {
    console.error('DATABASE_URL or PRIVATE_DATABASE_URL is required');
    process.exit(1);
  }

  const sql = postgres(connectionString, { max: 1 });

  try {
    const journal = readJournal();
    const applied = await readAppliedHashes(sql);
    const result = compareLedger(journal, applied);

    if (mode === 'count') {
      process.stdout.write(String(result.applied));
    } else {
      console.log(`applied: ${result.applied}  expected: ${result.expected}`);

      if (result.missing.length > 0) console.log('not applied:', result.missing.join(', '));

      // A recorded hash with no journal entry means a migration file was edited
      // or removed after it ran. Worth surfacing, but it does not mean the
      // pending migrations failed, so it should not fail a deploy.
      if (result.unknown.length > 0) {
        console.warn(`warning: ${result.unknown.length} recorded migration(s) no longer match a file in the journal`);
      }

      if (mode === 'verify' && result.missing.length > 0) {
        console.error('\nSome migrations in the journal were not applied.');
        process.exit(1);
      }
    }
  } finally {
    await sql.end();
  }
}
