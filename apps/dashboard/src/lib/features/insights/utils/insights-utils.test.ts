import { describe, expect, it } from 'vitest';
import {
  attemptedByExercise,
  cohortHealth,
  countActiveLearnerFilters,
  defaultCourseId,
  defaultExerciseId,
  dimensionLabel,
  fillRowSpans,
  focusCourse,
  formatCount,
  formatPercent,
  formatUpdatedAgo,
  isInsightsStatus,
  isLearnerFilterValue,
  isLearnerSort,
  isWidgetVisible,
  learnerQueryParts,
  oldestGeneratedAt,
  passTone,
  percentOf,
  pivotLearnerExercises,
  resolveWidgetSpec,
  scoreTone,
  toChartPoints,
  toDonutSegments,
  toHbarItems,
  toHealthSegments,
  toSeriesPoints,
  visibleExerciseColumns,
  widgetUsesPlaceholder
} from './insights-utils';
import type {
  InsightsCourseStructure,
  InsightsDashboard,
  InsightsResult,
  InsightsRow,
  InsightsSelection,
  InsightsWidget
} from './types';

const mockTranslate = (key: string, vars?: Record<string, string | number>) => {
  if (vars) {
    let result = key;
    for (const [k, v] of Object.entries(vars)) {
      result += `:${k}=${v}`;
    }
    return result;
  }
  return key;
};

describe('insights-utils', () => {
  describe('resolveWidgetSpec', () => {
    const baseWidget: InsightsWidget = {
      id: 'test-widget',
      titleKey: 'test',
      viz: 'column',
      span: 12,
      courseMode: 'any',
      requires: [],
      spec: {
        source: 'cohort_learner',
        dimensions: [],
        measures: [{ metric: 'rows', agg: 'count' }],
        filters: [{ field: 'course', op: 'eq', value: '$course' }]
      }
    };

    it('fills $course placeholder when selection has courseId', () => {
      const selection: InsightsSelection = { courseId: 'c1', learnerId: null, exerciseId: null };
      const spec = resolveWidgetSpec(baseWidget, selection);
      expect(spec).not.toBeNull();
      expect(spec?.filters).toEqual([{ field: 'course', op: 'eq', value: 'c1' }]);
    });

    it('returns null when a placeholder is required but missing from selection', () => {
      const selection: InsightsSelection = { courseId: null, learnerId: null, exerciseId: null };
      const spec = resolveWidgetSpec(baseWidget, selection);
      expect(spec).toBeNull();
    });

    it('appends a course filter for courseMode: any only when a course is picked, and never twice', () => {
      const widgetWithoutCourseFilter: InsightsWidget = {
        ...baseWidget,
        spec: {
          source: 'cohort_learner',
          measures: [{ metric: 'rows', agg: 'count' }],
          filters: []
        }
      };
      const selectionWithCourse: InsightsSelection = { courseId: 'c1', learnerId: null, exerciseId: null };
      const spec = resolveWidgetSpec(widgetWithoutCourseFilter, selectionWithCourse);
      expect(spec?.filters).toEqual([{ field: 'course', op: 'eq', value: 'c1' }]);

      // If already has course filter, do not duplicate
      const spec2 = resolveWidgetSpec(baseWidget, selectionWithCourse);
      expect(spec2?.filters).toEqual([{ field: 'course', op: 'eq', value: 'c1' }]);
    });
  });

  describe('widgetUsesPlaceholder', () => {
    it('detects placeholders in filters', () => {
      const widget: InsightsWidget = {
        id: 'w1',
        titleKey: 'w1',
        viz: 'line',
        span: 6,
        courseMode: 'single',
        requires: [],
        spec: {
          source: 'learner',
          measures: [],
          filters: [{ field: 'learner', op: 'eq', value: '$learner' }]
        }
      };
      expect(widgetUsesPlaceholder(widget, 'learner')).toBe(true);
      expect(widgetUsesPlaceholder(widget, 'course')).toBe(false);
    });
  });

  describe('isWidgetVisible', () => {
    const mockDashboard: InsightsDashboard = {
      scope: {
        type: 'cohort',
        id: 'coh1',
        name: 'Cohort 1',
        learnerCount: 10,
        courses: [
          { id: 'c1', title: 'Course 1', isGrouped: false, hasPassRequired: false },
          { id: 'c2', title: 'Course 2', isGrouped: true, hasPassRequired: true }
        ]
      },
      widgets: [],
      structures: {},
      refreshIntervalSeconds: 60
    };

    it('handles all, single and any course modes', () => {
      const allWidget: InsightsWidget = {
        id: 'w1',
        titleKey: 'w',
        viz: 'column',
        span: 12,
        courseMode: 'all',
        requires: [],
        spec: { source: 'cohort_learner', measures: [] }
      };
      const singleWidget: InsightsWidget = {
        id: 'w2',
        titleKey: 'w',
        viz: 'column',
        span: 12,
        courseMode: 'single',
        requires: [],
        spec: { source: 'cohort_learner', measures: [] }
      };

      expect(isWidgetVisible(allWidget, mockDashboard, { courseId: null, learnerId: null, exerciseId: null })).toBe(
        true
      );
      expect(isWidgetVisible(allWidget, mockDashboard, { courseId: 'c1', learnerId: null, exerciseId: null })).toBe(
        false
      );

      expect(isWidgetVisible(singleWidget, mockDashboard, { courseId: null, learnerId: null, exerciseId: null })).toBe(
        false
      );
      expect(isWidgetVisible(singleWidget, mockDashboard, { courseId: 'c1', learnerId: null, exerciseId: null })).toBe(
        true
      );
    });

    it('checks grouping and pass_required requirements', () => {
      const groupedWidget: InsightsWidget = {
        id: 'w3',
        titleKey: 'w',
        viz: 'column',
        span: 12,
        courseMode: 'single',
        requires: ['grouping'],
        spec: { source: 'cohort_learner', measures: [] }
      };
      const passReqWidget: InsightsWidget = {
        id: 'w4',
        titleKey: 'w',
        viz: 'column',
        span: 12,
        courseMode: 'single',
        requires: ['pass_required'],
        spec: { source: 'cohort_learner', measures: [] }
      };

      // Course 1 has neither
      expect(isWidgetVisible(groupedWidget, mockDashboard, { courseId: 'c1', learnerId: null, exerciseId: null })).toBe(
        false
      );
      expect(isWidgetVisible(passReqWidget, mockDashboard, { courseId: 'c1', learnerId: null, exerciseId: null })).toBe(
        false
      );

      // Course 2 has both
      expect(isWidgetVisible(groupedWidget, mockDashboard, { courseId: 'c2', learnerId: null, exerciseId: null })).toBe(
        true
      );
      expect(isWidgetVisible(passReqWidget, mockDashboard, { courseId: 'c2', learnerId: null, exerciseId: null })).toBe(
        true
      );
    });
  });

  describe('defaults', () => {
    it('defaultCourseId picks the only course in a one-course cohort', () => {
      const singleCourseDash: InsightsDashboard = {
        scope: {
          type: 'cohort',
          id: 'coh1',
          name: 'Cohort 1',
          learnerCount: 5,
          courses: [{ id: 'c1', title: 'Course 1', isGrouped: false, hasPassRequired: false }]
        },
        widgets: [],
        structures: {},
        refreshIntervalSeconds: 60
      };
      expect(defaultCourseId(singleCourseDash)).toBe('c1');

      const multiCourseDash: InsightsDashboard = {
        ...singleCourseDash,
        scope: {
          ...singleCourseDash.scope,
          courses: [
            { id: 'c1', title: 'C1', isGrouped: false, hasPassRequired: false },
            { id: 'c2', title: 'C2', isGrouped: false, hasPassRequired: false }
          ]
        }
      };
      expect(defaultCourseId(multiCourseDash)).toBeNull();

      const courseDash: InsightsDashboard = {
        ...singleCourseDash,
        scope: { ...singleCourseDash.scope, type: 'course', id: 'c1' }
      };
      expect(defaultCourseId(courseDash)).toBe('c1');

      const orgDash: InsightsDashboard = {
        ...singleCourseDash,
        scope: {
          ...singleCourseDash.scope,
          type: 'org',
          courses: [
            { id: 'c1', title: 'C1', isGrouped: false, hasPassRequired: false },
            { id: 'c2', title: 'C2', isGrouped: false, hasPassRequired: false }
          ]
        }
      };
      expect(defaultCourseId(orgDash)).toBeNull();
    });

    it('defaultExerciseId prefers the last pass-required exercise', () => {
      const structure: InsightsCourseStructure = {
        courseId: 'c1',
        title: 'Course 1',
        items: [
          { id: 'e1', title: 'Exercise 1', type: 'EXERCISE', isPassRequired: false, passMark: null, isLocked: false },
          { id: 'e2', title: 'Exercise 2', type: 'EXERCISE', isPassRequired: true, passMark: 70, isLocked: false },
          { id: 'e3', title: 'Exercise 3', type: 'EXERCISE', isPassRequired: false, passMark: null, isLocked: false },
          { id: 'l1', title: 'Lesson 1', type: 'LESSON', isPassRequired: false, passMark: null, isLocked: false }
        ]
      };
      expect(defaultExerciseId(structure)).toBe('e2');

      const noPassReq: InsightsCourseStructure = {
        ...structure,
        items: [
          { id: 'e1', title: 'Exercise 1', type: 'EXERCISE', isPassRequired: false, passMark: null, isLocked: false },
          { id: 'e3', title: 'Exercise 3', type: 'EXERCISE', isPassRequired: false, passMark: null, isLocked: false }
        ]
      };
      expect(defaultExerciseId(noPassReq)).toBe('e3');
    });
  });

  describe('visibleExerciseColumns', () => {
    it('hides a locked, unattempted exercise; keeps a locked pass-required one; keeps a locked attempted one', () => {
      const structure: InsightsCourseStructure = {
        courseId: 'c1',
        title: 'C1',
        items: [
          { id: 'e1', title: 'E1', type: 'EXERCISE', isPassRequired: false, passMark: null, isLocked: false },
          { id: 'e2', title: 'E2', type: 'EXERCISE', isPassRequired: false, passMark: null, isLocked: true },
          { id: 'e3', title: 'E3', type: 'EXERCISE', isPassRequired: true, passMark: 80, isLocked: true },
          { id: 'e4', title: 'E4', type: 'EXERCISE', isPassRequired: false, passMark: null, isLocked: true }
        ]
      };
      const attempted = new Map([
        ['e1', 5],
        ['e4', 1]
      ]);

      const visible = visibleExerciseColumns(structure, attempted);
      expect(visible.map((item) => item.id)).toEqual(['e1', 'e3', 'e4']);
    });
  });

  describe('learnerQueryParts', () => {
    it('maps every filter value and sort correctly', () => {
      const parts = learnerQueryParts(
        { status: 'at_risk', activity: 'today', score: 'mid', flag: 'overdue' },
        'low_score'
      );
      expect(parts.filters).toEqual([
        { field: 'status', op: 'eq', value: 'at_risk' },
        { field: 'logged_in_today', op: 'is_true' },
        { field: 'avg_score_pct', op: 'gte', value: 50 },
        { field: 'avg_score_pct', op: 'lt', value: 70 },
        { field: 'is_overdue', op: 'is_true' }
      ]);
      expect(parts.sort).toEqual([{ field: 'avg_score_pct__value', dir: 'asc' }]);
    });
  });

  describe('pivotLearnerExercises', () => {
    it('pivots learner and exercise state correctly', () => {
      const result: InsightsResult = {
        source: 'assessment_result',
        columns: [],
        rows: [
          {
            learner_id: 'l1',
            exercise_id: 'e1',
            state__value: 'graded',
            best_score_pct__value: 85,
            passed__value: true
          },
          {
            learner_id: 'l1',
            exercise_id: 'e2',
            state__value: 'awaiting_grade',
            best_score_pct__value: null,
            passed__value: null
          }
        ],
        total: 2,
        generatedAt: '2026-10-22T00:00:00Z',
        ttlSeconds: 60
      };

      const cells = pivotLearnerExercises(result);
      expect(cells['l1']['e1']).toEqual({
        scorePct: 85,
        state: 'graded',
        passed: true
      });
      expect(cells['l1']['e2']).toEqual({
        scorePct: null,
        state: 'awaiting_grade',
        passed: null
      });
    });
  });

  describe('toSeriesPoints', () => {
    it('sorts by rank and preserves series', () => {
      const result: InsightsResult = {
        source: 'cohort_learner',
        columns: [{ key: 'score', label: 'Score', role: 'measure', valueType: 'percent' }],
        rows: [
          {
            exercise_id: 'e2',
            exercise_label: 'E2',
            exercise_rank: 2,
            cohort_id: 'coh1',
            cohort_label: 'Coh1',
            score: 80
          },
          {
            exercise_id: 'e1',
            exercise_label: 'E1',
            exercise_rank: 1,
            cohort_id: 'coh1',
            cohort_label: 'Coh1',
            score: 90
          }
        ],
        total: 2,
        generatedAt: '2026-10-22T00:00:00Z',
        ttlSeconds: 60
      };

      const { points, seriesKeys } = toSeriesPoints(result, 'exercise', 'cohort', 'score', mockTranslate);
      expect(points.map((p) => p.rank)).toEqual([1, 2]);
      expect(seriesKeys).toEqual([{ key: 'coh1', label: 'Coh1' }]);
    });
  });

  describe('fillRowSpans', () => {
    const panel = (id: string, span: InsightsWidget['span']): InsightsWidget => ({
      id,
      titleKey: id,
      viz: 'table',
      span,
      courseMode: 'any',
      requires: [],
      spec: { source: 'learner', dimensions: [], measures: [{ metric: 'rows', agg: 'count' }], filters: [] }
    });

    const spansOf = (widgets: InsightsWidget[]) => Object.fromEntries(fillRowSpans(widgets));

    it('keeps preset spans when every row is already full', () => {
      expect(spansOf([panel('a', 7), panel('b', 5), panel('c', 12), panel('d', 6), panel('e', 6)])).toEqual({
        a: 7,
        b: 5,
        c: 12,
        d: 6,
        e: 6
      });
    });

    it('widens the last widget of a row the next widget does not fit into', () => {
      expect(spansOf([panel('status', 5), panel('needs', 5), panel('overdue', 7), panel('learners', 12)])).toEqual({
        status: 5,
        needs: 7,
        overdue: 12,
        learners: 12
      });
    });

    it('widens two 7-column widgets that cannot share a row', () => {
      expect(spansOf([panel('progression', 7), panel('sections', 7)])).toEqual({ progression: 12, sections: 12 });
    });

    it('widens the final widget when the last row is short', () => {
      expect(spansOf([panel('a', 12), panel('b', 4)])).toEqual({ a: 12, b: 12 });
    });

    it('returns nothing for no widgets', () => {
      expect(fillRowSpans([]).size).toBe(0);
    });
  });

  describe('cohortHealth', () => {
    it('determines health based on completed, at_risk, and average score thresholds', () => {
      // Completed if >= 95%
      expect(cohortHealth({ rows__count: 100, is_completed_all__count_if: 95 })).toBe('completed');

      // At risk if >= 20%
      expect(cohortHealth({ rows__count: 100, is_completed_all__count_if: 50, is_at_risk__count_if: 20 })).toBe(
        'at_risk'
      );

      // Lagging if score < 65
      expect(
        cohortHealth({
          rows__count: 100,
          is_completed_all__count_if: 10,
          is_at_risk__count_if: 5,
          avg_score_pct__avg: 60
        })
      ).toBe('lagging');

      // Otherwise on_track
      expect(
        cohortHealth({
          rows__count: 100,
          is_completed_all__count_if: 10,
          is_at_risk__count_if: 5,
          avg_score_pct__avg: 75
        })
      ).toBe('on_track');
    });
  });

  describe('formatting & timestamps', () => {
    it('formatUpdatedAgo handles both sides of 60 seconds', () => {
      const now = Date.parse('2026-10-22T12:00:00Z');
      const justNow = '2026-10-22T11:59:30Z';
      const threeMinAgo = '2026-10-22T11:57:00Z';

      expect(formatUpdatedAgo(justNow, now, mockTranslate)).toBe('insights.updated_seconds_ago:count=30');
      expect(formatUpdatedAgo(threeMinAgo, now, mockTranslate)).toBe('insights.updated_minutes_ago:count=3');
    });

    it('oldestGeneratedAt selects the stalest timestamp', () => {
      const results: InsightsResult[] = [
        {
          source: 'test',
          columns: [],
          rows: [],
          total: 0,
          generatedAt: '2026-10-22T10:00:00Z',
          ttlSeconds: 60
        },
        {
          source: 'test',
          columns: [],
          rows: [],
          total: 0,
          generatedAt: '2026-10-22T09:00:00Z',
          ttlSeconds: 60
        },
        {
          source: 'test',
          columns: [],
          rows: [],
          total: 0,
          generatedAt: '2026-10-22T11:00:00Z',
          ttlSeconds: 60
        }
      ];

      expect(oldestGeneratedAt(results)).toBe('2026-10-22T09:00:00Z');
      expect(oldestGeneratedAt([])).toBeNull();
    });

    it('formats counts, percentages and tones', () => {
      expect(formatPercent(85.4)).toBe('85%');
      expect(formatPercent(null)).toBe('–');
      expect(formatCount(1234)).toBe('1,234');
      expect(formatCount(null)).toBe('–');
      expect(percentOf(10, 50)).toBe(20);
      expect(percentOf(null, 50)).toBeNull();

      expect(scoreTone(95)).toBe('success');
      expect(scoreTone(85)).toBe('info');
      expect(scoreTone(75)).toBe('warning');
      expect(scoreTone(45)).toBe('danger');
      expect(scoreTone(null)).toBe('muted');

      expect(passTone(75, 70)).toBe('success');
      expect(passTone(65, 70)).toBe('danger');
    });
  });
});
