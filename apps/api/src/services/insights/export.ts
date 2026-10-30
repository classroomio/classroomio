import { runInsightsQuery } from '@cio/db/queries/insights';
import { INSIGHTS_LIMITS } from '@cio/utils/constants/insights';
import type { TInsightsStudentExportRequest, TInsightsQuerySpec } from '@cio/utils/validation/insights';

import { ErrorCodes } from '@api/utils/errors';
import { resolveAuthorizedScope } from './authorize';
import { canonicalizeSpec } from './canonicalize';
import { toInsightsError } from './errors';
import { computeInsightsQuery, loadOrderedItems } from './query';
import { resolveInsightsRange } from './plan';
import type {
  AuthorizedInsightsScope,
  InsightsActor,
  InsightsExerciseCell,
  InsightsStudentExportResult
} from './types';

const EXERCISE_CHUNK_SIZE = 2_000;

function isExerciseState(value: unknown): value is InsightsExerciseCell['state'] {
  return value === 'not_taken' || value === 'awaiting_grade' || value === 'graded';
}

function toExerciseCell(row: Record<string, unknown>): InsightsExerciseCell {
  const score = row['best_score_pct__value'];
  const state = row['state__value'];
  const passed = row['passed__value'];

  return {
    scorePct: typeof score === 'number' ? score : null,
    state: isExerciseState(state) ? state : 'not_taken',
    passed: typeof passed === 'boolean' ? passed : null
  };
}

function textValue(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function uniqueIds(rows: ReadonlyArray<Record<string, unknown>>): string[] {
  const ids = new Set<string>();

  for (const row of rows) {
    const id = textValue(row['student_id']);
    if (id) ids.add(id);
  }

  return [...ids];
}

function chunkIds(ids: readonly string[], size: number): string[][] {
  const chunks: string[][] = [];

  for (let start = 0; start < ids.length; start += size) {
    chunks.push(ids.slice(start, start + size));
  }

  return chunks;
}

/**
 * The exercise side of an export only needs attempted cells. Rebuilding the filter list drops any caller-supplied
 * student or attempt filter, so one chunk can never widen the export to students outside the student page.
 */
function exerciseChunkSpec(spec: TInsightsQuerySpec, studentIds: readonly string[], page: number): TInsightsQuerySpec {
  const filters = spec.filters.filter((filter) => filter.field !== 'student' && filter.field !== 'is_attempted');

  return {
    ...spec,
    filters: [
      ...filters,
      { field: 'is_attempted', op: 'is_true' },
      { field: 'student', op: 'in', value: [...studentIds] }
    ],
    page,
    limit: INSIGHTS_LIMITS.maxExportRows
  };
}

/**
 * Reads every attempted exercise result for the exported students, a bounded chunk of students at a time. The cell
 * cap is checked before each write, so a course larger than the cap produces a partial document and says so rather
 * than silently dropping columns.
 */
async function collectExerciseCells(
  scope: AuthorizedInsightsScope,
  spec: TInsightsQuerySpec,
  studentIds: readonly string[]
): Promise<{ cells: InsightsStudentExportResult['cells']; truncated: boolean }> {
  const cells: InsightsStudentExportResult['cells'] = {};
  const chunks = chunkIds(studentIds, EXERCISE_CHUNK_SIZE);
  if (chunks.length === 0) return { cells, truncated: false };

  const orderedItems = await loadOrderedItems(scope, spec);
  let cellCount = 0;

  for (const [chunkIndex, chunk] of chunks.entries()) {
    let page = 1;
    let total = 0;

    while (true) {
      const chunkSpec = exerciseChunkSpec(spec, chunk, page);
      const result = await runInsightsQuery(chunkSpec, { scope, orderedItems });
      total = result.total;

      for (const row of result.rows) {
        if (cellCount >= INSIGHTS_LIMITS.maxExportExerciseCells) {
          return { cells, truncated: true };
        }

        const studentId = textValue(row['student_id']);
        const exerciseId = textValue(row['exercise_id']);
        if (!studentId || !exerciseId) continue;

        cells[studentId] ??= {};
        cells[studentId][exerciseId] = toExerciseCell(row);
        cellCount += 1;
      }

      if (page * chunkSpec.limit >= total) break;

      page += 1;
    }

    if (cellCount >= INSIGHTS_LIMITS.maxExportExerciseCells && chunkIndex < chunks.length - 1) {
      return { cells, truncated: true };
    }
  }

  return { cells, truncated: false };
}

/**
 * One student export request: the student rows plus compact exercise cells for the same students. Running both
 * reads here keeps the client from issuing a second export query that can hit the export cap on its own.
 */
export async function exportInsightsStudentsForActor(
  actor: InsightsActor,
  request: TInsightsStudentExportRequest
): Promise<InsightsStudentExportResult> {
  try {
    const scope = await resolveAuthorizedScope(actor, request.scope);
    const studentRange = await resolveInsightsRange(scope.orgId, request.studentSpec.range);
    const studentSpec = canonicalizeSpec({ ...request.studentSpec, range: studentRange });
    const students = await computeInsightsQuery(scope, studentSpec);

    if (!request.exerciseSpec) {
      return {
        students,
        cells: {},
        studentsTruncated: students.total > students.rows.length,
        exercisesTruncated: false
      };
    }

    const exerciseRange = await resolveInsightsRange(scope.orgId, request.exerciseSpec.range);
    const exerciseSpec = canonicalizeSpec({ ...request.exerciseSpec, range: exerciseRange });
    const studentIds = uniqueIds(students.rows);
    const { cells, truncated } = await collectExerciseCells(scope, exerciseSpec, studentIds);

    return {
      students,
      cells,
      studentsTruncated: students.total > students.rows.length,
      exercisesTruncated: truncated
    };
  } catch (error) {
    throw toInsightsError(error, ErrorCodes.INSIGHTS_EXPORT_FAILED);
  }
}
