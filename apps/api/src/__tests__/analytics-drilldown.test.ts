import { PgDialect } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

import { compileAnalyticsQuery } from '@cio/db/queries/analytics';
import {
  cohortHealth,
  expandNeedsSegmentSwitcher,
  hasExpandDrilldown,
  hasSegmentDrilldown,
  hasWholeDrilldown,
  studentsTableSpec,
  widgetDrilldown,
  type AnalyticsDrilldown,
  type AnalyticsDrilldownRow
} from '@cio/utils/analytics';
import { ANALYTICS_STATUSES } from '@cio/utils/constants/analytics';
import { ZAnalyticsQuerySpec, type TAnalyticsQuerySpec } from '@cio/utils/validation/analytics';

import { ANALYTICS_PRESETS } from '@api/services/analytics/presets';

const ORG_ID = '99999999-9999-4999-8999-999999999999';
const dialect = new PgDialect();
const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const LESSON_ID = '22222222-2222-4222-8222-222222222222';
const COHORT_A = '33333333-3333-4333-8333-333333333333';
const COHORT_B = '44444444-4444-4444-8444-444444444444';
const COHORT_C = '55555555-5555-4555-8555-555555555555';

const ALL_WIDGETS = [...ANALYTICS_PRESETS.org, ...ANALYTICS_PRESETS.cohort, ...ANALYTICS_PRESETS.course];

function specOf(widgetId: string, overrides: Partial<TAnalyticsQuerySpec> = {}): TAnalyticsQuerySpec {
  const widget = ALL_WIDGETS.find((candidate) => candidate.id === widgetId);
  if (!widget) throw new Error(`Unknown widget ${widgetId}`);

  return { ...widget.spec, ...overrides };
}

function drill(
  widgetId: string,
  segmentKey: string | null,
  rows: AnalyticsDrilldownRow[] = [],
  spec?: TAnalyticsQuerySpec
) {
  return widgetDrilldown({ widgetId, spec: spec ?? specOf(widgetId), rows, segmentKey });
}

function cohortRow(
  id: string,
  stats: { students: number; completed?: number; atRisk?: number; score?: number | null }
): AnalyticsDrilldownRow {
  return {
    cohort_id: id,
    students__value: stats.students,
    completed_students__value: stats.completed ?? 0,
    at_risk_students__value: stats.atRisk ?? 0,
    avg_score_pct__value: stats.score === undefined ? 80 : stats.score
  };
}

describe('widgetDrilldown', () => {
  it('drills the at-risk KPI by the same flag the KPI counts, keeping the widget filters', () => {
    const drilldown = drill('kpi_needs_attention', null);

    expect(drilldown).toEqual({
      widgetId: 'kpi_needs_attention',
      facet: { kind: 'status', status: 'at_risk' },
      filters: [
        { field: 'is_completed_all', op: 'is_false' },
        { field: 'is_at_risk', op: 'is_true' }
      ],
      range: 'all',
      expectedTotal: null
    });
  });

  it('counts the same flag the at-risk KPI measure uses', () => {
    const counted = specOf('kpi_needs_attention').measures[0];

    expect(counted).toEqual({ metric: 'is_at_risk', agg: 'count_if' });
  });

  it('adds the picked course to a drill when the widget spec carries one', () => {
    const spec = specOf('kpi_needs_attention', {
      filters: [
        { field: 'is_completed_all', op: 'is_false' },
        { field: 'course', op: 'eq', value: COURSE_ID }
      ]
    });

    expect(drill('kpi_needs_attention', null, [], spec)?.filters).toContainEqual({
      field: 'course',
      op: 'eq',
      value: COURSE_ID
    });
  });

  it.each(ANALYTICS_STATUSES)('drills the %s slice of the status donut with one status filter', (status) => {
    expect(drill('students_by_status', status)).toEqual({
      widgetId: 'students_by_status',
      facet: { kind: 'status', status },
      filters: [{ field: 'status', op: 'eq', value: status }],
      range: 'all',
      expectedTotal: null
    });
  });

  it('keeps the picked course on the course-scoped status donut', () => {
    const spec = specOf('students_by_status_course', {
      filters: [{ field: 'course', op: 'eq', value: COURSE_ID }]
    });

    expect(drill('students_by_status_course', 'at_risk', [], spec)?.filters).toEqual([
      { field: 'course', op: 'eq', value: COURSE_ID },
      { field: 'status', op: 'eq', value: 'at_risk' }
    ]);
  });

  it('rejects a status segment that is not a status', () => {
    expect(drill('students_by_status', 'unknown')).toBeNull();
  });

  it.each([
    ['is_inactive__count_if', 'inactive', 'is_inactive'],
    ['is_low_score__count_if', 'low_score', 'is_low_score'],
    ['is_overdue__count_if', 'overdue', 'is_overdue'],
    ['is_low_video__count_if', 'low_video', 'is_low_video']
  ])('drills the %s attention bar by its own flag among students who have not completed', (key, reason, field) => {
    expect(drill('needs_attention', key)).toEqual({
      widgetId: 'needs_attention',
      facet: { kind: 'attention', reason },
      filters: [
        { field: 'is_completed_all', op: 'is_false' },
        { field: field, op: 'is_true' }
      ],
      range: 'all',
      expectedTotal: null
    });
  });

  it('offers needs_attention only per bar, because its bars overlap', () => {
    expect(hasWholeDrilldown('needs_attention')).toBe(false);
    expect(hasSegmentDrilldown('needs_attention')).toBe(true);
    expect(drill('needs_attention', null)).toBeNull();
    expect(drill('needs_attention', 'is_unknown__count_if')).toBeNull();
  });

  it('drills the overdue table and KPI by the overdue flag', () => {
    const overdueFilter = { field: 'is_overdue', op: 'is_true' };

    expect(drill('overdue', null)?.filters).toEqual([overdueFilter]);
    expect(drill('kpi_overdue', null)?.filters).toEqual([overdueFilter]);
  });

  it('keeps only the course filter when the overdue table comes from another source', () => {
    const spec = specOf('overdue', { filters: [{ field: 'course', op: 'eq', value: COURSE_ID }] });

    expect(drill('overdue', null, [], spec)?.filters).toEqual([
      { field: 'course', op: 'eq', value: COURSE_ID },
      { field: 'is_overdue', op: 'is_true' }
    ]);
  });

  it('drills the completed KPI by the completed-all flag it counts', () => {
    expect(specOf('kpi_completed').measures[0]).toEqual({ metric: 'is_completed_all', agg: 'count_if' });
    expect(drill('kpi_completed', null)?.filters).toEqual([{ field: 'is_completed_all', op: 'is_true' }]);
  });

  it('drills a lesson bar to the students who have not completed that lesson', () => {
    const spec = specOf('lesson_dropoff', { filters: [{ field: 'course', op: 'eq', value: COURSE_ID }] });

    expect(drill('lesson_dropoff', LESSON_ID, [], spec)).toEqual({
      widgetId: 'lesson_dropoff',
      facet: { kind: 'lesson_incomplete', lessonId: LESSON_ID },
      filters: [
        { field: 'course', op: 'eq', value: COURSE_ID },
        { field: 'lesson_incomplete', op: 'eq', value: LESSON_ID }
      ],
      range: 'all',
      expectedTotal: null
    });
    expect(hasWholeDrilldown('lesson_dropoff')).toBe(false);
  });

  describe('cohort_health', () => {
    const rows = [
      cohortRow(COHORT_A, { students: 10, atRisk: 4 }),
      cohortRow(COHORT_B, { students: 6, atRisk: 0 }),
      cohortRow(COHORT_C, { students: 0 })
    ];

    it('lists the students of the cohorts in a health, never the at-risk students inside them', () => {
      expect(drill('cohort_health', 'at_risk', rows)).toEqual({
        widgetId: 'cohort_health',
        facet: { kind: 'cohort_health', health: 'at_risk' },
        filters: [{ field: 'cohort', op: 'in', value: [COHORT_A] }],
        range: 'all',
        expectedTotal: 10
      });
    });

    it('sums the cohort sizes the donut slice counts as the expected total', () => {
      const sameHealth = [cohortRow(COHORT_A, { students: 10 }), cohortRow(COHORT_B, { students: 6 })];

      expect(drill('cohort_health', 'on_track', sameHealth)).toMatchObject({
        filters: [{ field: 'cohort', op: 'in', value: [COHORT_A, COHORT_B] }],
        expectedTotal: 16
      });
    });

    it('drills the whole donut into every cohort that has students', () => {
      expect(drill('cohort_health', null, rows)).toMatchObject({
        facet: { kind: 'cohort_health', health: null },
        filters: [{ field: 'cohort', op: 'in', value: [COHORT_A, COHORT_B] }],
        expectedTotal: 16
      });
    });

    it('returns nothing for a health no cohort has', () => {
      expect(drill('cohort_health', 'completed', rows)).toBeNull();
    });

    it('derives health with the same rule the donut uses', () => {
      expect(cohortHealth(cohortRow(COHORT_A, { students: 10, completed: 10 }))).toBe('completed');
      expect(cohortHealth(cohortRow(COHORT_A, { students: 10, atRisk: 2 }))).toBe('at_risk');
      expect(cohortHealth(cohortRow(COHORT_A, { students: 10, score: 60 }))).toBe('lagging');
      expect(cohortHealth(cohortRow(COHORT_A, { students: 10 }))).toBe('on_track');
      expect(cohortHealth(cohortRow(COHORT_A, { students: 0 }))).toBeNull();
    });
  });

  describe('score distribution', () => {
    it.each(['score_distribution', 'score_distribution_course'])(
      'drills %s buckets by score range and keeps the range',
      (widgetId) => {
        const spec = specOf(widgetId, { range: '30d', filters: [] });

        expect(drill(widgetId, '6', [], spec)).toMatchObject({
          facet: { kind: 'score_bucket', bucket: 6 },
          range: '30d',
          filters: [
            { field: 'avg_score_pct', op: 'gte', value: 60 },
            { field: 'avg_score_pct', op: 'lt', value: 70 }
          ]
        });
      }
    );

    it('treats the clamped end buckets as open ranges', () => {
      expect(drill('score_distribution', '4')?.filters).toEqual([{ field: 'avg_score_pct', op: 'lt', value: 50 }]);
      expect(drill('score_distribution', '9')?.filters).toEqual([{ field: 'avg_score_pct', op: 'gte', value: 90 }]);
    });

    it('rejects buckets the chart never draws', () => {
      expect(drill('score_distribution', '3')).toBeNull();
      expect(drill('score_distribution', '10')).toBeNull();
      expect(drill('score_distribution', 'x')).toBeNull();
    });

    it('drills the whole histogram into every scored student', () => {
      expect(drill('score_distribution', null)?.filters).toEqual([{ field: 'avg_score_pct', op: 'gte', value: 0 }]);
    });
  });

  describe('compiled student list', () => {
    function compileDrilldown(drilldown: AnalyticsDrilldown | null, scopeType: 'org' | 'cohort' | 'course') {
      if (!drilldown) throw new Error('Expected a drill-down');

      const spec = ZAnalyticsQuerySpec.parse(
        studentsTableSpec({ filters: drilldown.filters, range: drilldown.range, page: 1, limit: 10 })
      );
      const scope = { orgId: ORG_ID, type: scopeType, id: COURSE_ID };

      return dialect.sqlToQuery(compileAnalyticsQuery(spec, { scope, orderedItems: [] }).query);
    }

    it('filters the at-risk list on the flag the KPI counts', () => {
      const compiled = compileDrilldown(drill('kpi_needs_attention', null), 'org');

      expect(compiled.sql).toContain('base.is_at_risk IS TRUE');
      expect(compiled.sql).toContain('base.is_completed_all IS NOT TRUE');
    });

    it('filters a lesson drill-down on the lesson rows the drop-off chart reads', () => {
      const compiled = compileDrilldown(drill('lesson_dropoff', LESSON_ID), 'course');

      expect(compiled.sql).toContain('FROM lesson_row lr');
      expect(compiled.sql).toContain('lr.is_complete IS NOT TRUE');
      expect(compiled.params).toContain(LESSON_ID);
    });

    it('narrows a cohort-health drill-down to the cohorts through the cohort pushdown', () => {
      const rows = [cohortRow(COHORT_A, { students: 10, atRisk: 4 })];
      const compiled = compileDrilldown(drill('cohort_health', 'at_risk', rows), 'org');

      expect(compiled.params).toContain(COHORT_A);
      expect(compiled.sql).toContain('bridge.cohort_id IN');
    });

    it.each(['kpi_overdue', 'kpi_completed', 'overdue'])('compiles the %s drill-down', (widgetId) => {
      expect(() => compileDrilldown(drill(widgetId, null), 'cohort')).not.toThrow();
    });

    it.each(['is_inactive__count_if', 'is_low_score__count_if', 'is_overdue__count_if', 'is_low_video__count_if'])(
      'compiles the %s drill-down',
      (key) => {
        expect(() => compileDrilldown(drill('needs_attention', key), 'cohort')).not.toThrow();
      }
    );
  });

  it('has no drill-down for widgets that do not count students', () => {
    expect(drill('hiring_ramp', null)).toBeNull();
    expect(drill('hardest_questions', null)).toBeNull();
    expect(hasWholeDrilldown('exercise_score_distribution')).toBe(false);
    expect(hasSegmentDrilldown('exercise_score_distribution')).toBe(false);
  });

  describe('Expand', () => {
    it.each([
      'cohort_health',
      'overdue',
      'score_distribution',
      'score_distribution_course',
      'students_by_status',
      'students_by_status_course',
      'needs_attention',
      'lesson_dropoff'
    ])('is offered on %s and resolves to a drill-down it can list', (widgetId) => {
      expect(hasExpandDrilldown(widgetId)).toBe(true);
      expect(hasWholeDrilldown(widgetId) || hasSegmentDrilldown(widgetId)).toBe(true);
    });

    it.each(['kpi_needs_attention', 'kpi_overdue', 'kpi_completed'])(
      'is not offered on the %s card even though it has a whole drill-down',
      (widgetId) => {
        expect(hasWholeDrilldown(widgetId)).toBe(true);
        expect(hasExpandDrilldown(widgetId)).toBe(false);
      }
    );

    it.each(['hiring_ramp', 'hardest_questions', 'exercise_score_distribution', 'logins_per_day', 'unknown'])(
      'is not offered on %s',
      (widgetId) => {
        expect(hasExpandDrilldown(widgetId)).toBe(false);
      }
    );

    it('needs a segment switcher only where Expand opens one segment', () => {
      expect(expandNeedsSegmentSwitcher('students_by_status')).toBe(true);
      expect(expandNeedsSegmentSwitcher('students_by_status_course')).toBe(true);
      expect(expandNeedsSegmentSwitcher('needs_attention')).toBe(true);
      expect(expandNeedsSegmentSwitcher('lesson_dropoff')).toBe(true);
      expect(expandNeedsSegmentSwitcher('cohort_health')).toBe(false);
      expect(expandNeedsSegmentSwitcher('overdue')).toBe(false);
      expect(expandNeedsSegmentSwitcher('score_distribution')).toBe(false);
      expect(expandNeedsSegmentSwitcher('kpi_overdue')).toBe(false);
    });
  });
});
