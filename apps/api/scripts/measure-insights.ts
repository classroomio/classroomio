import 'dotenv/config';

import { performance } from 'node:perf_hooks';

import { asc, eq, sql } from 'drizzle-orm';

import {
  compileInsightsQuery,
  runInsightsQuery,
  requiresOrderedItems,
  type InsightsOrderedItem
} from '@cio/db/queries/insights';
import { cohort, cohortCourse, course, db, exercise, groupmember, organization } from '@db/drizzle';
import { INSIGHTS_PLACEHOLDERS, type TInsightsScopeType } from '@cio/utils/constants/insights';
import type { TInsightsFilter, TInsightsQuerySpec, TInsightsWidget } from '@cio/utils/validation/insights';

import { INSIGHTS_PRESETS } from '@api/services/insights/presets';
import { getInsightsCourseStructure, toOrderedItems } from '@api/services/insights/structure';

const ORG_SITE_NAME = process.env.INSIGHTS_LOAD_ORG ?? 'insights-load';
const RUNS = Number(process.env.INSIGHTS_BENCHMARK_RUNS ?? 5);
const BUDGET_MS: Record<TInsightsScopeType, number> = { cohort: 1000, course: 1000, org: 1500 };

type Scope = { orgId: string; type: TInsightsScopeType; id: string };
type Selection = { courseId: string | null; studentId: string | null; exerciseId: string | null };

function fillPlaceholder(filter: TInsightsFilter, selection: Selection): TInsightsFilter | null {
  if (filter.value === INSIGHTS_PLACEHOLDERS.course) {
    return selection.courseId ? { ...filter, value: selection.courseId } : null;
  }
  if (filter.value === INSIGHTS_PLACEHOLDERS.student) {
    return selection.studentId ? { ...filter, value: selection.studentId } : null;
  }
  if (filter.value === INSIGHTS_PLACEHOLDERS.exercise) {
    return selection.exerciseId ? { ...filter, value: selection.exerciseId } : null;
  }

  return filter;
}

function resolveSpec(widget: TInsightsWidget, selection: Selection): TInsightsQuerySpec | null {
  const filters: TInsightsFilter[] = [];

  for (const filter of widget.spec.filters) {
    const filled = fillPlaceholder(filter, selection);
    if (!filled) return null;

    filters.push(filled);
  }

  const hasCourseFilter = filters.some((filter) => filter.field === 'course');
  if (widget.courseMode === 'any' && selection.courseId && !hasCourseFilter) {
    filters.push({ field: 'course', op: 'eq', value: selection.courseId });
  }

  return { ...widget.spec, filters };
}

function percentile(values: number[], value: number): number {
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.ceil(value * sorted.length) - 1);

  return sorted[index] ?? 0;
}

async function loadOrderedItems(
  scope: Scope,
  spec: TInsightsQuerySpec,
  courseIds: string[]
): Promise<InsightsOrderedItem[]> {
  if (!requiresOrderedItems(spec) || scope.type === 'org') return [];

  const courseFilter = spec.filters.find((filter) => filter.field === 'course');
  const requested = courseFilter?.value
    ? new Set(Array.isArray(courseFilter.value) ? courseFilter.value.map(String) : [String(courseFilter.value)])
    : null;
  const selectedCourses = requested ? courseIds.filter((courseId) => requested.has(courseId)) : courseIds;
  const structures = await Promise.all(
    selectedCourses.map((courseId) => getInsightsCourseStructure(scope.orgId, courseId))
  );

  return structures.flatMap(toOrderedItems);
}

async function benchmarkWidget(
  scope: Scope,
  widget: TInsightsWidget,
  selection: Selection,
  courseIds: string[]
): Promise<{ widgetId: string; rows: number; p50: number; p95: number } | null> {
  const spec = resolveSpec(widget, selection);
  if (!spec) return null;

  const orderedItems = await loadOrderedItems(scope, spec, courseIds);

  if (process.env.INSIGHTS_EXPLAIN_WIDGET === widget.id) {
    const { query } = compileInsightsQuery(spec, { scope, orderedItems });
    const plan = await db.execute(sql`EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) ${query}`);
    console.log(plan.map((row) => row['QUERY PLAN']).join('\n'));
  }

  const timings: number[] = [];
  let rows = 0;

  for (let run = 0; run < RUNS; run += 1) {
    const startedAt = performance.now();
    const result = await runInsightsQuery(spec, { scope, orderedItems });
    timings.push(performance.now() - startedAt);
    rows = result.rows.length;
  }

  return {
    widgetId: widget.id,
    rows,
    p50: percentile(timings, 0.5),
    p95: percentile(timings, 0.95)
  };
}

async function benchmarkDashboard(
  scope: Scope,
  selection: Selection,
  courseIds: string[]
): Promise<{ widgets: number; p50: number; p95: number }> {
  const specs: Array<{ spec: TInsightsQuerySpec; orderedItems: InsightsOrderedItem[] }> = [];

  for (const widget of INSIGHTS_PRESETS[scope.type]) {
    const widgetSelection = widget.courseMode === 'all' ? { ...selection, courseId: null } : selection;
    const spec = resolveSpec(widget, widgetSelection);
    if (!spec) continue;

    const orderedItems = await loadOrderedItems(scope, spec, courseIds);
    specs.push({ spec, orderedItems });
  }

  const timings: number[] = [];
  for (let run = 0; run < RUNS; run += 1) {
    const startedAt = performance.now();
    await Promise.all(specs.map(({ spec, orderedItems }) => runInsightsQuery(spec, { scope, orderedItems })));
    timings.push(performance.now() - startedAt);
  }

  return { widgets: specs.length, p50: percentile(timings, 0.5), p95: percentile(timings, 0.95) };
}

async function findSelection(courseId: string | null): Promise<Selection> {
  if (!courseId) return { courseId: null, studentId: null, exerciseId: null };

  const [courseRow] = await db.select({ groupId: course.groupId }).from(course).where(eq(course.id, courseId)).limit(1);
  const [member] = courseRow?.groupId
    ? await db
        .select({ profileId: groupmember.profileId })
        .from(groupmember)
        .where(eq(groupmember.groupId, courseRow.groupId))
        .limit(1)
    : [];
  const [exerciseRow] = await db
    .select({ id: exercise.id })
    .from(exercise)
    .where(eq(exercise.courseId, courseId))
    .orderBy(asc(exercise.order))
    .limit(1);

  return { courseId, studentId: member?.profileId ?? null, exerciseId: exerciseRow?.id ?? null };
}

async function cohortCourseIds(cohortId: string): Promise<string[]> {
  const rows = await db
    .select({ courseId: cohortCourse.courseId })
    .from(cohortCourse)
    .innerJoin(course, eq(course.id, cohortCourse.courseId))
    .where(eq(cohortCourse.cohortId, cohortId));

  return rows.map((row) => row.courseId);
}

async function main(): Promise<void> {
  const [org] = await db
    .select({ id: organization.id })
    .from(organization)
    .where(eq(organization.siteName, ORG_SITE_NAME))
    .limit(1);

  if (!org) throw new Error(`Organization "${ORG_SITE_NAME}" not found. Run db:seed:insights-load first.`);

  const [firstCohort] = await db
    .select({ id: cohort.id })
    .from(cohort)
    .where(eq(cohort.organizationId, org.id))
    .orderBy(asc(cohort.name))
    .limit(1);
  if (!firstCohort) throw new Error('No cohorts found for the load organization.');

  const firstCohortCourseIds = await cohortCourseIds(firstCohort.id);
  const [firstCourse] = await db
    .select({ id: course.id })
    .from(course)
    .where(eq(course.id, firstCohortCourseIds[0]))
    .limit(1);
  if (!firstCourse) throw new Error('No courses found for the first cohort.');

  const scopes: Array<{ scope: Scope; courseIds: string[]; selectionCourseId: string | null }> = [
    {
      scope: { orgId: org.id, type: 'cohort', id: firstCohort.id },
      courseIds: firstCohortCourseIds,
      selectionCourseId: firstCohortCourseIds[0] ?? null
    },
    {
      scope: { orgId: org.id, type: 'course', id: firstCourse.id },
      courseIds: [firstCourse.id],
      selectionCourseId: firstCourse.id
    },
    {
      scope: { orgId: org.id, type: 'org', id: org.id },
      courseIds: [],
      selectionCourseId: null
    }
  ];

  const results: Array<{ scope: TInsightsScopeType; widgetId: string; rows: number; p50: number; p95: number }> = [];

  for (const entry of scopes) {
    const selection = await findSelection(entry.selectionCourseId);
    const budget = BUDGET_MS[entry.scope.type];

    console.log(`\n${entry.scope.type.toUpperCase()} ${entry.scope.id}`);
    console.log('widget'.padEnd(34), 'rows'.padStart(6), 'p50 ms'.padStart(9), 'p95 ms'.padStart(9), 'budget');

    for (const widget of INSIGHTS_PRESETS[entry.scope.type]) {
      const widgetSelection = widget.courseMode === 'all' ? { ...selection, courseId: null } : selection;
      const result = await benchmarkWidget(entry.scope, widget, widgetSelection, entry.courseIds);
      if (!result) continue;

      results.push({ scope: entry.scope.type, ...result });
      const overBudget = result.p95 > budget ? 'OVER' : 'ok';
      console.log(
        result.widgetId.padEnd(34),
        String(result.rows).padStart(6),
        result.p50.toFixed(1).padStart(9),
        result.p95.toFixed(1).padStart(9),
        overBudget
      );
    }

    const dashboard = await benchmarkDashboard(entry.scope, selection, entry.courseIds);
    console.log(
      `whole dashboard, ${dashboard.widgets} widgets in parallel`.padEnd(41),
      dashboard.p50.toFixed(1).padStart(9),
      dashboard.p95.toFixed(1).padStart(9)
    );
  }

  console.log(`\n${JSON.stringify(results)}`);
}

main().catch((error) => {
  console.error('measure-insights error:', error);
  process.exitCode = 1;
});
