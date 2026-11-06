import { INSIGHTS_WIDGET_DESCRIPTIONS } from '@cio/utils/constants/insights-catalog';
import {
  activeBreakdownGroup,
  availableBreakdownGroups,
  defaultBreakdownGroup,
  defaultCourseId,
  defaultExerciseId,
  isWidgetVisible,
  resolveWidgetSpec,
  SELF_LOADING_WIDGET_IDS,
  type InsightsWidgetSelection
} from '@cio/utils/insights';
import type { TInsightsQuerySpec, TInsightsScope, TInsightsWidget } from '@cio/utils/validation/insights';

import { AppError, ErrorCodes } from '@api/utils/errors';
import { resolveAuthorizedScope } from './authorize';
import { getInsightsDashboardForScope } from './dashboards';
import { toInsightsError } from './errors';
import { resolveInsightsRange } from './plan';
import { getInsightsCourseStructure } from './structure';
import { runInsightsQueryForScope } from './query';
import type {
  AuthorizedInsightsScope,
  InsightsActor,
  InsightsCourseStructure,
  InsightsDashboard,
  InsightsDashboardSnapshot,
  InsightsSnapshotQuery,
  InsightsSnapshotWidget
} from './types';

const SNAPSHOT_QUERY_CONCURRENCY = 4;

async function assertSelectionInScope(
  dashboard: InsightsDashboard,
  orgId: string,
  courseId: string | null,
  exerciseId: string | null,
  selectedStructure: InsightsCourseStructure | undefined
): Promise<void> {
  if (courseId && !dashboard.scope.courses.some((course) => course.id === courseId)) {
    throw new AppError('Analytics scope not found', ErrorCodes.INSIGHTS_SCOPE_NOT_FOUND, 404);
  }

  if (!exerciseId) return;

  const structure = selectedStructure ?? (courseId ? await getInsightsCourseStructure(orgId, courseId) : undefined);

  if (structure && !structure.items.some((item) => item.id === exerciseId && item.type === 'EXERCISE')) {
    throw new AppError('Analytics scope not found', ErrorCodes.INSIGHTS_SCOPE_NOT_FOUND, 404);
  }
}

type SnapshotWidgetEntry = {
  widget: TInsightsWidget;
  spec: TInsightsQuerySpec;
};

/**
 * One dashboard as a single payload: authorizes once, fills the defaults the dashboard UI would use, and runs the
 * first page of every visible widget. A widget failure becomes its `errorCode`; it never fails the snapshot.
 */
export async function getInsightsDashboardSnapshotForActor(
  actor: InsightsActor,
  scope: TInsightsScope,
  query: InsightsSnapshotQuery = {}
): Promise<InsightsDashboardSnapshot> {
  try {
    const authorizedScope = await resolveAuthorizedScope(actor, scope);
    const dashboard = await getInsightsDashboardForScope(authorizedScope, { refresh: query.refresh });
    const courseId = query.courseId ?? defaultCourseId(dashboard);
    const selectedStructure = courseId ? dashboard.structures[courseId] : undefined;
    const exerciseId = query.exerciseId ?? defaultExerciseId(selectedStructure);
    await assertSelectionInScope(dashboard, authorizedScope.orgId, courseId, exerciseId, selectedStructure);
    const requestedBreakdown = query.breakdown ?? defaultBreakdownGroup(dashboard.scope);
    const range = await resolveInsightsRange(authorizedScope.orgId, query.range ?? 'all');

    const selection: InsightsWidgetSelection = {
      courseId,
      exerciseId,
      range,
      breakdown: requestedBreakdown,
      pages: {}
    };

    const availableBreakdowns = availableBreakdownGroups(dashboard.scope.type, dashboard.scope);
    const breakdown = activeBreakdownGroup(selection, availableBreakdowns);
    const snapshotSelection = { courseId, exerciseId, breakdown, range: selection.range };

    const snapshotWidgets = dashboard.widgets.filter(
      (widget) =>
        !widget.hidden && !SELF_LOADING_WIDGET_IDS.has(widget.id) && isWidgetVisible(widget, dashboard, selection)
    );
    const entries = snapshotWidgets
      .map((widget) => {
        const spec = resolveWidgetSpec(widget, selection);

        return { widget, spec };
      })
      .filter((entry): entry is SnapshotWidgetEntry => entry.spec !== null);

    const widgets = await runSnapshotWidgets(authorizedScope, actor.profileId, entries, query.refresh);
    const generatedAt = new Date().toISOString();

    return { scope: dashboard.scope, selection: snapshotSelection, generatedAt, widgets };
  } catch (error) {
    throw toInsightsError(error, ErrorCodes.INSIGHTS_DASHBOARD_FAILED);
  }
}

/**
 * Runs the widget specs through the scope-level query, at most 4 at a time, preserving dashboard order by index.
 */
async function runSnapshotWidgets(
  scope: AuthorizedInsightsScope,
  profileId: string,
  entries: SnapshotWidgetEntry[],
  refresh?: boolean
): Promise<InsightsSnapshotWidget[]> {
  const results: InsightsSnapshotWidget[] = new Array(entries.length);
  let cursor = 0;

  const runNext = async (): Promise<void> => {
    while (cursor < entries.length) {
      const index = cursor;
      cursor += 1;

      const entry = entries[index];
      const description = INSIGHTS_WIDGET_DESCRIPTIONS[entry.widget.id] ?? '';

      try {
        const queryResult = await runInsightsQueryForScope(
          scope,
          { scope: { type: scope.type, id: scope.id }, spec: entry.spec, refresh },
          { profileId }
        );
        const widgetResult = { columns: queryResult.columns, rows: queryResult.rows, total: queryResult.total };
        const widgetSpec = { ...entry.spec, range: queryResult.range };

        results[index] = {
          id: entry.widget.id,
          viz: entry.widget.viz,
          description,
          spec: widgetSpec,
          result: widgetResult,
          errorCode: null
        };
      } catch (error) {
        const queryError = toInsightsError(error, ErrorCodes.INSIGHTS_QUERY_FAILED);

        results[index] = {
          id: entry.widget.id,
          viz: entry.widget.viz,
          description,
          spec: entry.spec,
          result: null,
          errorCode: queryError.code
        };
      }
    }
  };

  const workerCount = Math.min(SNAPSHOT_QUERY_CONCURRENCY, entries.length);
  const workers = Array.from({ length: workerCount }, () => runNext());

  await Promise.all(workers);

  return results;
}
