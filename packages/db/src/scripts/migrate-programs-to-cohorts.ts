/**
 * One-time data migration: copy all rows from legacy `program*` tables into the new
 * `cohort*` tables while preserving primary keys and relationships.
 *
 * Prerequisites:
 * 1. Run Drizzle migrations through `0002_majestic_masked_marvel` so cohort tables exist.
 * 2. Back up the database before running in production.
 *
 * The legacy `program*` tables are left untouched for rollback safety.
 * Re-running clears all cohort tables first, then copies a fresh snapshot from program tables.
 */

import { sql } from 'drizzle-orm';

import { db } from '../drizzle';

type TableCopy = {
  label: string;
  source: string;
  target: string;
  columnMap?: Record<string, string>;
  /** Cast legacy PROGRAM_* enum columns to matching COHORT_* enum types. */
  enumCasts?: Record<string, string>;
};

const TABLE_COPIES: TableCopy[] = [
  {
    label: 'cohort',
    source: 'program',
    target: 'cohort',
    enumCasts: { status: 'COHORT_STATUS' }
  },
  {
    label: 'cohort_course',
    source: 'program_course',
    target: 'cohort_course',
    columnMap: { program_id: 'cohort_id' }
  },
  {
    label: 'cohort_member',
    source: 'program_member',
    target: 'cohort_member',
    columnMap: { program_id: 'cohort_id' }
  },
  {
    label: 'cohort_newsfeed',
    source: 'program_newsfeed',
    target: 'cohort_newsfeed',
    columnMap: { program_id: 'cohort_id' }
  },
  {
    label: 'cohort_newsfeed_comment',
    source: 'program_newsfeed_comment',
    target: 'cohort_newsfeed_comment',
    columnMap: { program_newsfeed_id: 'cohort_newsfeed_id' }
  },
  {
    label: 'cohort_goal',
    source: 'program_goal',
    target: 'cohort_goal',
    columnMap: { program_id: 'cohort_id' },
    enumCasts: {
      type: 'COHORT_GOAL_TYPE',
      deadline_kind: 'COHORT_GOAL_DEADLINE_KIND',
      status: 'COHORT_GOAL_STATUS'
    }
  },
  {
    label: 'cohort_goal_assignment',
    source: 'program_goal_assignment',
    target: 'cohort_goal_assignment',
    columnMap: { program_member_id: 'cohort_member_id' },
    enumCasts: { status: 'COHORT_GOAL_ASSIGNMENT_STATUS' }
  }
];

/** Child tables first; TRUNCATE … CASCADE clears the full cohort graph. */
const COHORT_TABLES = [
  'cohort_goal_assignment',
  'cohort_newsfeed_comment',
  'cohort_newsfeed',
  'cohort_goal',
  'cohort_course',
  'cohort_member',
  'cohort'
] as const;

async function clearCohortTables(): Promise<void> {
  const tableList = COHORT_TABLES.map((table) => `"${table}"`).join(', ');

  await db.execute(sql.raw(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`));

  console.log(`  Cleared cohort tables: ${COHORT_TABLES.join(', ')}`);
}

async function getTableColumns(tableName: string): Promise<string[]> {
  const result = await db.execute<{ column_name: string }>(sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ${tableName}
    ORDER BY ordinal_position
  `);

  const rows = Array.isArray(result) ? result : ((result as { rows?: { column_name: string }[] }).rows ?? []);

  return rows.map((row) => row.column_name);
}

async function getTableRowCount(tableName: string): Promise<number> {
  const result = await db.execute<{ count: number }>(sql.raw(`SELECT COUNT(*)::int AS count FROM "${tableName}"`));
  const rows = Array.isArray(result) ? result : ((result as { rows?: { count: number }[] }).rows ?? []);

  return Number(rows[0]?.count ?? 0);
}

async function copyTable({ label, source, target, columnMap = {}, enumCasts = {} }: TableCopy): Promise<number> {
  const sourceColumns = await getTableColumns(source);
  const targetColumns = await getTableColumns(target);

  if (sourceColumns.length === 0) {
    throw new Error(`Source table "${source}" not found or has no columns`);
  }

  if (targetColumns.length === 0) {
    throw new Error(`Target table "${target}" not found or has no columns`);
  }

  const insertColumns = sourceColumns.map((column) => columnMap[column] ?? column);
  const missingTargetColumns = insertColumns.filter((column) => !targetColumns.includes(column));

  if (missingTargetColumns.length > 0) {
    throw new Error(`Target table "${target}" is missing columns: ${missingTargetColumns.join(', ')}`);
  }

  const selectList = sourceColumns
    .map((column) => {
      const outputColumn = columnMap[column] ?? column;
      const sourceExpr = enumCasts[column] ? `"${column}"::text::"${enumCasts[column]}"` : `"${column}"`;

      return outputColumn === column ? sourceExpr : `${sourceExpr} AS "${outputColumn}"`;
    })
    .join(', ');

  const insertList = insertColumns.map((column) => `"${column}"`).join(', ');

  const sourceCount = await getTableRowCount(source);

  await db.execute(
    sql.raw(`
    INSERT INTO "${target}" (${insertList})
    SELECT ${selectList}
    FROM "${source}"
  `)
  );

  const copiedCount = await getTableRowCount(target);

  if (sourceCount !== copiedCount) {
    throw new Error(
      `Row count mismatch for ${label}: expected ${sourceCount} from "${source}", found ${copiedCount} in "${target}"`
    );
  }

  console.log(`  ${label}: copied ${copiedCount} row(s)`);
  return copiedCount;
}

async function migrateInviteMetadata(): Promise<number> {
  const countResult = await db.execute<{ count: number }>(sql`
    SELECT COUNT(*)::int AS count
    FROM organization_invite
    WHERE metadata ? 'programIds'
       OR metadata ? 'program_ids'
  `);
  const countRows = Array.isArray(countResult)
    ? countResult
    : ((countResult as { rows?: { count: number }[] }).rows ?? []);
  const invitesToUpdate = Number(countRows[0]?.count ?? 0);

  if (invitesToUpdate === 0) {
    console.log('  organization_invite metadata: updated 0 row(s)');
    return 0;
  }

  await db.execute(sql`
    UPDATE organization_invite
    SET metadata = (
      metadata
      - 'programIds'
      - 'program_ids'
    ) || jsonb_build_object(
      'cohortIds',
      COALESCE(metadata->'cohortIds', metadata->'programIds', metadata->'program_ids', '[]'::jsonb)
    )
    WHERE metadata ? 'programIds'
       OR metadata ? 'program_ids'
  `);

  console.log(`  organization_invite metadata: updated ${invitesToUpdate} row(s)`);
  return invitesToUpdate;
}

async function migrate() {
  console.log('Starting program → cohort data migration...\n');

  console.log('Clearing existing cohort data...');
  await clearCohortTables();
  console.log('');

  let totalCopied = 0;

  for (const tableCopy of TABLE_COPIES) {
    totalCopied += await copyTable(tableCopy);
  }

  console.log('');
  await migrateInviteMetadata();

  console.log(`\nDone. Copied ${totalCopied} total row(s) into cohort tables.`);
  console.log('Legacy program tables were not modified or dropped.');
}

migrate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('migrate-programs-to-cohorts failed:', error);
    process.exit(1);
  });
