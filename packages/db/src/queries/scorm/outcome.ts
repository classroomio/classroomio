import { sql, type SQL } from '@db/drizzle';
import { db, type DbOrTxClient } from '@db/drizzle';

export interface ScormTryOutcomeInput {
  cmi: SQL;
  format: SQL;
  masteryScore: SQL;
  scaledPassingScore: SQL;
}

export interface ScormTryOutcomeColumns {
  completion: SQL<string>;
  success: SQL<string>;
  scaledScore: SQL<number | null>;
  hasPassMark: SQL<boolean>;
}

function safeNumericText(value: SQL): SQL<number | null> {
  return sql<
    number | null
  >`CASE WHEN TRIM(${value}) ~ '^-?([0-9]+(\\.[0-9]*)?|\\.[0-9]+)([eE][+-]?[0-9]+)?$' THEN TRIM(${value})::numeric ELSE NULL END`;
}

/**
 * Mirrors `moduleOutcomeFromCmi` in `@cio/activity-packages` as SQL over a
 * stored module try. `format` is the package version format: `scorm12` takes
 * the 1.2 branch, every other version the 2004 branch. Status strings match
 * case-insensitively with missing values treated as unset, exactly like the
 * TypeScript mapping. Keep the two in sync; the shared fixture test proves it.
 */
export function scormTryOutcomeColumns(input: ScormTryOutcomeInput): ScormTryOutcomeColumns {
  const { cmi, format, masteryScore, scaledPassingScore } = input;
  const is12 = sql<boolean>`${format} = 'scorm12'`;

  const status12 = sql<string>`COALESCE(lower(${cmi}->'core'->>'lesson_status'), '')`;
  const completion12 = sql<string>`CASE ${status12} WHEN 'passed' THEN 'completed' WHEN 'completed' THEN 'completed' WHEN 'failed' THEN 'completed' WHEN 'incomplete' THEN 'incomplete' WHEN 'browsed' THEN 'incomplete' WHEN 'not attempted' THEN 'not_attempted' WHEN '' THEN 'not_attempted' ELSE 'unknown' END`;
  const success12 = sql<string>`CASE ${status12} WHEN 'passed' THEN 'passed' WHEN 'failed' THEN 'failed' ELSE 'unknown' END`;

  const completionValue = sql<string>`COALESCE(lower(${cmi}->>'completion_status'), '')`;
  const successValue = sql<string>`COALESCE(lower(${cmi}->>'success_status'), '')`;
  const completion2004 = sql<string>`CASE ${completionValue} WHEN 'completed' THEN 'completed' WHEN 'incomplete' THEN 'incomplete' WHEN 'not attempted' THEN 'not_attempted' WHEN '' THEN 'not_attempted' ELSE 'unknown' END`;
  const success2004 = sql<string>`CASE ${successValue} WHEN 'passed' THEN 'passed' WHEN 'failed' THEN 'failed' ELSE 'unknown' END`;

  const completion = sql<string>`CASE WHEN ${is12} THEN (${completion12}) ELSE (${completion2004}) END`;
  const success = sql<string>`CASE WHEN ${is12} THEN (${success12}) ELSE (${success2004}) END`;
  const hasPassMark = sql<boolean>`CASE WHEN ${is12} THEN (${masteryScore} IS NOT NULL) ELSE (${scaledPassingScore} IS NOT NULL) END`;

  const raw12 = safeNumericText(sql<string>`${cmi}->'core'->'score'->>'raw'`);
  const min12 = safeNumericText(sql<string>`${cmi}->'core'->'score'->>'min'`);
  const max12 = safeNumericText(sql<string>`${cmi}->'core'->'score'->>'max'`);
  const scaled12 = sql<
    number | null
  >`CASE WHEN ${raw12} IS NULL THEN NULL WHEN ${min12} IS NOT NULL AND ${max12} IS NOT NULL AND ${max12} > ${min12} THEN (${raw12} - ${min12}) / (${max12} - ${min12}) ELSE ${raw12} / 100 END`;
  const scaled2004 = safeNumericText(sql<string>`${cmi}->'score'->>'scaled'`);
  const scaledScore = sql<number | null>`CASE WHEN ${is12} THEN (${scaled12}) ELSE (${scaled2004}) END`;

  return { completion, success, scaledScore, hasPassMark };
}

export interface EvaluateTryOutcomeInput {
  cmi: Record<string, unknown>;
  format: string;
  masteryScore: number | string | null;
  scaledPassingScore: number | null;
}

export interface EvaluatedTryOutcome {
  completion: string;
  success: string;
  scaledScore: number | null;
  hasPassMark: boolean;
}

/**
 * Evaluates one module outcome through the SQL mapping for ad-hoc CMI. The
 * shared fixture test runs this against `moduleOutcomeFromCmi` on the same
 * samples so the two mappings can never drift.
 */
export async function evaluateTryOutcome(
  input: EvaluateTryOutcomeInput,
  dbClient: DbOrTxClient = db
): Promise<EvaluatedTryOutcome> {
  try {
    const columns = scormTryOutcomeColumns({
      cmi: sql<typeof input.cmi>`${JSON.stringify(input.cmi)}::jsonb`,
      format: sql<string>`${input.format}::text`,
      masteryScore: sql<number | string | null>`${input.masteryScore}::numeric`,
      scaledPassingScore: sql<number | null>`${input.scaledPassingScore}::numeric`
    });

    const [row] = await dbClient
      .select({
        completion: columns.completion,
        success: columns.success,
        scaledScore: columns.scaledScore,
        hasPassMark: columns.hasPassMark
      })
      .from(sql`(SELECT 1) AS "outcome_probe"`);

    if (!row) throw new Error('Outcome probe returned no row');

    return {
      completion: String(row.completion),
      success: String(row.success),
      scaledScore: row.scaledScore === null ? null : Number(row.scaledScore),
      hasPassMark: row.hasPassMark === true
    };
  } catch (error) {
    console.error('evaluateTryOutcome error:', error);
    throw new Error(
      `Failed to evaluate SCORM try outcome: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
