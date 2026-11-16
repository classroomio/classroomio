import { db, type DbOrTxClient } from '@db/drizzle';
import type { TAnalyticsQuerySpec } from '@cio/utils/validation/analytics';

import { OperationalQueryError } from '../query-errors';
import { compileAnalyticsQuery } from './compile';
import type { AnalyticsOrderedItem, AnalyticsQueryOutput, AnalyticsRow, AnalyticsScopeRef } from './types';

const TOTAL_COLUMN = '__total';

function withoutTotal(row: Record<string, unknown>): AnalyticsRow {
  return Object.fromEntries(Object.entries(row).filter(([key]) => key !== TOTAL_COLUMN)) as AnalyticsRow;
}

/** Grouped-row total for a page past the first; zero for the first page and when the count fails. */
async function countAnalyticsTotal(
  spec: TAnalyticsQuerySpec,
  input: { scope: AnalyticsScopeRef; orderedItems: AnalyticsOrderedItem[] },
  dbClient: DbOrTxClient
): Promise<number> {
  if (spec.page <= 1) return 0;

  try {
    const { query } = compileAnalyticsQuery({ ...spec, page: 1, limit: 1 }, input);
    const result = await dbClient.execute(query);
    const rows = Array.from(result) as Array<Record<string, unknown>>;

    return Number(rows[0]?.[TOTAL_COLUMN] ?? 0);
  } catch (error) {
    console.error('countAnalyticsTotal error:', error);

    return 0;
  }
}

/**
 * Runs one analytics spec. `total` counts the grouped rows before limit and offset, including on a page past the end,
 * where a second query fetches it.
 */
export async function runAnalyticsQuery(
  spec: TAnalyticsQuerySpec,
  input: { scope: AnalyticsScopeRef; orderedItems: AnalyticsOrderedItem[] },
  dbClient: DbOrTxClient = db
): Promise<AnalyticsQueryOutput> {
  try {
    const { query, columns } = compileAnalyticsQuery(spec, input);
    const result = await dbClient.execute(query);
    const rows = Array.from(result) as Array<Record<string, unknown>>;
    const total =
      rows.length > 0 ? Number(rows[0]?.[TOTAL_COLUMN] ?? 0) : await countAnalyticsTotal(spec, input, dbClient);

    return { columns, rows: rows.map(withoutTotal), total };
  } catch (error) {
    if (error instanceof OperationalQueryError) throw error;

    console.error('runAnalyticsQuery error:', error);
    throw new Error(`Failed to run analytics query: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
