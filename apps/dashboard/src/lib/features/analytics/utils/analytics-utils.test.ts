import { ANALYTICS_LIMITS } from '@cio/utils/constants/analytics';
import { describe, expect, it } from 'vitest';

import {
  canReturnToAllCourses,
  chartedCohorts,
  clampRangeToDays,
  cleanWidgetTitle,
  cohortHealth,
  cohortOptionsFromResult,
  cohortOptionsFromSeries,
  cycleColor,
  defaultCohortIds,
  dropoffTone,
  emptyCohortNames,
  exercisesPassedTone,
  fillRowSpans,
  formatCount,
  formatKpi,
  formatPercent,
  groupedBandPadding,
  formatPointsDelta,
  formatShortDate,
  formatUpdatedAgo,
  groupScoreDisplay,
  growthYMax,
  seatUsage,
  hasStudents,
  hasNoStudents,
  histogramPoints,
  isEmptyResult,
  isNowCard,
  isRangeWithinDays,
  latestScore,
  studentCoursesSpec,
  studentFooterLabel,
  studentPageRange,
  studentQueryParts,
  studentScoresSpec,
  nextSort,
  nowAtLabel,
  oldestGeneratedAt,
  FIRST_PAGE,
  pagerOwnerId,
  pageAfterEmptyResult,
  pageGroupsOf,
  passTone,
  percentOf,
  pivotStudentExercises,
  questionHint,
  rangeOptions,
  scopeEmptyState,
  scoreTone,
  sectionLabel,
  SERIES_COLORS,
  specRequestKey,
  steepestDrop,
  toDonutSegments,
  toHealthSegments,
  toSelectedStudent,
  toSeriesPoints,
  visibleExerciseColumns,
  widgetEmptyState,
  widgetNotes,
  widgetPaginationLabel,
  widgetPaginationTarget,
  widgetTitle
} from './analytics-utils';
import { resolveWidgetSpec } from '@cio/utils/analytics';
import type {
  AnalyticsCourseStructure,
  AnalyticsDashboard,
  AnalyticsResult,
  AnalyticsRow,
  AnalyticsScopeSummary,
  AnalyticsSelection,
  AnalyticsSpec,
  AnalyticsWidget,
  AnalyticsWidgetContext
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

function resultOf(rows: AnalyticsRow[], columns: AnalyticsResult['columns'] = []): AnalyticsResult {
  return { source: 'test', columns, rows, total: rows.length, generatedAt: '2026-10-23T10:00:00Z', ttlSeconds: 30 };
}

function widgetOf(id: string, spec: Partial<AnalyticsWidget['spec']> = {}): AnalyticsWidget {
  return {
    id,
    titleKey: `analytics.widgets.${id}.title`,
    viz: 'table',
    span: 12,
    courseMode: 'any',
    breakdown: 'core',
    requires: [],
    usesRange: false,
    spec: {
      source: 'student',
      dimensions: [],
      measures: [],
      filters: [],
      sort: [],
      limit: 100,
      page: 1,
      range: 'all',
      ...spec
    }
  } as AnalyticsWidget;
}

const widgetContext: AnalyticsWidgetContext = {
  scopeType: 'cohort',
  scopeId: 'coh1',
  orgSlug: 'acme',
  range: 'all',
  courseCount: 1,
  courseSelected: false,
  cohortCount: 8,
  studentCount: 40,
  emptyCohorts: null
};

describe('analytics-utils', () => {
  describe('request sharing', () => {
    it('gives specs that differ only in key order one key, and keeps refreshes apart', () => {
      const scope = { type: 'cohort' as const, id: 'coh1' };
      const spec = widgetOf('a', { dimensions: ['course'] }).spec;
      const reordered = Object.fromEntries(Object.entries(spec).reverse()) as AnalyticsSpec;

      expect(specRequestKey(scope, reordered, false)).toBe(specRequestKey(scope, spec, false));
      expect(specRequestKey(scope, spec, true)).not.toBe(specRequestKey(scope, spec, false));
    });
  });

  describe('widgetTitle and cleanWidgetTitle', () => {
    it('strips a trailing comma when the exercise placeholder is empty', () => {
      expect(cleanWidgetTitle('Score distribution, ')).toBe('Score distribution');
      expect(cleanWidgetTitle('Scores by exercise, ')).toBe('Scores by exercise');
      expect(cleanWidgetTitle('Score distribution, Quiz 1')).toBe('Score distribution, Quiz 1');
    });

    it('formats widget titles without trailing commas', () => {
      const widget: AnalyticsWidget = {
        ...widgetOf('exercise_score_distribution'),
        titleKey: 'analytics.widgets.exercise_score_distribution.title'
      };
      const translate = (_key: string, vars?: Record<string, string | number>) =>
        vars?.exercise ? `Score distribution, ${vars.exercise}` : 'Score distribution, ';

      const emptyTitle = widgetTitle(
        widget,
        null,
        {
          courseId: null,
          exerciseId: null,
          range: 'all',
          breakdown: 'courses',
          cohortIds: null,
          pages: {}
        },
        translate
      );

      expect(emptyTitle).toBe('Score distribution');
    });
  });

  describe('visibleExerciseColumns', () => {
    it('hides a locked, unattempted exercise; keeps a locked pass-required one; keeps a locked attempted one', () => {
      const structure: AnalyticsCourseStructure = {
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

  describe('studentQueryParts', () => {
    it('maps every filter value', () => {
      const parts = studentQueryParts({ status: 'at_risk', activity: 'today', score: 'mid', flag: 'overdue' });
      expect(parts.filters).toEqual([
        { field: 'status', op: 'eq', value: 'at_risk' },
        { field: 'logged_in_today', op: 'is_true' },
        { field: 'avg_score_pct', op: 'gte', value: 50 },
        { field: 'avg_score_pct', op: 'lt', value: 70 },
        { field: 'is_overdue', op: 'is_true' }
      ]);
    });
  });

  describe('pivotStudentExercises', () => {
    it('pivots student and exercise state correctly', () => {
      const result: AnalyticsResult = {
        source: 'assessment_result',
        columns: [],
        rows: [
          {
            student_id: 'l1',
            exercise_id: 'e1',
            state__value: 'graded',
            best_score_pct__value: 85,
            passed__value: true
          },
          {
            student_id: 'l1',
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

      const cells = pivotStudentExercises(result);
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
      const result: AnalyticsResult = {
        source: 'cohort_student',
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
    const panel = (id: string, span: AnalyticsWidget['span']): AnalyticsWidget => ({
      id,
      titleKey: id,
      viz: 'table',
      span,
      courseMode: 'any',
      breakdown: 'core',
      requires: [],
      usesRange: false,
      spec: { source: 'student', dimensions: [], measures: [{ metric: 'rows', agg: 'count' }], filters: [] }
    });

    const spansOf = (widgets: AnalyticsWidget[]) => Object.fromEntries(fillRowSpans(widgets));

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
      expect(spansOf([panel('status', 5), panel('needs', 5), panel('overdue', 7), panel('students', 12)])).toEqual({
        status: 5,
        needs: 7,
        overdue: 12,
        students: 12
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

  describe('scoreTone', () => {
    it('uses the prototype heat scale', () => {
      expect(scoreTone(70)).toBe('success');
      expect(scoreTone(69)).toBe('warning');
      expect(scoreTone(50)).toBe('warning');
      expect(scoreTone(49)).toBe('danger');
      expect(scoreTone(null)).toBe('muted');
    });
  });

  describe('dropoffTone', () => {
    it('is amber below 75% and red below 50%', () => {
      expect(dropoffTone(80)).toBe('info');
      expect(dropoffTone(74)).toBe('warning');
      expect(dropoffTone(49)).toBe('danger');
    });
  });

  describe('cohortHealth', () => {
    it('reads cohort_summary rows and has no health without students', () => {
      expect(cohortHealth({ students__value: 0 })).toBeNull();
      expect(cohortHealth({ students__value: 20, completed_students__value: 19 })).toBe('completed');
      expect(cohortHealth({ students__value: 20, at_risk_students__value: 4 })).toBe('at_risk');
      expect(cohortHealth({ students__value: 20, avg_score_pct__value: 60 })).toBe('lagging');
      expect(cohortHealth({ students__value: 20, avg_score_pct__value: 80 })).toBe('on_track');
    });

    it('sums students per health in the prototype order and skips empty cohorts', () => {
      const result = resultOf([
        { cohort_id: 'a', students__value: 10, avg_score_pct__value: 80 },
        { cohort_id: 'b', students__value: 5, completed_students__value: 5 },
        { cohort_id: 'c', students__value: 0 }
      ]);

      expect(toHealthSegments(result, mockTranslate).map(({ key, value }) => [key, value])).toEqual([
        ['on_track', 10],
        ['completed', 5]
      ]);
    });
  });

  describe('toDonutSegments', () => {
    it('orders statuses as the prototype legend and drops zeros', () => {
      const result = resultOf(
        [
          { status_id: 'at_risk', rows__count: 3 },
          { status_id: 'completed', rows__count: 0 },
          { status_id: 'on_track', rows__count: 7 }
        ],
        [{ key: 'rows__count', label: 'Students', role: 'measure', valueType: 'integer' }]
      );

      expect(toDonutSegments(result, 'status', mockTranslate).map((segment) => segment.key)).toEqual([
        'on_track',
        'at_risk'
      ]);
    });
  });

  describe('sectionLabel', () => {
    const structure = {
      courseId: 'c1',
      isGrouped: true,
      sections: [
        { id: 's1', title: 'Intake', rank: 0 },
        { id: 's2', title: 'Credits', rank: 1 }
      ],
      items: []
    } as AnalyticsCourseStructure;

    it('numbers sections by outline position', () => {
      expect(sectionLabel('s2', structure, mockTranslate, { withTitle: false })).toBe(
        'analytics.section_number:number=2'
      );
      expect(sectionLabel('s1', structure, mockTranslate, { withTitle: true })).toBe(
        'analytics.section_with_title:number=1:title=Intake'
      );
      expect(sectionLabel(null, structure, mockTranslate, { withTitle: true })).toBe('analytics.not_in_section');
    });
  });

  describe('steepestDrop', () => {
    it('finds the largest fall between neighbours', () => {
      const items = [
        { key: 'a', label: 'Credits', value: 71, display: '71%' },
        { key: 'b', label: 'Schedule C', value: 58, display: '58%' },
        { key: 'c', label: 'Review', value: 54, display: '54%' }
      ];

      expect(steepestDrop(items)).toEqual({ from: 'Credits', to: 'Schedule C' });
      expect(steepestDrop([...items].reverse())).toBeNull();
    });
  });

  describe('formatPointsDelta', () => {
    it('colours movement and stays silent without a baseline', () => {
      expect(formatPointsDelta(45, 41, 'compared', null, mockTranslate)).toEqual({
        description: 'analytics.kpi.delta.vs_last_week.up:count=4:days=7',
        trend: 'up'
      });
      expect(formatPointsDelta(40, 46, 'gained', null, mockTranslate).trend).toBe('down');
      expect(formatPointsDelta(40, 40.2, 'gained', null, mockTranslate).trend).toBe('flat');
      expect(formatPointsDelta(40, null, 'gained', null, mockTranslate)).toEqual({});
    });

    it('words the change by the range', () => {
      expect(formatPointsDelta(70, 64, 'gained', 30, mockTranslate).description).toBe(
        'analytics.kpi.delta.in_days.up:count=6:days=30'
      );
      expect(formatPointsDelta(40, 44, 'compared', 90, mockTranslate).description).toBe(
        'analytics.kpi.delta.vs_days_ago.down:count=4:days=90'
      );
    });
  });

  describe('formatKpi', () => {
    const resultWith = (row: AnalyticsRow) => resultOf([row]);

    it('shows certificates on Completed only under All courses', () => {
      const row = { is_completed_all__count_if: 4, rows__count: 20, certificates__sum: 3 };
      const widget = widgetOf('kpi_completed');

      expect(
        formatKpi(widget, resultWith(row), mockTranslate, { courseSelected: false, rangeDays: null, hasStudents: true })
          .description
      ).toBe('analytics.kpi.completed_certified:percent=20%:count=3');
      expect(
        formatKpi(widget, resultWith(row), mockTranslate, { courseSelected: true, rangeDays: null, hasStudents: true })
          .description
      ).toBe('analytics.kpi.share_of_cohort:percent=20%');
    });

    it('turns Overdue red from 5% of students', () => {
      const widget = widgetOf('kpi_overdue');

      expect(
        formatKpi(widget, resultWith({ is_overdue__count_if: 1, rows__count: 40 }), mockTranslate, {
          courseSelected: false,
          rangeDays: null,
          hasStudents: true
        }).trend
      ).toBe('flat');
      expect(
        formatKpi(widget, resultWith({ is_overdue__count_if: 2, rows__count: 40 }), mockTranslate, {
          courseSelected: false,
          rangeDays: null,
          hasStudents: true
        }).trend
      ).toBe('down');
    });

    it('describes Pass rate with who took one and who still has to pass', () => {
      const row = { first_try_pass__pooled: 62.5, took_pass_mark__count_if: 16, has_still_to_pass__count_if: 3 };
      const display = formatKpi(widgetOf('kpi_first_try_pass'), resultWith(row), mockTranslate, {
        courseSelected: true,
        rangeDays: null,
        hasStudents: true
      });

      expect(display.value).toBe('63%');
      expect(display.description).toBe('analytics.kpi.first_try_context:took=16:still=3');
    });
  });

  describe('range', () => {
    const selection = {
      courseId: null,
      exerciseId: null,
      range: '30d' as const,
      breakdown: 'courses',
      cohortIds: null,
      pages: {}
    };

    it('puts the range only on widgets that follow it', () => {
      const following = { ...widgetOf('scores_by_exercise'), usesRange: true };
      const standing = widgetOf('course_details');

      expect(resolveWidgetSpec(following, selection)?.range).toBe('30d');
      expect(resolveWidgetSpec(standing, selection)?.range).toBe('all');
    });

    it('tags standing cards Now only while a range is selected', () => {
      expect(isNowCard(widgetOf('course_details'), '30d')).toBe(true);
      expect(isNowCard(widgetOf('course_details'), 'all')).toBe(false);
      expect(isNowCard({ ...widgetOf('logins_per_day'), usesRange: true }, '30d')).toBe(false);
    });

    it('offers All time first, then the Marketing ranges', () => {
      expect(rangeOptions(mockTranslate).map((option) => option.value)).toEqual(['all', '7d', '30d', '90d']);
    });

    it('locks every range wider than the plan allows', () => {
      const lockedByRange = rangeOptions(mockTranslate, 7).map((option) => [option.value, option.locked]);

      expect(lockedByRange).toEqual([
        ['all', true],
        ['7d', false],
        ['30d', true],
        ['90d', true]
      ]);
      expect(rangeOptions(mockTranslate).every((option) => !option.locked)).toBe(true);
    });

    it('clamps a remembered range to the widest one the plan allows', () => {
      expect(clampRangeToDays('90d', 7)).toBe('7d');
      expect(clampRangeToDays('30d', 30)).toBe('30d');
      expect(clampRangeToDays('all', 90)).toBe('90d');
      expect(clampRangeToDays('all', null)).toBe('all');
    });

    it('treats all time as wider than every history limit', () => {
      expect(isRangeWithinDays('all', null)).toBe(true);
      expect(isRangeWithinDays('all', 90)).toBe(false);
      expect(isRangeWithinDays('7d', 7)).toBe(true);
      expect(isRangeWithinDays('30d', 7)).toBe(false);
    });

    it('rewords KPIs for a range', () => {
      const logins = formatKpi(
        widgetOf('kpi_logged_in_today'),
        resultOf([{ logged_in_today__count_if: 2, logged_in_period__count_if: 30, rows__count: 40 }]),
        mockTranslate,
        { courseSelected: false, rangeDays: 30, hasStudents: true }
      );
      const enrolled = formatKpi(
        widgetOf('kpi_enrolled'),
        resultOf([{ rows__count: 120, enrolled_in_period__count_if: 12 }]),
        mockTranslate,
        { courseSelected: true, rangeDays: 30, hasStudents: true }
      );
      const certificates = formatKpi(
        widgetOf('kpi_certificates'),
        resultOf([{ is_certified__count_if: 50, certified_in_period__count_if: 0, is_completed__count_if: 60 }]),
        mockTranslate,
        { courseSelected: false, rangeDays: 7, hasStudents: true }
      );

      expect(logins.title).toBe('analytics.kpi.logged_in_days:days=30');
      expect(logins.value).toBe('30 / 40');
      expect(enrolled.description).toBe('analytics.kpi.enrolled_in_days:count=12:days=30');
      expect(enrolled.trend).toBe('up');
      expect(certificates).toMatchObject({ value: '50', trend: 'flat' });
    });
  });

  describe('student sheet specs', () => {
    it("reads one student's courses as a standing table", () => {
      const spec = studentCoursesSpec('p1', { page: 2, sort: { key: 'progress_pct__value', dir: 'desc' } });

      expect(spec.source).toBe('student_course');
      expect(spec.filters).toEqual([{ field: 'student', op: 'eq', value: 'p1' }]);
      expect(spec.range).toBe('all');
      expect(spec.page).toBe(2);
      expect(spec.limit).toBe(ANALYTICS_LIMITS.cardPageSize);
      expect(spec.sort).toEqual([{ field: 'progress_pct__value', dir: 'desc' }]);
      expect(studentCoursesSpec('p1', FIRST_PAGE).sort).toEqual([{ field: 'course', dir: 'asc' }]);
    });

    it("charts one student's scores in the picked course and range", () => {
      const spec = studentScoresSpec('p1', 'c1', '30d');

      expect(spec.filters).toEqual([
        { field: 'course', op: 'eq', value: 'c1' },
        { field: 'student', op: 'eq', value: 'p1' }
      ]);
      expect(spec.range).toBe('30d');
    });
  });

  describe('student selection', () => {
    it('reads a student from a table row and carries the original row', () => {
      const row = { student_id: 'p1', name__value: 'Ada' };
      expect(toSelectedStudent(row)).toEqual({ id: 'p1', name: 'Ada', row });
      expect(toSelectedStudent(undefined)).toBeNull();
    });
  });

  describe('cohort chart selection', () => {
    const seriesKeys = [
      { key: 'c1', label: 'Cohort 1' },
      { key: 'c2', label: 'Cohort 2' },
      { key: 'c3', label: 'Cohort 3' },
      { key: 'c4', label: 'Cohort 4' },
      { key: 'none', label: 'All students' }
    ];
    const cohortRows = [
      {
        cohort_id: 'c4',
        cohort_label: 'Cohort 4',
        students__value: 10,
        completed_students__value: 2,
        cohort_created_at__value: '2026-04-04T00:00:00Z'
      },
      {
        cohort_id: 'c3',
        cohort_label: 'Cohort 3',
        students__value: 10,
        completed_students__value: 10,
        cohort_created_at__value: '2026-04-03T00:00:00Z'
      },
      {
        cohort_id: 'c2',
        cohort_label: 'Cohort 2',
        students__value: 10,
        completed_students__value: 10,
        cohort_created_at__value: '2026-04-02T00:00:00Z'
      },
      {
        cohort_id: 'c1',
        cohort_label: 'Cohort 1',
        students__value: 10,
        completed_students__value: 10,
        cohort_created_at__value: '2026-04-01T00:00:00Z'
      }
    ];
    const cohorts = resultOf(cohortRows);
    const options = cohortOptionsFromResult(cohorts, mockTranslate);
    const directStudents = { key: 'none', label: 'analytics.legend.direct_students', dashed: false };

    it('reads every cohort option newest first with its student counts', () => {
      expect(options).toEqual([
        {
          id: 'c4',
          name: 'Cohort 4',
          students: 10,
          completedStudents: 2,
          createdAt: '2026-04-04T00:00:00Z'
        },
        {
          id: 'c3',
          name: 'Cohort 3',
          students: 10,
          completedStudents: 10,
          createdAt: '2026-04-03T00:00:00Z'
        },
        {
          id: 'c2',
          name: 'Cohort 2',
          students: 10,
          completedStudents: 10,
          createdAt: '2026-04-02T00:00:00Z'
        },
        {
          id: 'c1',
          name: 'Cohort 1',
          students: 10,
          completedStudents: 10,
          createdAt: '2026-04-01T00:00:00Z'
        }
      ]);
    });

    it('falls back to the chart series while the cohort summary loads', () => {
      expect(cohortOptionsFromSeries(seriesKeys)).toEqual([
        { id: 'c1', name: 'Cohort 1', students: null, completedStudents: null, createdAt: '' },
        { id: 'c2', name: 'Cohort 2', students: null, completedStudents: null, createdAt: '' },
        { id: 'c3', name: 'Cohort 3', students: null, completedStudents: null, createdAt: '' },
        { id: 'c4', name: 'Cohort 4', students: null, completedStudents: null, createdAt: '' }
      ]);
    });

    it('starts on the newest cohorts that have students', () => {
      expect(defaultCohortIds(options)).toEqual(['c4', 'c3', 'c2']);

      const withEmpty = cohortOptionsFromResult(
        resultOf([{ cohort_id: 'c4', cohort_label: 'Cohort 4', students__value: 0 }, ...cohortRows.slice(1)]),
        mockTranslate
      );

      expect(defaultCohortIds(withEmpty)).toEqual(['c3', 'c2', 'c1']);
      expect(defaultCohortIds(cohortOptionsFromSeries(seriesKeys))).toEqual(['c1', 'c2', 'c3']);
    });

    it('charts the default newest 3 cohorts and dashes the unfinished ones', () => {
      expect(chartedCohorts(seriesKeys, options, defaultCohortIds(options), mockTranslate)).toEqual([
        { key: 'c4', label: 'analytics.legend.in_progress:name=Cohort 4', dashed: true },
        { key: 'c3', label: 'Cohort 3', dashed: false },
        { key: 'c2', label: 'Cohort 2', dashed: false },
        directStudents
      ]);
    });

    it('charts an older cohort when the user picks it', () => {
      expect(chartedCohorts(seriesKeys, options, ['c1'], mockTranslate)).toEqual([
        { key: 'c1', label: 'Cohort 1', dashed: false },
        directStudents
      ]);
    });

    it('charts a selected cohort that is not on the loaded options page', () => {
      expect(chartedCohorts(seriesKeys, [options[0]], ['c1'], mockTranslate)).toEqual([
        { key: 'c1', label: 'Cohort 1', dashed: false },
        directStudents
      ]);
    });

    it('charts every selected cohort without the old cap', () => {
      expect(chartedCohorts(seriesKeys, options, ['c1', 'c2', 'c3', 'c4'], mockTranslate)).toEqual([
        { key: 'c4', label: 'analytics.legend.in_progress:name=Cohort 4', dashed: true },
        { key: 'c3', label: 'Cohort 3', dashed: false },
        { key: 'c2', label: 'Cohort 2', dashed: false },
        { key: 'c1', label: 'Cohort 1', dashed: false },
        directStudents
      ]);
    });

    it('keeps only direct students when no cohort is selected', () => {
      expect(chartedCohorts(seriesKeys, options, [], mockTranslate)).toEqual([directStudents]);
    });

    it('falls back to one direct student line for a course without cohorts', () => {
      expect(chartedCohorts([{ key: 'none', label: 'All students' }], [], ['c1'], mockTranslate)).toEqual([
        directStudents
      ]);
    });

    it('charts the selected series when the cohort summary has not loaded yet', () => {
      expect(chartedCohorts(seriesKeys, [], ['c1'], mockTranslate)).toEqual([
        { key: 'c1', label: 'Cohort 1', dashed: false },
        directStudents
      ]);
    });
  });

  describe('grouped bar width', () => {
    const barWidth = (plotWidth: number, groups: number, series: number) => {
      const padding = groupedBandPadding(plotWidth, groups, series);
      const step = plotWidth / (groups + padding);
      const groupWidth = step * (1 - padding);
      const seriesStep = groupWidth / (series + 0.08);

      return seriesStep * (1 - 0.08);
    };

    it('keeps the default padding when the bars already fit', () => {
      expect(groupedBandPadding(300, 4, 3)).toBe(0.2);
    });

    it('caps each bar at 40px when a page has few categories', () => {
      expect(barWidth(640, 4, 3)).toBeLessThanOrEqual(40.01);
      expect(barWidth(640, 2, 3)).toBeCloseTo(40, 0);
      expect(barWidth(1100, 4, 3)).toBeCloseTo(40, 0);
      expect(barWidth(900, 1, 3)).toBeLessThanOrEqual(40.01);
    });

    it('falls back to the default padding with nothing to draw', () => {
      expect(groupedBandPadding(0, 4, 3)).toBe(0.2);
      expect(groupedBandPadding(640, 0, 3)).toBe(0.2);
    });
  });

  describe('empty cohorts', () => {
    const emptyRows = resultOf([
      { cohort_id: 'c1', cohort_label: 'Cohort 1', students__value: 5 },
      { cohort_id: 'c2', cohort_label: 'Cohort 2', students__value: 0 },
      { cohort_id: 'c3', cohort_label: 'Cohort 3', students__value: 0 }
    ]);

    it('reads student counts without treating a missing count as students', () => {
      expect(hasStudents({ students__value: 1 })).toBe(true);
      expect(hasStudents({ students__value: 0 })).toBe(false);
      expect(hasStudents({})).toBe(false);
    });

    it('names the cohorts with no students', () => {
      expect(emptyCohortNames(emptyRows, mockTranslate)).toEqual({
        names: 'Cohort 2, Cohort 3',
        count: 2
      });
      expect(emptyCohortNames(resultOf([{ cohort_id: 'c1', students__value: 2 }]), mockTranslate)).toBeNull();
      expect(emptyCohortNames(null, mockTranslate)).toBeNull();
    });

    it('caps a long list and counts the rest', () => {
      const manyEmpty = resultOf([
        { cohort_id: 'c1', cohort_label: 'Cohort 1', students__value: 0 },
        { cohort_id: 'c2', cohort_label: 'Cohort 2', students__value: 0 },
        { cohort_id: 'c3', cohort_label: 'Cohort 3', students__value: 0 },
        { cohort_id: 'c4', cohort_label: 'Cohort 4', students__value: 0 }
      ]);

      expect(emptyCohortNames(manyEmpty, mockTranslate)).toEqual({
        names: 'analytics.names_and_more:names=Cohort 1, Cohort 2, Cohort 3:count=1',
        count: 4
      });
    });

    it('uses the exact empty-cohort total when only a named page is loaded', () => {
      const namedPage = {
        ...resultOf([
          { cohort_id: 'c1', cohort_label: 'Cohort 1', students__value: 0 },
          { cohort_id: 'c2', cohort_label: 'Cohort 2', students__value: 0 },
          { cohort_id: 'c3', cohort_label: 'Cohort 3', students__value: 0 }
        ]),
        total: 1200
      };

      expect(emptyCohortNames(namedPage, mockTranslate, { countFromTotal: true })).toEqual({
        names: 'analytics.names_and_more:names=Cohort 1, Cohort 2, Cohort 3:count=1197',
        count: 1200
      });
    });

    it('labels empty and ungraded cohorts instead of showing a score', () => {
      const emptyRow = { students__value: 0 };
      const gradedRow = { students__value: 4 };

      expect(groupScoreDisplay(emptyRow, null, 'students__value', mockTranslate)).toBe('analytics.no_students_yet');
      expect(groupScoreDisplay(gradedRow, null, 'students__value', mockTranslate)).toBe('analytics.no_graded_attempts');
      expect(groupScoreDisplay(gradedRow, 75, 'students__value', mockTranslate)).toBe('75%');
    });

    it('reads the student count from the row shape the widget uses', () => {
      const emptyCourseRow = { rows__count: 0 };
      const courseRow = { rows__count: 4 };

      expect(groupScoreDisplay(emptyCourseRow, null, 'rows__count', mockTranslate)).toBe('analytics.no_students_yet');
      expect(groupScoreDisplay(courseRow, null, 'rows__count', mockTranslate)).toBe('analytics.no_graded_attempts');
      expect(groupScoreDisplay(courseRow, 75, 'rows__count', mockTranslate)).toBe('75%');
    });
  });

  describe('widgetNotes', () => {
    it('shows the reasons note on cohort and course scopes only', () => {
      const widget = widgetOf('needs_attention');

      expect(widgetNotes(widget, null, widgetContext, mockTranslate)).toEqual(['analytics.notes.needs_attention']);
      expect(widgetNotes(widget, null, { ...widgetContext, scopeType: 'org' }, mockTranslate)).toEqual([]);
    });

    it('tells you a cohort opens its dashboard, and leaves the count to the pager', () => {
      const result = resultOf([{ cohort_id: 'a' }, { cohort_id: 'b' }]);
      const glance = { ...widgetOf('cohorts_at_a_glance'), pageGroup: 'cohorts' };

      expect(widgetNotes(glance, result, widgetContext, mockTranslate)).toEqual(['analytics.notes.cohorts_select']);
    });

    it('tells you a course opens its dashboard, and leaves the count to the pager', () => {
      const result = resultOf([{ course_id: 'a' }, { course_id: 'b' }]);
      const glance = { ...widgetOf('courses_at_a_glance'), pageGroup: 'courses_breakdown' };

      expect(widgetNotes(glance, result, widgetContext, mockTranslate)).toEqual(['analytics.notes.courses_select']);
    });

    it('says when a chart that should show every row reached the safety cap', () => {
      const result = { ...resultOf([{ lesson_id: 'l1' }, { lesson_id: 'l2' }]), total: 1200 };

      expect(widgetNotes(widgetOf('lesson_dropoff'), result, widgetContext, mockTranslate)).toContain(
        'analytics.notes.showing_first:shown=2:total=1200'
      );
      expect(widgetNotes(widgetOf('hardest_questions'), result, widgetContext, mockTranslate)).toEqual([
        'analytics.notes.hardest_questions'
      ]);
    });

    it('names the cohorts a filtered chart leaves out from the empty-cohort query', () => {
      const emptyCohorts = resultOf([{ cohort_id: 'b', cohort_label: 'Cohort B', students__value: 0 }]);
      const chartPage = resultOf([{ cohort_id: 'a', cohort_label: 'Cohort A', students__value: 3 }]);

      const chart = { ...widgetOf('cohorts_in_course'), pageGroup: 'cohorts' };

      expect(widgetNotes(chart, chartPage, { ...widgetContext, emptyCohorts }, mockTranslate)).toEqual([
        'analytics.notes.not_charted_empty:names=Cohort B:count=1'
      ]);
    });

    it('names the cohorts the health donut leaves out', () => {
      const result = resultOf([
        { cohort_id: 'a', cohort_label: 'Cohort A', students__value: 3 },
        { cohort_id: 'b', cohort_label: 'Cohort B', students__value: 0 }
      ]);

      expect(widgetNotes(widgetOf('cohort_health'), result, widgetContext, mockTranslate)).toEqual([
        'analytics.notes.cohorts_in_table:count=2',
        'analytics.notes.not_counted_empty:names=Cohort B:count=1'
      ]);
    });

    it('names the courses in the course score chart table', () => {
      const result = resultOf([{ course_id: 'c1' }, { course_id: 'c2' }, { course_id: 'c3' }]);

      expect(widgetNotes(widgetOf('avg_score_by_course'), result, widgetContext, mockTranslate)).toEqual([
        'analytics.notes.courses_in_table:count=3'
      ]);
    });

    it('reuses the empty-cohort query for the scores-by-cohort note', () => {
      const emptyCohorts = resultOf([{ cohort_id: 'b', cohort_label: 'Cohort B', students__value: 0 }]);

      expect(
        widgetNotes(
          widgetOf('scores_by_exercise_by_cohort'),
          resultOf([{ exercise_id: 'e1', cohort_id: 'a', best_score_pct__avg: 70 }]),
          { ...widgetContext, emptyCohorts },
          mockTranslate
        )
      ).toEqual(['analytics.notes.not_charted_empty:names=Cohort B:count=1']);
    });

    it('names direct students when a mixed course charts them as their own line', () => {
      const result = resultOf([
        { exercise_id: 'e1', cohort_id: null, best_score_pct__avg: 60 },
        { exercise_id: 'e1', cohort_id: 'a', best_score_pct__avg: 70 }
      ]);

      expect(widgetNotes(widgetOf('scores_by_exercise_by_cohort'), result, widgetContext, mockTranslate)).toContain(
        'analytics.notes.direct_students_charted'
      );
    });

    it('explains an empty pass-rate column', () => {
      const result = resultOf(
        [{ course_id: 'c1', first_try_pass__pooled: null }],
        [{ key: 'first_try_pass__pooled', label: '', role: 'measure', valueType: 'percent' }]
      );

      expect(widgetNotes(widgetOf('course_details'), result, widgetContext, mockTranslate)).toContain(
        'analytics.notes.no_pass_mark'
      );
    });

    it('switches the students note with the picker and scope', () => {
      const widget = widgetOf('students');

      expect(widgetNotes(widget, null, widgetContext, mockTranslate)).toEqual(['analytics.notes.students.all_courses']);
      expect(widgetNotes(widget, null, { ...widgetContext, courseSelected: true }, mockTranslate)).toEqual([
        'analytics.notes.students.one_course'
      ]);
      expect(widgetNotes(widget, null, { ...widgetContext, scopeType: 'course' }, mockTranslate)).toEqual([
        'analytics.notes.students.course_scope'
      ]);
    });
  });

  describe('canReturnToAllCourses', () => {
    it('only returns to all courses when the dashboard itself is on all courses', () => {
      expect(canReturnToAllCourses(null, 'course-1')).toBe(true);
      expect(canReturnToAllCourses('course-1', 'course-1')).toBe(false);
      expect(canReturnToAllCourses(null, null)).toBe(false);
    });
  });

  describe('studentPageRange', () => {
    it('numbers the students on the current page', () => {
      expect(studentPageRange(1, 10)).toEqual({ from: 1, to: 10 });
      expect(studentPageRange(3, 4)).toEqual({ from: 21, to: 24 });
    });
  });

  describe('studentFooterLabel', () => {
    it('returns null when single page and unfiltered (content not paged)', () => {
      const label = studentFooterLabel(
        { pageCount: 1, total: 5, count: 5, from: 1, to: 5, scopeType: 'cohort' },
        mockTranslate
      );
      expect(label).toBeNull();
    });

    it('shows matching count and total in scope when single page and filtered', () => {
      const label = studentFooterLabel(
        { pageCount: 1, total: 3, count: 5, from: 1, to: 3, scopeType: 'course' },
        mockTranslate
      );
      expect(label).toBe('analytics.students.showing_filtered.course:total=3:count=5');
    });

    it('shows paged range and total in scope when multiple pages and unfiltered', () => {
      const label = studentFooterLabel(
        { pageCount: 3, total: 50, count: 50, from: 1, to: 20, scopeType: 'org' },
        mockTranslate
      );
      expect(label).toBe('analytics.students.showing_paged.org:from=1:to=20:count=50');
    });

    it('shows paged range, matching count, and total in scope when multiple pages and filtered', () => {
      const label = studentFooterLabel(
        { pageCount: 2, total: 30, count: 50, from: 21, to: 30, scopeType: 'cohort' },
        mockTranslate
      );
      expect(label).toBe('analytics.students.showing.cohort:from=21:to=30:total=30:count=50');
    });

    it('defaults unknown scope type to cohort when filtered', () => {
      const label = studentFooterLabel(
        { pageCount: 1, total: 1, count: 2, from: 1, to: 1, scopeType: 'unknown' },
        mockTranslate
      );
      expect(label).toBe('analytics.students.showing_filtered.cohort:total=1:count=2');
    });
  });

  describe('small formatters', () => {
    it('leaves unscored students out of histograms', () => {
      const result = resultOf(
        [
          { score_bucket_10_id: null, rows__count: 4 },
          { score_bucket_10_id: 7, rows__count: 2 }
        ],
        [{ key: 'rows__count', label: '', role: 'measure', valueType: 'integer' }]
      );

      expect(histogramPoints(result, 'score_bucket_10', mockTranslate)).toHaveLength(1);
    });

    it('formats now-at, exercises passed, question hints, latest score and the growth axis', () => {
      expect(nowAtLabel(100, 'Credits', mockTranslate)).toBe('analytics.finished');
      expect(nowAtLabel(40, 'Credits', mockTranslate)).toBe('Credits');
      expect(nowAtLabel(40, null, mockTranslate)).toBe('–');

      expect(exercisesPassedTone(3, 3, 0)).toBe('success');
      expect(exercisesPassedTone(1, 3, 1)).toBe('danger');
      expect(exercisesPassedTone(0, 3, 0)).toBe('muted');

      expect(questionHint('Credits', 'B', mockTranslate)).toBe(
        'analytics.question_hint.context_and_answer:context=Credits:answer=B'
      );
      expect(questionHint(null, null, mockTranslate)).toBeUndefined();

      expect(latestScore(resultOf([{ best_score_pct__value: 60 }, { best_score_pct__value: null }]))).toBe(60);

      const points = [{ key: 'w1', label: '', rank: 0, members_total__value: 120 }];
      expect(growthYMax(points, 'members_total__value', 2000, 5000)).toBe(5000);
      expect(growthYMax(points, 'members_total__value', null, null)).toBe(120);
    });

    it('seatUsage reads seats from the scope summary and the limit from the plan', () => {
      expect(seatUsage({ seatsUsed: 120, seatsNotJoined: 20 }, { used: 118, limit: 200 })).toEqual({
        used: 120,
        limit: 200,
        notJoined: 20
      });
      expect(seatUsage(null, { used: 118, limit: 200 })).toEqual({ used: 118, limit: 200, notJoined: 0 });
      expect(seatUsage({ seatsUsed: null, seatsNotJoined: null }, { used: 5, limit: 10 })).toEqual({
        used: 5,
        limit: 10,
        notJoined: 0
      });
      expect(seatUsage({ seatsUsed: 120, seatsNotJoined: 20 }, { used: 118, limit: null })).toBeNull();
      expect(seatUsage({ seatsUsed: 120, seatsNotJoined: 20 }, undefined)).toBeNull();
    });

    it('cycleColor preserves base palette on first pass and dynamically tweaks deeper passes', () => {
      expect(cycleColor(0)).toBe(SERIES_COLORS[0]);
      expect(cycleColor(SERIES_COLORS.length - 1)).toBe(SERIES_COLORS[SERIES_COLORS.length - 1]);
      expect(cycleColor(SERIES_COLORS.length)).toBe(`color-mix(in oklch, ${SERIES_COLORS[0]} 58%, white)`);
      expect(cycleColor(SERIES_COLORS.length * 2)).toBe(`color-mix(in oklch, ${SERIES_COLORS[0]} 54%, black)`);
      expect(cycleColor(SERIES_COLORS.length * 3)).toBe(`color-mix(in oklch, ${SERIES_COLORS[0]} 42.96%, white)`);
      expect(cycleColor(SERIES_COLORS.length * 4)).toBe(`color-mix(in oklch, ${SERIES_COLORS[0]} 40%, black)`);
      expect(cycleColor(SERIES_COLORS.length * 10)).toBe(`color-mix(in oklch, ${SERIES_COLORS[0]} 22.5%, black)`);
      expect(cycleColor(SERIES_COLORS.length * 20)).toBe(`color-mix(in oklch, ${SERIES_COLORS[0]} 13.01%, black)`);
    });
  });

  describe('formatting & timestamps', () => {
    it('formatShortDate handles ISO date-only strings and invalid values', () => {
      expect(formatShortDate(undefined)).toBe('–');
      expect(formatShortDate(123 as unknown as string)).toBe('–');
      expect(formatShortDate('not-a-date')).toBe('–');
      expect(formatShortDate('2026-10-29', 'en-US')).toContain('Oct 29');
    });
    it('formatUpdatedAgo handles both sides of 60 seconds', () => {
      const now = Date.parse('2026-10-22T12:00:00Z');
      const justNow = '2026-10-22T11:59:30Z';
      const threeMinAgo = '2026-10-22T11:57:00Z';

      expect(formatUpdatedAgo(justNow, now, mockTranslate)).toBe('analytics.updated_seconds_ago:count=30');
      expect(formatUpdatedAgo(threeMinAgo, now, mockTranslate)).toBe('analytics.updated_minutes_ago:count=3');
    });

    it('oldestGeneratedAt selects the stalest timestamp', () => {
      const results: AnalyticsResult[] = [
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

      expect(passTone(75, 70)).toBe('success');
      expect(passTone(65, 70)).toBe('danger');
    });
  });

  describe('scope empty state', () => {
    const summary = (overrides: Partial<AnalyticsScopeSummary>): AnalyticsScopeSummary =>
      ({
        type: 'cohort',
        id: 'coh1',
        name: 'C',
        studentCount: 0,
        pendingCount: 0,
        courses: [],
        ...overrides
      }) as AnalyticsScopeSummary;

    it('omits the org action when the org slug is not ready yet', () => {
      const emptyState = scopeEmptyState(summary({ type: 'org' }), null);

      expect(emptyState.actions).toEqual([]);
      expect(emptyState.descriptionKey).toBe('analytics.scope_empty.description.org');
    });

    it('sends an empty cohort without courses to add courses first', () => {
      const emptyState = scopeEmptyState(summary({}), 'acme');

      expect(emptyState.actions.map((action) => action.href)).toEqual([
        '/cohorts/coh1/courses',
        '/cohorts/coh1/people'
      ]);
      expect(emptyState.descriptionKey).toBe('analytics.scope_empty.description.cohort_no_courses');
      expect(emptyState.titleKey).toBe('analytics.scope_empty.title.cohort');
    });

    it('invites students to a cohort that already has courses', () => {
      const course = { id: 'c1', title: 'C1', isGrouped: false, hasPassRequired: false };
      const emptyState = scopeEmptyState(summary({ courses: [course] }), 'acme');

      expect(emptyState.actions.map((action) => action.href)).toEqual(['/cohorts/coh1/people']);
      expect(emptyState.descriptionKey).toBe('analytics.scope_empty.description.cohort');
    });

    it('mentions pending invitations', () => {
      const course = { id: 'c1', title: 'C1', isGrouped: false, hasPassRequired: false };

      expect(scopeEmptyState(summary({ pendingCount: 3, courses: [course] }), 'acme').descriptionKey).toBe(
        'analytics.scope_empty.pending'
      );
    });

    it('adds courses first when a cohort with no courses also has pending invitations', () => {
      const emptyState = scopeEmptyState(summary({ pendingCount: 2 }), 'acme');

      expect(emptyState.descriptionKey).toBe('analytics.scope_empty.description.cohort_no_courses');
      expect(emptyState.actions.map((action) => action.href)).toEqual([
        '/cohorts/coh1/courses',
        '/cohorts/coh1/people'
      ]);
    });

    it('sends an empty course to its people page', () => {
      const emptyState = scopeEmptyState(summary({ type: 'course', id: 'course1' }), 'acme');

      expect(emptyState.actions).toEqual([
        { href: '/courses/course1/people', labelKey: 'analytics.scope_empty.invite_students' }
      ]);
      expect(emptyState.descriptionKey).toBe('analytics.scope_empty.description.course');
      expect(emptyState.titleKey).toBe('analytics.scope_empty.title.course');
    });

    it('sends an empty organization to its audience page', () => {
      const emptyState = scopeEmptyState(summary({ type: 'org', id: 'org1' }), 'acme');

      expect(emptyState.actions).toEqual([
        { href: '/org/acme/audience', labelKey: 'analytics.scope_empty.add_students' }
      ]);
      expect(emptyState.descriptionKey).toBe('analytics.scope_empty.description.org');
      expect(emptyState.titleKey).toBe('analytics.scope_empty.title.org');
    });

    it('only calls a loaded dashboard with no students empty', () => {
      expect(hasNoStudents(null)).toBe(false);
      expect(hasNoStudents({ scope: { studentCount: 0 } } as AnalyticsDashboard)).toBe(true);
      expect(hasNoStudents({ scope: { studentCount: 4 } } as AnalyticsDashboard)).toBe(false);
    });
  });

  describe('widget empty states and fallbacks', () => {
    function measure(key: string): AnalyticsResult['columns'][number] {
      return { key, role: 'measure', valueType: 'integer' };
    }

    it('treats all-zero charts and unscored histograms as empty, but not tables with rows', () => {
      const zeros = resultOf([{ day_id: '2026-10-20', logged_in__count_if: 0 }], [measure('logged_in__count_if')]);
      const unscored = resultOf([{ score_bucket_10_id: null, rows__count: 4 }], [measure('rows__count')]);
      const table = resultOf([{ course_id: 'c1', rows__count: 0 }], [measure('rows__count')]);

      expect(isEmptyResult({ ...widgetOf('logins_per_day'), viz: 'column' }, zeros)).toBe(true);
      expect(
        isEmptyResult(
          { ...widgetOf('score_distribution', { dimensions: ['score_bucket_10'] }), viz: 'histogram' },
          unscored
        )
      ).toBe(true);
      expect(isEmptyResult(widgetOf('course_details'), table)).toBe(false);
      expect(isEmptyResult({ ...widgetOf('courses_by_completion'), viz: 'hbar' }, { ...zeros, total: 15 })).toBe(false);
      expect(isEmptyResult({ ...widgetOf('courses_by_completion'), viz: 'hbar' }, zeros, { page: 2, sort: null })).toBe(
        false
      );
    });

    it('ignores timestamp measures when deciding whether a cohort chart is empty', () => {
      const columns: AnalyticsResult['columns'] = [
        measure('students__value'),
        { key: 'cohort_created_at__value', role: 'measure', valueType: 'datetime' }
      ];
      const rows = [{ cohort_id: 'c1', students__value: 0, cohort_created_at__value: '2026-01-01T00:00:00Z' }];

      expect(isEmptyResult({ ...widgetOf('cohort_health'), viz: 'donut' }, resultOf(rows, columns))).toBe(true);
    });

    it('calls a clean problem widget good news, and an empty range widget a range miss', () => {
      const context = { ...widgetContext, range: '7d' as const };

      expect(widgetEmptyState(widgetOf('needs_attention'), context).kind).toBe('positive');
      expect(widgetEmptyState({ ...widgetOf('logins_per_day'), usesRange: true }, context)).toMatchObject({
        kind: 'range',
        vars: { days: 7 }
      });
      expect(widgetEmptyState(widgetOf('cohorts_at_a_glance'), widgetContext).action?.href).toBe('/org/acme/cohorts');
    });

    it('offers add courses for cohort scope with 0 courses', () => {
      const emptyCohortContext = { ...widgetContext, scopeType: 'cohort' as const, courseCount: 0, scopeId: 'coh1' };
      expect(widgetEmptyState(widgetOf('courses_summary'), emptyCohortContext).action).toEqual({
        href: '/cohorts/coh1/courses',
        labelKey: 'analytics.scope_empty.add_courses'
      });
    });

    it('explains when cohorts exist but have no students', () => {
      const courseContext = {
        ...widgetContext,
        scopeType: 'course' as const,
        scopeId: 'course1',
        cohortCount: 2,
        studentCount: 10
      };
      const courseState = widgetEmptyState(widgetOf('cohorts_in_course'), courseContext);

      expect(courseState.titleKey).toBe('analytics.empty_states.cohorts_course_no_students.title');
      expect(courseState.action).toEqual({
        href: '/courses/course1/people',
        labelKey: 'analytics.scope_empty.invite_students'
      });

      const orgContext = { ...widgetContext, scopeType: 'org' as const, cohortCount: 2, studentCount: 10 };
      const orgState = widgetEmptyState(widgetOf('cohort_health'), orgContext);

      expect(orgState.titleKey).toBe('analytics.empty_states.cohorts_org_no_students.title');
      expect(orgState.action).toEqual({
        href: '/org/acme/audience',
        labelKey: 'analytics.scope_empty.add_students'
      });
    });

    it('explains a KPI with no data', () => {
      const display = formatKpi(widgetOf('kpi_avg_score'), resultOf([{ avg_score_pct__avg: null }]), mockTranslate, {
        courseSelected: false,
        rangeDays: null,
        hasStudents: true
      });

      expect(display).toMatchObject({ value: '–', description: 'analytics.kpi.no_data.graded', trend: 'flat' });

      const rangeDisplay = formatKpi(
        widgetOf('kpi_avg_score'),
        resultOf([{ avg_score_pct__avg: null }]),
        mockTranslate,
        {
          courseSelected: false,
          rangeDays: 7,
          hasStudents: true
        }
      );

      expect(rangeDisplay).toMatchObject({
        value: '–',
        description: 'analytics.kpi.no_data.in_days:days=7',
        trend: 'flat'
      });
    });
  });

  describe('no students', () => {
    const emptyContext = { ...widgetContext, studentCount: 0, range: '7d' as const };

    it('gives every empty card the same no-students state, ahead of good news and range misses', () => {
      expect(widgetEmptyState(widgetOf('needs_attention'), emptyContext)).toMatchObject({
        kind: 'no_students',
        titleKey: 'analytics.no_students_yet',
        descriptionKey: null,
        action: null
      });
      expect(widgetEmptyState({ ...widgetOf('logins_per_day'), usesRange: true }, emptyContext).kind).toBe(
        'no_students'
      );
    });

    it('keeps KPI values and explains them', () => {
      const display = formatKpi(
        widgetOf('kpi_logged_in_today'),
        resultOf([{ logged_in_today__count_if: 0, rows__count: 0 }]),
        mockTranslate,
        { courseSelected: false, rangeDays: null, hasStudents: false }
      );

      expect(display).toMatchObject({ value: '0 / 0', description: 'analytics.kpi.no_data.students', trend: 'flat' });
    });
  });

  describe('server paging', () => {
    const table = { ...widgetOf('course_details', { sort: [{ field: 'course', dir: 'asc' }] }), pageGroup: 'courses' };

    it("asks the server for the page group's page and sort", () => {
      const selection: AnalyticsSelection = {
        courseId: null,
        exerciseId: null,
        range: 'all',
        breakdown: 'courses',
        cohortIds: null,
        pages: { courses: { page: 3, sort: { key: 'rows__count', dir: 'desc' } } }
      };
      const spec = resolveWidgetSpec(table, selection);

      expect(spec?.page).toBe(3);
      expect(spec?.sort).toEqual([{ field: 'rows__count', dir: 'desc' }]);
    });

    it('keeps the preset sort and first page until the user pages or sorts', () => {
      const selection: AnalyticsSelection = {
        courseId: null,
        exerciseId: null,
        range: 'all',
        breakdown: 'courses',
        cohortIds: null,
        pages: {}
      };
      const spec = resolveWidgetSpec(table, selection);

      expect(spec?.page).toBe(1);
      expect(spec?.sort).toEqual([{ field: 'course', dir: 'asc' }]);
    });

    it("puts the pager on the group's table, else its first widget", () => {
      const chart = { ...widgetOf('courses_summary'), viz: 'grouped_bar' as const, pageGroup: 'courses' };
      const ranking = { ...widgetOf('courses_by_completion'), viz: 'hbar' as const, pageGroup: 'ranking' };

      expect(pagerOwnerId([chart, table, ranking], 'courses')).toBe('course_details');
      expect(pagerOwnerId([chart, table, ranking], 'ranking')).toBe('courses_by_completion');
      expect(pagerOwnerId([chart], 'missing')).toBeNull();
    });

    it('flips the direction when the same column is sorted again', () => {
      expect(nextSort(null, 'rows__count')).toEqual({ key: 'rows__count', dir: 'asc' });
      expect(nextSort({ key: 'rows__count', dir: 'asc' }, 'rows__count')).toEqual({ key: 'rows__count', dir: 'desc' });
    });
  });

  describe('widget pagination labels', () => {
    it('resolves the target scope key for page groups', () => {
      expect(widgetPaginationTarget('cohorts', 'org')).toBe('cohorts_org');
      expect(widgetPaginationTarget('cohorts', 'course')).toBe('cohorts_course');
      expect(widgetPaginationTarget('cohorts_chart', 'course')).toBe('cohorts_course');
      expect(widgetPaginationTarget('courses', 'org')).toBe('courses_org');
      expect(widgetPaginationTarget('courses', 'cohort')).toBe('courses_cohort');
      expect(widgetPaginationTarget('courses_chart', 'cohort')).toBe('courses_cohort');
      expect(widgetPaginationTarget('sections', 'course')).toBe('sections_course');
      expect(widgetPaginationTarget('overdue', 'cohort')).toBe('overdue_cohort');
      expect(widgetPaginationTarget('unknown', 'org')).toBeNull();
    });

    it('formats paged labels with context', () => {
      const label = widgetPaginationLabel(
        { pageGroup: 'cohorts', from: 1, to: 5, total: 12, scopeType: 'org' },
        mockTranslate
      );
      expect(label).toBe('analytics.pagination.cohorts_org:from=1:to=5:total=12');

      const courseCohort = widgetPaginationLabel(
        { pageGroup: 'cohorts', from: 1, to: 5, total: 8, scopeType: 'course' },
        mockTranslate
      );
      expect(courseCohort).toBe('analytics.pagination.cohorts_course:from=1:to=5:total=8');
    });

    it('falls back to generic showing label when target is unknown', () => {
      const label = widgetPaginationLabel({ pageGroup: 'unknown', from: 1, to: 5, total: 12 }, mockTranslate);
      expect(label).toBe('analytics.pagination.showing:from=1:to=5:total=12');
    });
  });

  describe('page groups and empty-page fallbacks', () => {
    it('collects distinct page groups and skips unpaged widgets', () => {
      const paged = { ...widgetOf('course_details'), pageGroup: 'courses' };
      const sameGroup = { ...widgetOf('courses_by_completion'), pageGroup: 'courses' };
      const otherGroup = { ...widgetOf('cohorts_at_a_glance'), pageGroup: 'cohorts' };
      const unpaged = widgetOf('scores_by_exercise');

      expect(pageGroupsOf([paged, sameGroup, otherGroup, unpaged])).toEqual(['courses', 'cohorts']);
      expect(pageGroupsOf([unpaged])).toEqual([]);
      expect(pageGroupsOf([])).toEqual([]);
    });

    it('steps back to the last page when the current page is beyond it', () => {
      expect(pageAfterEmptyResult(5, 12, 5)).toBe(3);
      expect(pageAfterEmptyResult(2, 0, 5)).toBe(1);
    });

    it('steps back at least one page when the reported total still covers the empty page', () => {
      expect(pageAfterEmptyResult(4, 100, 5)).toBe(3);
      expect(pageAfterEmptyResult(2, 7, 5)).toBe(1);
    });

    it('never falls below the first page', () => {
      expect(pageAfterEmptyResult(1, 0, 5)).toBe(1);
      expect(pageAfterEmptyResult(2, 0, 5)).toBe(1);
      expect(pageAfterEmptyResult(3, 10, 0)).toBe(2);
    });
  });
});
