import { INSIGHTS_LIMITS, INSIGHTS_STATUSES, type TInsightsStatus } from '@cio/utils/constants/insights';
import { studentsTableSpec, type InsightsStudentTableSort } from '@cio/utils/insights';
import type { InsightsRow } from '@cio/db/queries/insights';
import type { TInsightsScope } from '@cio/utils/validation/insights';

import { ErrorCodes } from '@api/utils/errors';
import { resolveAuthorizedScope } from './authorize';
import { toInsightsError } from './errors';
import { runInsightsQueryForScope } from './query';
import type {
  AuthorizedInsightsScope,
  InsightsActor,
  InsightsStudentRow,
  InsightsStudentsQuery,
  InsightsStudentsResult
} from './types';

/**
 * Lists the students of a scope with their insights, from the one `studentsTableSpec` the dashboard table runs.
 */
export async function listInsightsStudentsForActor(
  actor: InsightsActor,
  scope: TInsightsScope,
  query: InsightsStudentsQuery = {}
): Promise<InsightsStudentsResult> {
  try {
    const authorizedScope = await resolveAuthorizedScope(actor, scope);

    return await listInsightsStudentsForScope(authorizedScope, query, { profileId: actor.profileId });
  } catch (error) {
    throw toInsightsError(error, ErrorCodes.INSIGHTS_QUERY_FAILED);
  }
}

/**
 * The same student list inside an already-authorized scope, without re-authorizing.
 */
export async function listInsightsStudentsForScope(
  scope: AuthorizedInsightsScope,
  query: InsightsStudentsQuery = {},
  options: { profileId?: string } = {}
): Promise<InsightsStudentsResult> {
  try {
    const page = Math.max(1, Math.trunc(query.page ?? 1));
    const limit = Math.min(
      Math.max(1, Math.trunc(query.limit ?? INSIGHTS_LIMITS.studentsPageSize)),
      INSIGHTS_LIMITS.maxRows
    );
    const spec = studentsTableSpec({
      courseId: query.courseId ?? null,
      search: query.search,
      status: query.status ?? null,
      isOverdue: query.isOverdue ?? null,
      sort: query.sort ?? null,
      dir: query.dir,
      page,
      limit
    });
    const result = await runInsightsQueryForScope(
      scope,
      { scope: { type: scope.type, id: scope.id }, spec },
      { profileId: options.profileId }
    );
    const rows = result.rows.map((row) => mapStudentRow(row)).filter((row): row is InsightsStudentRow => row !== null);

    return { rows, page, limit, total: result.total };
  } catch (error) {
    throw toInsightsError(error, ErrorCodes.INSIGHTS_QUERY_FAILED);
  }
}

function cellString(row: InsightsRow, key: string): string | null {
  const value = row[key];
  if (typeof value !== 'string') return null;

  return value.length > 0 ? value : null;
}

function cellNumber(row: InsightsRow, key: string): number | null {
  const value = row[key];

  return typeof value === 'number' ? value : null;
}

function cellBoolean(row: InsightsRow, key: string): boolean | null {
  const value = row[key];

  return typeof value === 'boolean' ? value : null;
}

function studentStatus(value: string | null): TInsightsStatus | null {
  return INSIGHTS_STATUSES.find((status) => status === value) ?? null;
}

function mapStudentRow(row: InsightsRow): InsightsStudentRow | null {
  const id = cellString(row, 'student_id');
  if (!id) return null;

  const name = cellString(row, 'name__value') ?? cellString(row, 'student_label');
  const status = studentStatus(cellString(row, 'status__value'));

  return {
    id,
    name,
    email: cellString(row, 'email__value'),
    avatarUrl: cellString(row, 'avatar_url__value'),
    progressPct: cellNumber(row, 'overall_progress_pct__value'),
    avgScorePct: cellNumber(row, 'avg_score_pct__value'),
    coursesCompleted: cellNumber(row, 'courses_completed__value'),
    coursesTotal: cellNumber(row, 'courses_total__value'),
    videoPct: cellNumber(row, 'video_pct__value'),
    attendancePct: cellNumber(row, 'attendance_pct__value'),
    certificates: cellNumber(row, 'certificates__value'),
    lastLoginAt: cellString(row, 'last_login_at__value'),
    isOverdue: cellBoolean(row, 'is_overdue__value'),
    status,
    nowAt: cellString(row, 'now_at_title__value')
  };
}
