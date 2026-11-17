import { describe, expect, it } from 'vitest';

import type { AnalyticsDrilldown } from '@cio/utils/analytics';

import { buildWidgetExportDocument } from './analytics-export';
import {
  countActiveStudentFilters,
  drilldownHeading,
  emptyStudentFilters,
  parseStudentUrlFilters,
  studentQueryParts,
  studentsTabTarget,
  studentUrlFiltersFromSpec,
  studentUrlSearchParams
} from './analytics-utils';
import type { AnalyticsResult, AnalyticsWidget } from './types';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const LESSON_ID = '22222222-2222-4222-8222-222222222222';
const COHORT_ID = '33333333-3333-4333-8333-333333333333';
const OTHER_COHORT_ID = '44444444-4444-4444-8444-444444444444';

const translate = (key: string, vars?: Record<string, string | number>) =>
  vars ? `${key}:${Object.values(vars).join(',')}` : key;

function drilldown(overrides: Partial<AnalyticsDrilldown>): AnalyticsDrilldown {
  return { widgetId: 'test', facet: null, filters: [], range: 'all', expectedTotal: null, ...overrides };
}

describe('student URL filters', () => {
  it('round-trips every enumerated filter through the query string', () => {
    const filters = {
      ...emptyStudentFilters(),
      status: 'at_risk',
      activity: 'idle',
      completion: 'incomplete'
    } as const;
    const params = studentUrlSearchParams({ filters, refs: { cohortIds: [], lessonId: null }, courseId: null });

    expect(params.toString()).toBe('status=at_risk&activity=idle&completion=incomplete');
    expect(parseStudentUrlFilters(params).filters).toEqual(filters);
  });

  it('round-trips cohort, lesson and course references', () => {
    const params = studentUrlSearchParams({
      filters: emptyStudentFilters(),
      refs: { cohortIds: [COHORT_ID, OTHER_COHORT_ID], lessonId: LESSON_ID },
      courseId: COURSE_ID
    });

    expect(parseStudentUrlFilters(params)).toEqual({
      filters: emptyStudentFilters(),
      refs: { cohortIds: [COHORT_ID, OTHER_COHORT_ID], lessonId: LESSON_ID },
      courseId: COURSE_ID
    });
  });

  it('drops values that are not allowed options or uuids', () => {
    const params = new URLSearchParams({
      status: 'hacked',
      activity: 'idle',
      score: 'lt500',
      video: 'low',
      cohort: `not-a-uuid,${COHORT_ID},${COHORT_ID}`,
      lesson: "1' OR '1'='1",
      course: 'nope'
    });

    expect(parseStudentUrlFilters(params)).toEqual({
      filters: { ...emptyStudentFilters(), activity: 'idle', video: 'low' },
      refs: { cohortIds: [COHORT_ID], lessonId: null },
      courseId: null
    });
  });

  it('caps the number of linked cohorts at the API filter limit', () => {
    const ids = Array.from({ length: 150 }, (_, index) => `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`);

    expect(parseStudentUrlFilters(new URLSearchParams({ cohort: ids.join(',') })).refs.cohortIds).toHaveLength(100);
  });

  it('turns linked filters back into the spec filters the drill-down used', () => {
    const target = parseStudentUrlFilters(
      new URLSearchParams({ status: 'at_risk', cohort: COHORT_ID, lesson: LESSON_ID })
    );

    expect(studentQueryParts(target.filters, target.refs).filters).toEqual([
      { field: 'status', op: 'eq', value: 'at_risk' },
      { field: 'cohort', op: 'in', value: [COHORT_ID] },
      { field: 'lesson_incomplete', op: 'eq', value: LESSON_ID }
    ]);
    expect(countActiveStudentFilters(target.filters, target.refs)).toBe(3);
  });
});

describe('studentUrlFiltersFromSpec', () => {
  it('maps the at-risk flag to the status filter without a redundant completion filter', () => {
    const target = studentUrlFiltersFromSpec([
      { field: 'is_completed_all', op: 'is_false' },
      { field: 'is_at_risk', op: 'is_true' }
    ]);

    expect(target?.filters).toEqual({ ...emptyStudentFilters(), status: 'at_risk' });
  });

  it('maps attention flags onto the table filters', () => {
    const base = [{ field: 'is_completed_all', op: 'is_false' }] as const;

    expect(studentUrlFiltersFromSpec([...base, { field: 'is_inactive', op: 'is_true' }])?.filters).toMatchObject({
      activity: 'idle',
      completion: 'incomplete'
    });
    expect(studentUrlFiltersFromSpec([...base, { field: 'is_low_score', op: 'is_true' }])?.filters.score).toBe('lt50');
    expect(studentUrlFiltersFromSpec([...base, { field: 'is_overdue', op: 'is_true' }])?.filters.flag).toBe('overdue');
    expect(studentUrlFiltersFromSpec([...base, { field: 'is_low_video', op: 'is_true' }])?.filters.video).toBe('low');
  });

  it('maps cohort and lesson drill-downs onto references', () => {
    const target = studentUrlFiltersFromSpec([
      { field: 'course', op: 'eq', value: COURSE_ID },
      { field: 'cohort', op: 'in', value: [COHORT_ID] },
      { field: 'lesson_incomplete', op: 'eq', value: LESSON_ID }
    ]);

    expect(target).toEqual({
      filters: emptyStudentFilters(),
      refs: { cohortIds: [COHORT_ID], lessonId: LESSON_ID },
      courseId: COURSE_ID
    });
  });

  it('maps the score ranges the table offers and rejects the rest', () => {
    const below50 = [{ field: 'avg_score_pct', op: 'lt', value: 50 }] as const;
    const sixties = [
      { field: 'avg_score_pct', op: 'gte', value: 60 },
      { field: 'avg_score_pct', op: 'lt', value: 70 }
    ] as const;

    expect(studentUrlFiltersFromSpec(below50)?.filters.score).toBe('lt50');
    expect(studentUrlFiltersFromSpec(sixties)).toBeNull();
  });

  it('refuses filters the table has no control for', () => {
    expect(studentUrlFiltersFromSpec([{ field: 'is_attempted', op: 'is_true' }])).toBeNull();
  });
});

describe('studentsTabTarget', () => {
  const atRisk = drilldown({ filters: [{ field: 'is_at_risk', op: 'is_true' }] });

  it('links a cohort drill-down to the cohort analytics students table', () => {
    const target = studentsTabTarget(atRisk, { type: 'cohort', id: COHORT_ID });

    expect(target?.href).toBe(`/cohorts/${COHORT_ID}/analytics?status=at_risk#analytics-students`);
  });

  it('carries the picked course on a cohort link only', () => {
    const withCourse = drilldown({
      filters: [
        { field: 'course', op: 'eq', value: COURSE_ID },
        { field: 'is_overdue', op: 'is_true' }
      ]
    });

    expect(studentsTabTarget(withCourse, { type: 'cohort', id: COHORT_ID })?.href).toBe(
      `/cohorts/${COHORT_ID}/analytics?flag=overdue&course=${COURSE_ID}#analytics-students`
    );
    expect(studentsTabTarget(withCourse, { type: 'course', id: COURSE_ID })?.href).toBe(
      `/courses/${COURSE_ID}/analytics?flag=overdue#analytics-students`
    );
  });

  it('has no target for the org scope, which has no students table', () => {
    expect(studentsTabTarget(atRisk, { type: 'org', id: COHORT_ID })).toBeNull();
  });

  it('has no target for a ranged drill-down, whose list the table cannot reproduce', () => {
    expect(studentsTabTarget(drilldown({ ...atRisk, range: '30d' }), { type: 'cohort', id: COHORT_ID })).toBeNull();
  });
});

describe('drilldownHeading', () => {
  const params = { total: 20, scopeName: 'Cohort A', courseTitle: null, lessonTitle: null };

  it('states the count, the filter and the scope in words', () => {
    const heading = drilldownHeading(
      { ...params, drilldown: drilldown({ facet: { kind: 'status', status: 'at_risk' } }) },
      translate
    );

    expect(heading).toBe('analytics.drilldown.count:20 · analytics.status.at_risk · Cohort A');
  });

  it('names the lesson and course of a lesson drill-down', () => {
    const heading = drilldownHeading(
      {
        ...params,
        scopeName: null,
        courseTitle: 'Intro',
        lessonTitle: 'Lesson 3',
        drilldown: drilldown({ facet: { kind: 'lesson_incomplete', lessonId: LESSON_ID } })
      },
      translate
    );

    expect(heading).toBe('analytics.drilldown.count:20 · analytics.drilldown.lesson_incomplete:Lesson 3 · Intro');
  });

  it('says students in cohorts of a health, not students with that health', () => {
    const heading = drilldownHeading(
      { ...params, drilldown: drilldown({ facet: { kind: 'cohort_health', health: 'at_risk' } }) },
      translate
    );

    expect(heading).toContain('analytics.drilldown.cohort_health.at_risk');
  });

  it('leaves out the filter when the whole widget is drilled', () => {
    expect(drilldownHeading({ ...params, drilldown: drilldown({}) }, translate)).toBe(
      'analytics.drilldown.count:20 · Cohort A'
    );
  });
});

describe('buildWidgetExportDocument', () => {
  const donutWidget = {
    id: 'students_by_status',
    viz: 'donut',
    spec: { dimensions: ['status'] }
  } as unknown as AnalyticsWidget;
  const donutResult = {
    columns: [
      { key: 'status_id', role: 'dimension', valueType: 'text' },
      { key: 'rows__count', role: 'measure', valueType: 'integer' }
    ],
    rows: [
      { status_id: 'at_risk', rows__count: 4 },
      { status_id: 'completed', rows__count: 6 }
    ],
    total: 2
  } as unknown as AnalyticsResult;

  it('exports the donut segments as displayed', () => {
    const document = buildWidgetExportDocument({
      widget: donutWidget,
      result: donutResult,
      title: 'Students by status',
      translate
    });

    expect(document.rows).toEqual([
      { segment: 'analytics.status.at_risk', students: 4 },
      { segment: 'analytics.status.completed', students: 6 }
    ]);
    expect(document.columns.map((column) => column.value(document.rows[0]))).toEqual(['analytics.status.at_risk', 4]);
  });

  it('exports one labelled row per result row for charts', () => {
    const widget = {
      id: 'lesson_dropoff',
      viz: 'hbar',
      spec: { dimensions: ['lesson'] }
    } as unknown as AnalyticsWidget;
    const result = {
      columns: [
        { key: 'lesson_id', role: 'dimension', valueType: 'id' },
        { key: 'lesson_label', role: 'dimension', valueType: 'text' },
        { key: 'is_complete__rate', role: 'measure', valueType: 'percent' }
      ],
      rows: [{ lesson_id: LESSON_ID, lesson_label: 'Lesson 1', is_complete__rate: 75 }],
      total: 1
    } as unknown as AnalyticsResult;

    const document = buildWidgetExportDocument({ widget, result, title: 'Drop-off', translate });

    expect(document.rows).toEqual([{ dimension_lesson: 'Lesson 1', is_complete__rate: 75 }]);
    expect(document.columns.map((column) => column.header)).toEqual([
      'analytics.export.dimensions.lesson',
      'Is complete rate'
    ]);
  });

  it('exports the headline figure of a KPI', () => {
    const widget = { id: 'kpi_needs_attention', viz: 'kpi', spec: {} } as unknown as AnalyticsWidget;
    const document = buildWidgetExportDocument({
      widget,
      result: donutResult,
      title: 'Needs attention',
      kpi: { value: '20', description: 'flagged' },
      translate
    });

    expect(document.rows).toEqual([{ metric: 'Needs attention', value: '20', details: 'flagged' }]);
  });
});
