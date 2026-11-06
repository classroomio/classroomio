import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@api/services/insights/authorize', () => ({
  resolveAuthorizedScope: vi.fn()
}));

vi.mock('@api/services/insights/dashboards', () => ({
  getInsightsDashboardForScope: vi.fn()
}));

vi.mock('@api/services/insights/query', () => ({
  runInsightsQueryForScope: vi.fn()
}));

vi.mock('@api/services/insights/plan', () => ({
  resolveInsightsRange: vi.fn(async (_orgId: unknown, range: unknown) => range)
}));

import { resolveAuthorizedScope } from '@api/services/insights/authorize';
import { getInsightsDashboardForScope } from '@api/services/insights/dashboards';
import { resolveInsightsRange } from '@api/services/insights/plan';
import { runInsightsQueryForScope } from '@api/services/insights/query';
import { getInsightsDashboardSnapshotForActor } from '@api/services/insights/snapshot';
import type { InsightsCourseStructure, InsightsDashboard } from '@api/services/insights/types';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { INSIGHTS_PLACEHOLDERS } from '@cio/utils/constants/insights';
import { INSIGHTS_WIDGET_DESCRIPTIONS } from '@cio/utils/constants/insights-catalog';
import { ZInsightsWidget, type TInsightsWidget } from '@cio/utils/validation/insights';

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const COHORT_ID = '22222222-2222-4222-8222-222222222222';
const COURSE_ID = '33333333-3333-4333-8333-333333333333';
const OTHER_COURSE_ID = '44444444-4444-4444-8444-444444444444';

const ACTOR = { profileId: '44444444-4444-4444-8444-444444444444', orgId: ORG_ID, orgRoles: { [ORG_ID]: 1 } };
const COHORT_SCOPE = { type: 'cohort' as const, id: COHORT_ID };
const ORG_SCOPE = { type: 'org' as const, id: ORG_ID };
const COURSE_SCOPE = { type: 'course' as const, id: COURSE_ID };
const AUTHORIZED_COHORT = { orgId: ORG_ID, type: 'cohort' as const, id: COHORT_ID, courseIds: [COURSE_ID] };
const AUTHORIZED_ORG = { orgId: ORG_ID, type: 'org' as const, id: ORG_ID, courseIds: [] };
const AUTHORIZED_COURSE = { orgId: ORG_ID, type: 'course' as const, id: COURSE_ID, courseIds: [COURSE_ID] };

const QUERY_RESULT = {
  columns: [{ key: 'rows__count', role: 'measure' as const, valueType: 'integer' as const }],
  rows: [{ rows__count: 42 }],
  total: 1
};

const STRUCTURE: InsightsCourseStructure = {
  courseId: COURSE_ID,
  isGrouped: true,
  sections: [{ id: 'section-1', title: 'Section 1', rank: 1 }],
  items: [
    {
      id: 'lesson-1',
      type: 'LESSON',
      title: 'Lesson 1',
      rank: 1,
      sectionId: 'section-1',
      isPassRequired: false,
      passMark: null,
      isLocked: false,
      maxPoints: null
    },
    {
      id: 'ex-plain',
      type: 'EXERCISE',
      title: 'Quiz',
      rank: 2,
      sectionId: 'section-1',
      isPassRequired: false,
      passMark: null,
      isLocked: false,
      maxPoints: 100
    },
    {
      id: 'ex-pass',
      type: 'EXERCISE',
      title: 'Final',
      rank: 3,
      sectionId: 'section-1',
      isPassRequired: true,
      passMark: 50,
      isLocked: false,
      maxPoints: 100
    }
  ]
};

function queryOk() {
  return {
    ...QUERY_RESULT,
    range: 'all' as const,
    generatedAt: '2026-11-06T00:00:00.000Z',
    cached: false,
    refreshThrottled: false
  };
}

function widget(id: string, overrides: Record<string, unknown> = {}): TInsightsWidget {
  return ZInsightsWidget.parse({
    id,
    titleKey: `insights.widgets.${id}.title`,
    viz: 'kpi',
    span: 4,
    courseMode: 'any',
    requires: [],
    breakdown: 'core',
    hidden: false,
    usesRange: false,
    spec: { source: 'student', measures: [{ metric: 'rows', agg: 'count' }] },
    ...overrides
  });
}

type DashboardOptions = {
  scopeType?: 'cohort' | 'course' | 'org';
  cohortCount?: number;
  structures?: InsightsCourseStructure[];
};

function dashboardOf(widgets: TInsightsWidget[], options: DashboardOptions = {}): InsightsDashboard {
  const scopeType = options.scopeType ?? 'cohort';

  const structures: Record<string, InsightsCourseStructure> = {};
  for (const structure of options.structures ?? [STRUCTURE]) {
    structures[structure.courseId] = structure;
  }

  return {
    scope: {
      type: scopeType,
      id: scopeType === 'org' ? ORG_ID : scopeType === 'course' ? COURSE_ID : COHORT_ID,
      name: 'Scope',
      description: null,
      studentCount: 20,
      pendingCount: 2,
      cohortCount: options.cohortCount ?? 0,
      activeCohortCount: 0,
      studentTarget: null,
      courses: [{ id: COURSE_ID, title: 'Course', isGrouped: true, hasPassRequired: true }]
    },
    structures,
    widgets,
    refreshIntervalSeconds: 30
  };
}

function widgetOf(
  snapshot: {
    widgets: Array<{
      id: string;
      viz: string;
      description: string;
      spec: unknown;
      result: unknown;
      errorCode: string | null;
    }>;
  },
  id: string
) {
  const entry = snapshot.widgets.find((candidate) => candidate.id === id);

  expect(entry, id).toBeDefined();

  return entry!;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(resolveAuthorizedScope).mockResolvedValue(AUTHORIZED_COHORT);
  vi.mocked(runInsightsQueryForScope).mockResolvedValue(queryOk());
});

describe('getInsightsDashboardSnapshotForActor', () => {
  it('authorizes once, before the dashboard and every widget query', async () => {
    const calls: string[] = [];

    vi.mocked(resolveAuthorizedScope).mockImplementation(async () => {
      calls.push('authorize');

      return AUTHORIZED_COHORT;
    });
    vi.mocked(getInsightsDashboardForScope).mockImplementation(async () => {
      calls.push('dashboard');

      return dashboardOf([widget('w_a'), widget('w_b'), widget('w_c')]);
    });
    vi.mocked(runInsightsQueryForScope).mockImplementation(async () => {
      calls.push('query');

      return queryOk();
    });

    await getInsightsDashboardSnapshotForActor(ACTOR, COHORT_SCOPE);

    expect(calls[0]).toBe('authorize');
    expect(calls.filter((call) => call === 'authorize')).toHaveLength(1);
    expect(calls.indexOf('dashboard')).toBeGreaterThan(calls.indexOf('authorize'));
    expect(calls.filter((call) => call === 'query')).toHaveLength(3);
  });

  it('skips the self-loading students widget and hidden widgets', async () => {
    vi.mocked(getInsightsDashboardForScope).mockResolvedValue(
      dashboardOf([
        widget('students'),
        widget('students_by_status'),
        widget('cohort_empty', { hidden: true }),
        widget('kpi_completed')
      ])
    );

    const snapshot = await getInsightsDashboardSnapshotForActor(ACTOR, COHORT_SCOPE);

    expect(snapshot.widgets.map((entry) => entry.id)).toEqual(['students_by_status', 'kpi_completed']);
    expect(vi.mocked(runInsightsQueryForScope)).toHaveBeenCalledTimes(2);
  });

  it('rejects a courseId outside the scope with 404', async () => {
    vi.mocked(getInsightsDashboardForScope).mockResolvedValue(dashboardOf([widget('w_course')]));

    await expect(
      getInsightsDashboardSnapshotForActor(ACTOR, COHORT_SCOPE, { courseId: OTHER_COURSE_ID })
    ).rejects.toMatchObject({ code: ErrorCodes.INSIGHTS_SCOPE_NOT_FOUND, statusCode: 404 });
    expect(vi.mocked(runInsightsQueryForScope)).not.toHaveBeenCalled();
  });

  it('rejects an exerciseId outside the selected course with 404', async () => {
    vi.mocked(getInsightsDashboardForScope).mockResolvedValue(
      dashboardOf([widget('w_course')], { scopeType: 'course' })
    );

    await expect(
      getInsightsDashboardSnapshotForActor(ACTOR, COURSE_SCOPE, { courseId: COURSE_ID, exerciseId: 'no-such-exercise' })
    ).rejects.toMatchObject({ code: ErrorCodes.INSIGHTS_SCOPE_NOT_FOUND, statusCode: 404 });
    expect(vi.mocked(runInsightsQueryForScope)).not.toHaveBeenCalled();
  });

  it('reports the effective range on the Free plan in the selection and every widget spec', async () => {
    vi.mocked(getInsightsDashboardForScope).mockResolvedValue(dashboardOf([widget('w_range', { usesRange: true })]));
    vi.mocked(resolveInsightsRange).mockResolvedValueOnce('7d');

    const snapshot = await getInsightsDashboardSnapshotForActor(ACTOR, COHORT_SCOPE, { range: 'all' });

    expect(resolveInsightsRange).toHaveBeenCalledWith(ORG_ID, 'all');
    expect(snapshot.selection.range).toBe('7d');
    expect(snapshot.widgets).toHaveLength(1);
    expect(snapshot.widgets[0]?.spec.range).toBe('7d');
  });

  it('excludes single-course widgets without a course and all-courses widgets with one', async () => {
    vi.mocked(getInsightsDashboardForScope).mockResolvedValue(
      dashboardOf([widget('w_all', { courseMode: 'all' }), widget('w_single', { courseMode: 'single' })])
    );

    const withoutCourse = await getInsightsDashboardSnapshotForActor(ACTOR, COHORT_SCOPE);
    expect(withoutCourse.widgets.map((entry) => entry.id)).toEqual(['w_all']);

    const withCourse = await getInsightsDashboardSnapshotForActor(ACTOR, COHORT_SCOPE, { courseId: COURSE_ID });
    expect(withCourse.widgets.map((entry) => entry.id)).toEqual(['w_single']);
  });

  it('fills course and exercise placeholders from the dashboard defaults', async () => {
    vi.mocked(resolveAuthorizedScope).mockResolvedValue(AUTHORIZED_COURSE);
    vi.mocked(getInsightsDashboardForScope).mockResolvedValue(
      dashboardOf(
        [
          widget('w_course', {
            spec: {
              source: 'student',
              measures: [{ metric: 'rows', agg: 'count' }],
              filters: [{ field: 'course', op: 'eq', value: INSIGHTS_PLACEHOLDERS.course }]
            }
          }),
          widget('w_exercise', {
            spec: {
              source: 'assessment_result',
              measures: [{ metric: 'rows', agg: 'count' }],
              filters: [{ field: 'exercise', op: 'eq', value: INSIGHTS_PLACEHOLDERS.exercise }]
            }
          })
        ],
        { scopeType: 'course' }
      )
    );

    const snapshot = await getInsightsDashboardSnapshotForActor(ACTOR, COURSE_SCOPE);

    expect(snapshot.selection).toEqual({
      courseId: COURSE_ID,
      exerciseId: 'ex-pass',
      breakdown: 'courses',
      range: 'all'
    });

    const courseSpec = vi.mocked(runInsightsQueryForScope).mock.calls[0][1].spec;
    expect(courseSpec.filters).toEqual([{ field: 'course', op: 'eq', value: COURSE_ID }]);

    const exerciseFilters = vi.mocked(runInsightsQueryForScope).mock.calls[1][1].spec.filters;
    expect(exerciseFilters).toContainEqual({ field: 'exercise', op: 'eq', value: 'ex-pass' });
    expect(exerciseFilters).toContainEqual({ field: 'course', op: 'eq', value: COURSE_ID });
  });

  it('keeps the selection the caller sent instead of the defaults', async () => {
    vi.mocked(getInsightsDashboardForScope).mockResolvedValue(
      dashboardOf([widget('w_course')], { scopeType: 'course' })
    );

    const snapshot = await getInsightsDashboardSnapshotForActor(ACTOR, COURSE_SCOPE, {
      courseId: COURSE_ID,
      exerciseId: 'ex-plain',
      range: '7d',
      breakdown: 'courses'
    });

    expect(snapshot.selection).toEqual({
      courseId: COURSE_ID,
      exerciseId: 'ex-plain',
      breakdown: 'courses',
      range: '7d'
    });
  });

  it('breaks down by cohorts only when the caller asks and the scope has cohorts', async () => {
    vi.mocked(resolveAuthorizedScope).mockResolvedValue(AUTHORIZED_ORG);
    vi.mocked(getInsightsDashboardForScope).mockResolvedValue(
      dashboardOf([widget('w_courses', { breakdown: 'courses' }), widget('w_cohorts', { breakdown: 'cohorts' })], {
        scopeType: 'org',
        cohortCount: 3
      })
    );

    const byCourses = await getInsightsDashboardSnapshotForActor(ACTOR, ORG_SCOPE);
    expect(byCourses.widgets.map((entry) => entry.id)).toEqual(['w_courses']);
    expect(byCourses.selection.breakdown).toBe('courses');

    const byCohorts = await getInsightsDashboardSnapshotForActor(ACTOR, ORG_SCOPE, { breakdown: 'cohorts' });
    expect(byCohorts.widgets.map((entry) => entry.id)).toEqual(['w_cohorts']);
    expect(byCohorts.selection.breakdown).toBe('cohorts');
  });

  it('fails one widget into an errorCode while the others succeed', async () => {
    vi.mocked(getInsightsDashboardForScope).mockResolvedValue(
      dashboardOf([
        widget('w_ok', { spec: { source: 'student', measures: [{ metric: 'rows', agg: 'count' }] } }),
        widget('w_boom', { spec: { source: 'student', measures: [{ metric: 'avg_score_pct', agg: 'avg' }] } })
      ])
    );
    vi.mocked(runInsightsQueryForScope).mockImplementation(async (_scope, request) => {
      if (request.spec.measures[0]?.metric === 'avg_score_pct') throw new Error('database went away');

      return queryOk();
    });

    const snapshot = await getInsightsDashboardSnapshotForActor(ACTOR, COHORT_SCOPE);

    const ok = widgetOf(snapshot, 'w_ok');
    expect(ok.errorCode).toBeNull();
    expect(ok.result).toEqual({ columns: QUERY_RESULT.columns, rows: QUERY_RESULT.rows, total: 1 });

    const boom = widgetOf(snapshot, 'w_boom');
    expect(boom.errorCode).toBe(ErrorCodes.INSIGHTS_QUERY_FAILED);
    expect(boom.result).toBeNull();
    expect(boom.spec).toEqual({
      source: 'student',
      measures: [{ metric: 'avg_score_pct', agg: 'avg' }],
      dimensions: [],
      filters: [],
      sort: [],
      limit: 25,
      page: 1,
      range: 'all'
    });
  });

  it('caps widget queries at four running at once and preserves dashboard order', async () => {
    const widgetIds = Array.from({ length: 9 }, (_, index) => `w_${index}`);
    vi.mocked(getInsightsDashboardForScope).mockResolvedValue(dashboardOf(widgetIds.map((id) => widget(id))));

    let running = 0;
    let peak = 0;
    vi.mocked(runInsightsQueryForScope).mockImplementation(async () => {
      running += 1;
      peak = Math.max(peak, running);
      await new Promise((resolve) => setTimeout(resolve, 5));
      running -= 1;

      return queryOk();
    });

    const snapshot = await getInsightsDashboardSnapshotForActor(ACTOR, COHORT_SCOPE);

    expect(peak).toBe(4);
    expect(snapshot.widgets.map((entry) => entry.id)).toEqual(widgetIds);
  });

  it('carries the catalog description and a fresh generatedAt', async () => {
    vi.mocked(getInsightsDashboardForScope).mockResolvedValue(
      dashboardOf([widget('kpi_completed')], { scopeType: 'course' })
    );

    const snapshot = await getInsightsDashboardSnapshotForActor(ACTOR, COURSE_SCOPE);

    const entry = widgetOf(snapshot, 'kpi_completed');
    expect(entry.description).toBe(INSIGHTS_WIDGET_DESCRIPTIONS['kpi_completed']);
    expect(entry.description.length).toBeGreaterThan(0);
    expect(snapshot.generatedAt).toBeTruthy();
  });

  it('propagates the refresh flag to the dashboard and widget queries', async () => {
    vi.mocked(getInsightsDashboardForScope).mockResolvedValue(dashboardOf([widget('w_refresh')]));

    await getInsightsDashboardSnapshotForActor(ACTOR, COHORT_SCOPE, { refresh: true });

    const request = vi.mocked(runInsightsQueryForScope).mock.calls[0][1];
    expect(request.refresh).toBe(true);
    expect(getInsightsDashboardForScope).toHaveBeenCalledWith(AUTHORIZED_COHORT, { refresh: true });
  });

  it('maps an authorization failure to its own AppError code and status', async () => {
    vi.mocked(resolveAuthorizedScope).mockRejectedValue(
      new AppError('You do not have access to these analytics', ErrorCodes.INSIGHTS_SCOPE_FORBIDDEN, 403)
    );
    vi.mocked(getInsightsDashboardForScope).mockResolvedValue(dashboardOf([widget('w_a')]));

    await expect(getInsightsDashboardSnapshotForActor(ACTOR, COHORT_SCOPE)).rejects.toMatchObject({
      code: ErrorCodes.INSIGHTS_SCOPE_FORBIDDEN,
      statusCode: 403
    });
    expect(getInsightsDashboardForScope).not.toHaveBeenCalled();
    expect(runInsightsQueryForScope).not.toHaveBeenCalled();
  });
});
