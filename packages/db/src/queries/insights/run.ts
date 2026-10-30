import { db, type DbOrTxClient } from '@db/drizzle';
import type { TInsightsQuerySpec } from '@cio/utils/validation/insights';

import { OperationalQueryError } from '../query-errors';
import { compileInsightsQuery } from './compile';
import type { InsightsOrderedItem, InsightsQueryOutput, InsightsRow, InsightsScopeRef } from './types';

const TOTAL_COLUMN = '__total';

function withoutTotal(row: Record<string, unknown>): InsightsRow {
  return Object.fromEntries(Object.entries(row).filter(([key]) => key !== TOTAL_COLUMN)) as InsightsRow;
}

/** Grouped-row total for a page past the first; zero for the first page and when the count fails. */
async function countInsightsTotal(
  spec: TInsightsQuerySpec,
  input: { scope: InsightsScopeRef; orderedItems: InsightsOrderedItem[] },
  dbClient: DbOrTxClient
): Promise<number> {
  if (spec.page <= 1) return 0;

  try {
    const { query } = compileInsightsQuery({ ...spec, page: 1, limit: 1 }, input);
    const result = await dbClient.execute(query);
    const rows = Array.from(result) as Array<Record<string, unknown>>;

    return Number(rows[0]?.[TOTAL_COLUMN] ?? 0);
  } catch (error) {
    console.error('countInsightsTotal error:', error);

    return 0;
  }
}

/**
 * Runs one insights spec. `total` counts the grouped rows before limit and offset, including on a page past the end,
 * where a second query fetches it.
 */
export async function runInsightsQuery(
  spec: TInsightsQuerySpec,
  input: { scope: InsightsScopeRef; orderedItems: InsightsOrderedItem[] },
  dbClient: DbOrTxClient = db
): Promise<InsightsQueryOutput> {
  try {
    const { query, columns } = compileInsightsQuery(spec, input);
    const result = await dbClient.execute(query);
    const rows = Array.from(result) as Array<Record<string, unknown>>;
    const total =
      rows.length > 0 ? Number(rows[0]?.[TOTAL_COLUMN] ?? 0) : await countInsightsTotal(spec, input, dbClient);

    return { columns, rows: rows.map(withoutTotal), total };
  } catch (error) {
    if (error instanceof OperationalQueryError) throw error;

    console.error('runInsightsQuery error:', error);
    throw new Error(`Failed to run insights query: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
