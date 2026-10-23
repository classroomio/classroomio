import { db, type DbOrTxClient } from '@db/drizzle';
import type { TInsightsQuerySpec } from '@cio/utils/validation/insights';

import { OperationalQueryError } from '../query-errors';
import { compileInsightsQuery } from './compile';
import type { InsightsOrderedItem, InsightsQueryOutput, InsightsRow, InsightsScopeRef } from './types';

const TOTAL_COLUMN = '__total';

function withoutTotal(row: Record<string, unknown>): InsightsRow {
  return Object.fromEntries(Object.entries(row).filter(([key]) => key !== TOTAL_COLUMN)) as InsightsRow;
}

/**
 * Runs one insights spec. `total` is the number of grouped rows before limit and offset, or 0 when the page is empty.
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
    const total = Number(rows[0]?.[TOTAL_COLUMN] ?? 0);

    return { columns, rows: rows.map(withoutTotal), total };
  } catch (error) {
    if (error instanceof OperationalQueryError) throw error;

    console.error('runInsightsQuery error:', error);
    throw new Error(`Failed to run insights query: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
