import { db } from '../drizzle';
import { sql, type SQL } from 'drizzle-orm';

/**
 * Rewrites stored media URLs from an old public bucket host to a new one.
 *
 * Only rows that contain the old host are touched, so the script is idempotent
 * and safe to re-run. The path after the host is left untouched, so the new
 * host must serve the same object keys (e.g. a custom domain pointed at the
 * same R2 bucket).
 *
 * Usage:
 *   OLD_BUCKET_DOMAIN=https://pub-xxxx.r2.dev \
 *   NEW_BUCKET_DOMAIN=https://img.cdn.example.com \
 *   pnpm --filter @cio/db db:rewrite-media-host
 *
 * NEW_BUCKET_DOMAIN defaults to CLOUDFLARE_IMAGE_BUCKET_DOMAIN if unset.
 * The old host may also be passed as --from=<url> and the new as --to=<url>.
 *
 * Pass --dry-run to report how many rows would change per table without
 * writing anything.
 */

function readArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));

  return match?.slice(prefix.length);
}

function normalizeHost(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

const dryRun = process.argv.includes('--dry-run');
const oldDomainRaw = readArg('from') || process.env.OLD_BUCKET_DOMAIN;
const newDomainRaw = readArg('to') || process.env.NEW_BUCKET_DOMAIN || process.env.CLOUDFLARE_IMAGE_BUCKET_DOMAIN;

if (!oldDomainRaw || !newDomainRaw) {
  console.error(
    'Missing domains. Provide OLD_BUCKET_DOMAIN (or --from=) and NEW_BUCKET_DOMAIN/CLOUDFLARE_IMAGE_BUCKET_DOMAIN (or --to=).'
  );
  process.exit(1);
}

const OLD_HOST = normalizeHost(oldDomainRaw);
const NEW_HOST = normalizeHost(newDomainRaw);

if (OLD_HOST === NEW_HOST) {
  console.error('Old and new hosts are identical; nothing to do.');
  process.exit(1);
}

type Column = { name: string; isArray?: boolean };

// table name -> columns holding a full URL (dedicated columns + rich-text bodies)
const TARGETS: Array<{ table: string; columns: Column[] }> = [
  { table: 'user', columns: [{ name: 'image' }] },
  { table: 'profile', columns: [{ name: 'avatar_url' }] },
  { table: 'course', columns: [{ name: 'logo' }, { name: 'banner_image' }] },
  {
    table: 'assets',
    columns: [{ name: 'thumbnail_url' }, { name: 'thumbnail_candidates', isArray: true }]
  },
  { table: 'organization', columns: [{ name: 'avatar_url' }, { name: 'favicon' }] },
  { table: 'program', columns: [{ name: 'cover_image' }] },
  { table: 'lesson_language', columns: [{ name: 'content' }] },
  { table: 'course_newsfeed', columns: [{ name: 'content' }] },
  { table: 'course_newsfeed_comment', columns: [{ name: 'content' }] },
  { table: 'program_newsfeed', columns: [{ name: 'content' }] },
  { table: 'program_newsfeed_comment', columns: [{ name: 'content' }] },
  { table: 'community_question', columns: [{ name: 'body' }] }
];

const LIKE_PATTERN = '%' + OLD_HOST + '%';

function columnMatch(column: Column): SQL {
  const id = sql.identifier(column.name);

  if (column.isArray) {
    return sql`array_to_string(${id}, ',') LIKE ${LIKE_PATTERN}`;
  }

  return sql`${id} LIKE ${LIKE_PATTERN}`;
}

function columnReplace(column: Column): SQL {
  const id = sql.identifier(column.name);

  if (column.isArray) {
    return sql`${id} = (
      SELECT coalesce(array_agg(replace(elem, ${OLD_HOST}, ${NEW_HOST}) ORDER BY ord), '{}'::text[])
      FROM unnest(${id}) WITH ORDINALITY AS t(elem, ord)
    )`;
  }

  return sql`${id} = replace(${id}, ${OLD_HOST}, ${NEW_HOST})`;
}

function matchClause(columns: Column[]): SQL {
  return sql.join(
    columns.map((column) => columnMatch(column)),
    sql` OR `
  );
}

async function dryRun_() {
  console.log(`DRY RUN — no changes will be made.\n  from: ${OLD_HOST}\n  to:   ${NEW_HOST}\n`);

  const counts: Record<string, number> = {};
  let total = 0;

  for (const { table, columns } of TARGETS) {
    const result = await db.execute(
      sql`SELECT count(*)::int AS count FROM ${sql.identifier(table)} WHERE ${matchClause(columns)}`
    );
    const rows = result as unknown as Array<{ count: number }>;
    const count = rows[0]?.count ?? 0;

    counts[`${table} (${columns.map((column) => column.name).join(', ')})`] = count;
    total += count;
  }

  console.log('Rows that WOULD be updated per table/column:');
  console.table(counts);
  console.log(`Total rows that would change: ${total}`);
  process.exit(0);
}

async function applyRewrite() {
  console.log(`Rewriting media host:\n  from: ${OLD_HOST}\n  to:   ${NEW_HOST}\n`);

  const totals = await db.transaction(async (tx) => {
    const counts: Record<string, number> = {};

    for (const { table, columns } of TARGETS) {
      const setClause = sql.join(
        columns.map((column) => columnReplace(column)),
        sql`, `
      );

      const result = await tx.execute(
        sql`UPDATE ${sql.identifier(table)} SET ${setClause} WHERE ${matchClause(columns)}`
      );

      // postgres-js returns affected-row count on `.count` for non-returning queries
      counts[table] = (result as unknown as { count?: number }).count ?? 0;
    }

    return counts;
  });

  console.log('Rewrite completed. Rows updated per table:');
  console.table(totals);
  process.exit(0);
}

async function rewriteMediaHost() {
  try {
    if (dryRun) {
      await dryRun_();
      return;
    }

    await applyRewrite();
  } catch (error) {
    console.error('rewriteMediaHost failed:', error);
    process.exit(1);
  }
}

rewriteMediaHost();
