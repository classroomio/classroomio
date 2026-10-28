import { describe, expect, it } from 'vitest';

import { compileInsightsQuery, requiresOrderedItems } from '@cio/db/queries/insights';
import { INSIGHTS_LIMITS, INSIGHTS_PLACEHOLDERS, type TInsightsBreakdownGroup } from '@cio/utils/constants/insights';
import { ZInsightsWidget, type TInsightsWidget } from '@cio/utils/validation/insights';

import { INSIGHTS_PRESETS } from '@api/services/insights/presets';

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const COHORT_ID = '22222222-2222-4222-8222-222222222222';
const COURSE_ID = '33333333-3333-4333-8333-333333333333';
const STUDENT_ID = '44444444-4444-4444-8444-444444444444';
const EXERCISE_ID = '55555555-5555-4555-8555-555555555555';
const GRID_COLUMNS = 12;

const COHORT_ALL_WIDGETS = [
  'kpi_logged_in_today',
  'kpi_avg_progress',
  'kpi_avg_score',
  'kpi_overdue',
  'kpi_completed',
  'courses_summary',
  'students_by_status',
  'course_details',
  'needs_attention',
  'overdue',
  'students',
  'logins_per_day',
  'score_distribution'
];

const COHORT_SINGLE_WIDGETS = [
  'kpi_logged_in_today',
  'kpi_avg_progress',
  'kpi_avg_score',
  'kpi_overdue',
  'kpi_completed',
  'scores_by_exercise',
  'progress_distribution',
  'students_by_status_course',
  'section_scores',
  'score_distribution_course',
  'section_scorecard',
  'needs_attention',
  'overdue',
  'hardest_questions',
  'students',
  'logins_per_day_course'
];

const COURSE_COURSES_WIDGETS = [
  'kpi_enrolled',
  'kpi_completion_rate',
  'kpi_avg_grade',
  'kpi_first_try_pass',
  'kpi_median_days',
  'scores_by_exercise',
  'exercise_score_distribution',
  'lesson_dropoff',
  'hardest_exercises',
  'hardest_questions',
  'section_scorecard',
  'needs_attention',
  'students'
];

const COURSE_COHORTS_WIDGETS = [
  'kpi_enrolled',
  'kpi_completion_rate',
  'kpi_avg_grade',
  'kpi_first_try_pass',
  'kpi_median_days',
  'scores_by_exercise_by_cohort',
  'exercise_score_distribution',
  'lesson_dropoff',
  'hardest_exercises',
  'hardest_questions',
  'cohorts_in_course',
  'cohort_details',
  'section_scorecard',
  'needs_attention',
  'students'
];

const ORG_COURSES_WIDGETS = [
  'kpi_logged_in_week',
  'kpi_progress_trend',
  'kpi_completions',
  'kpi_certificates',
  'kpi_needs_attention',
  'courses_at_a_glance',
  'needs_attention',
  'students_by_status',
  'hiring_ramp',
  'logins_per_day',
  'avg_score_by_course',
  'courses_by_completion'
];

const ORG_COHORTS_WIDGETS = [
  'kpi_logged_in_week',
  'kpi_progress_trend',
  'kpi_completions',
  'kpi_certificates',
  'kpi_needs_attention',
  'cohorts_at_a_glance',
  'needs_attention',
  'cohort_health',
  'hiring_ramp',
  'logins_per_day',
  'avg_score_by_cohort',
  'courses_by_completion'
];

const RANGE_WIDGETS: Record<'cohort' | 'course' | 'org', string[]> = {
  cohort: [
    'kpi_logged_in_today',
    'kpi_avg_progress',
    'kpi_avg_score',
    'kpi_completed',
    'scores_by_exercise',
    'score_distribution_course',
    'hardest_questions',
    'logins_per_day',
    'score_distribution',
    'logins_per_day_course'
  ],
  course: [
    'kpi_enrolled',
    'kpi_completion_rate',
    'kpi_avg_grade',
    'kpi_first_try_pass',
    'kpi_median_days',
    'scores_by_exercise',
    'scores_by_exercise_by_cohort',
    'exercise_score_distribution',
    'hardest_exercises',
    'hardest_questions'
  ],
  org: [
    'kpi_logged_in_week',
    'kpi_progress_trend',
    'kpi_completions',
    'kpi_certificates',
    'hiring_ramp',
    'logins_per_day'
  ]
};

function visibleWidgets(
  widgets: TInsightsWidget[],
  mode: 'all' | 'single',
  breakdown: TInsightsBreakdownGroup | null = null
): TInsightsWidget[] {
  return widgets.filter((widget) => {
    if (widget.hidden) return false;
    if (widget.courseMode !== 'any' && widget.courseMode !== mode) return false;
    if (breakdown === null) return widget.breakdown === 'core';

    return widget.breakdown === 'core' || widget.breakdown === breakdown;
  });
}

function rowWidths(widgets: readonly TInsightsWidget[]): number[] {
  const widths: number[] = [];
  let rowWidth = 0;

  for (const widget of widgets) {
    if (rowWidth + widget.span > GRID_COLUMNS) {
      widths.push(rowWidth);
      rowWidth = 0;
    }

    rowWidth += widget.span;
  }

  if (rowWidth > 0) widths.push(rowWidth);

  return widths;
}

describe('insights presets', () => {
  it('parses every preset', () => {
    for (const widgets of Object.values(INSIGHTS_PRESETS)) {
      for (const widget of widgets) {
        expect(() => ZInsightsWidget.parse(widget), widget.id).not.toThrow();
      }
    }
  });

  it('uses unique widget ids within each scope', () => {
    for (const widgets of Object.values(INSIGHTS_PRESETS)) {
      const ids = widgets.map((widget) => widget.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  describe('breakdown groups', () => {
    it('gates every cohort breakdown widget on the scope having cohorts', () => {
      for (const widgets of Object.values(INSIGHTS_PRESETS)) {
        for (const widget of widgets.filter((candidate) => candidate.breakdown === 'cohorts')) {
          expect(widget.requires, widget.id).toContain('cohorts');
        }
      }
    });

    it('lists the course breakdown widgets per scope', () => {
      const courseIds = INSIGHTS_PRESETS.course
        .filter((widget) => widget.breakdown === 'courses')
        .map((widget) => widget.id);
      const orgIds = INSIGHTS_PRESETS.org.filter((widget) => widget.breakdown === 'courses').map((widget) => widget.id);

      expect(courseIds).toEqual(['scores_by_exercise']);
      expect(orgIds).toEqual(['courses_at_a_glance', 'students_by_status', 'avg_score_by_course']);
    });

    it('lists the cohort breakdown widgets per scope', () => {
      const courseIds = INSIGHTS_PRESETS.course
        .filter((widget) => widget.breakdown === 'cohorts' && !widget.hidden)
        .map((widget) => widget.id);
      const orgIds = INSIGHTS_PRESETS.org.filter((widget) => widget.breakdown === 'cohorts').map((widget) => widget.id);

      expect(courseIds).toEqual(['scores_by_exercise_by_cohort', 'cohorts_in_course', 'cohort_details']);
      expect(orgIds).toEqual(['cohorts_at_a_glance', 'cohort_health', 'avg_score_by_cohort']);
    });

    it('names empty cohorts without adding a card to the grid', () => {
      const empty = INSIGHTS_PRESETS.course.find((widget) => widget.id === 'cohort_empty');

      expect(empty?.hidden).toBe(true);
      expect(empty?.breakdown).toBe('cohorts');
      expect(empty?.requires).toContain('cohorts');
      expect(empty?.spec.limit).toBe(INSIGHTS_LIMITS.emptyCohortNames);
      expect(empty?.spec.filters).toEqual([{ field: 'students', op: 'lt', value: 1 }]);
    });

    it('no longer loads every cohort for the picker', () => {
      const optionWidgets = INSIGHTS_PRESETS.course.filter((widget) => widget.id === 'cohort_options');

      expect(optionWidgets).toHaveLength(0);
    });
  });

  it('counts attempted exercises for the single-course score band', () => {
    const widget = INSIGHTS_PRESETS.cohort.find((candidate) => candidate.id === 'scores_by_exercise');

    expect(widget).toBeDefined();
    expect(widget?.courseMode).toBe('single');
    expect(widget?.spec.dimensions).toEqual(['exercise']);
    expect(widget?.spec.measures).toContainEqual({ metric: 'is_attempted', agg: 'count_if' });
  });

  it('counts graded and attempted exercises for the course-wide score band', () => {
    const widget = INSIGHTS_PRESETS.course.find((candidate) => candidate.id === 'scores_by_exercise');

    expect(widget).toBeDefined();
    expect(widget?.breakdown).toBe('courses');
    expect(widget?.spec.dimensions).toEqual(['exercise']);
    expect(widget?.spec.measures).toContainEqual({ metric: 'is_graded', agg: 'count_if' });
    expect(widget?.spec.measures).toContainEqual({ metric: 'is_attempted', agg: 'count_if' });
  });

  describe('widget order per picker mode', () => {
    it('lists the cohort widgets in prototype order', () => {
      const cohort = INSIGHTS_PRESETS.cohort;

      expect(visibleWidgets(cohort, 'all').map((widget) => widget.id)).toEqual(COHORT_ALL_WIDGETS);
      expect(visibleWidgets(cohort, 'single').map((widget) => widget.id)).toEqual(COHORT_SINGLE_WIDGETS);
    });

    it('lists the course widgets in prototype order for each breakdown', () => {
      const course = INSIGHTS_PRESETS.course;

      for (const mode of ['all', 'single'] as const) {
        expect(visibleWidgets(course, mode, 'courses').map((widget) => widget.id)).toEqual(COURSE_COURSES_WIDGETS);
        expect(visibleWidgets(course, mode, 'cohorts').map((widget) => widget.id)).toEqual(COURSE_COHORTS_WIDGETS);
      }
    });

    it('lists the org widgets in prototype order for each breakdown', () => {
      const org = INSIGHTS_PRESETS.org;

      for (const mode of ['all', 'single'] as const) {
        expect(visibleWidgets(org, mode, 'courses').map((widget) => widget.id)).toEqual(ORG_COURSES_WIDGETS);
        expect(visibleWidgets(org, mode, 'cohorts').map((widget) => widget.id)).toEqual(ORG_COHORTS_WIDGETS);
      }
    });
  });

  describe('12-column tiling per picker mode', () => {
    it('tiles every panel in both picker modes and breakdowns', () => {
      const cases = [
        { scopeType: 'cohort' as const, breakdown: null },
        { scopeType: 'course' as const, breakdown: 'courses' as const },
        { scopeType: 'course' as const, breakdown: 'cohorts' as const },
        { scopeType: 'org' as const, breakdown: 'courses' as const },
        { scopeType: 'org' as const, breakdown: 'cohorts' as const }
      ];

      for (const { scopeType, breakdown } of cases) {
        for (const mode of ['all', 'single'] as const) {
          const panels = visibleWidgets(INSIGHTS_PRESETS[scopeType], mode, breakdown).filter(
            (widget) => widget.viz !== 'kpi'
          );
          const widths = rowWidths(panels);
          const label = `${scopeType} ${breakdown ?? 'core'} ${mode}`;

          expect(widths, label).not.toHaveLength(0);
          for (const width of widths) {
            expect(width, label).toBeLessThanOrEqual(GRID_COLUMNS);
          }
          for (const widget of panels) {
            expect(widget.span, widget.id).toBeGreaterThanOrEqual(4);
            expect(widget.span, widget.id).toBeLessThanOrEqual(GRID_COLUMNS);
          }
        }
      }
    });
  });

  describe('range tags', () => {
    it('tags exactly the cards that follow the range', () => {
      for (const scopeType of ['cohort', 'course', 'org'] as const) {
        const tagged = INSIGHTS_PRESETS[scopeType].filter((widget) => widget.usesRange).map((widget) => widget.id);

        expect(tagged, scopeType).toEqual(RANGE_WIDGETS[scopeType]);
      }
    });

    it('leaves the overdue and needs-attention KPIs on now', () => {
      const overdueKpi = INSIGHTS_PRESETS.cohort.find((widget) => widget.id === 'kpi_overdue');
      const attentionKpi = INSIGHTS_PRESETS.org.find((widget) => widget.id === 'kpi_needs_attention');

      expect(overdueKpi?.usesRange).toBe(false);
      expect(attentionKpi?.usesRange).toBe(false);
    });

    it('keeps range charts wide enough for every day', () => {
      const logins = INSIGHTS_PRESETS.org.find((widget) => widget.id === 'logins_per_day');
      const hiringRamp = INSIGHTS_PRESETS.org.find((widget) => widget.id === 'hiring_ramp');

      expect(logins?.spec.limit).toBeGreaterThanOrEqual(INSIGHTS_LIMITS.maxRangeDays);
      expect(hiringRamp?.spec.limit).toBeGreaterThanOrEqual(INSIGHTS_LIMITS.maxRangeDays);
    });

    it('sorts overdue widget by has_goal__value desc, then days_overdue__value desc', () => {
      const overdue = INSIGHTS_PRESETS.cohort.find((widget) => widget.id === 'overdue');

      expect(overdue?.spec.sort).toEqual([
        { field: 'has_goal__value', dir: 'desc' },
        { field: 'days_overdue__value', dir: 'desc' }
      ]);
    });
  });

  describe('paired widgets', () => {
    it('shares one spec across the three org cohort widgets', () => {
      const glance = INSIGHTS_PRESETS.org.find((widget) => widget.id === 'cohorts_at_a_glance');
      const health = INSIGHTS_PRESETS.org.find((widget) => widget.id === 'cohort_health');
      const scores = INSIGHTS_PRESETS.org.find((widget) => widget.id === 'avg_score_by_cohort');

      expect(glance?.spec).toEqual(health?.spec);
      expect(glance?.spec).toEqual(scores?.spec);
    });

    it('shares one spec across the org course widgets', () => {
      const glance = INSIGHTS_PRESETS.org.find((widget) => widget.id === 'courses_at_a_glance');
      const scores = INSIGHTS_PRESETS.org.find((widget) => widget.id === 'avg_score_by_course');

      expect(glance?.spec).toEqual(scores?.spec);
    });
  });

  describe('server paging', () => {
    const allWidgets = [...INSIGHTS_PRESETS.cohort, ...INSIGHTS_PRESETS.course, ...INSIGHTS_PRESETS.org];

    it('pages every table and every chart paired with one on the server', () => {
      const pagedIds = [
        ['cohort', 'courses_summary', 'courses_chart'],
        ['cohort', 'course_details', 'courses'],
        ['cohort', 'section_scores', 'sections_chart'],
        ['cohort', 'section_scorecard', 'sections'],
        ['cohort', 'overdue', 'overdue'],
        ['course', 'cohorts_in_course', 'cohorts_chart'],
        ['course', 'cohort_details', 'cohorts'],
        ['course', 'section_scorecard', 'sections'],
        ['org', 'cohorts_at_a_glance', 'cohorts'],
        ['org', 'cohort_health', 'cohorts'],
        ['org', 'avg_score_by_cohort', 'cohorts'],
        ['org', 'courses_at_a_glance', 'courses_breakdown'],
        ['org', 'avg_score_by_course', 'courses_breakdown'],
        ['org', 'courses_by_completion', 'courses']
      ] as const;

      for (const [scope, id, pageGroup] of pagedIds) {
        const widget = INSIGHTS_PRESETS[scope].find((entry) => entry.id === id);

        expect(widget?.pageGroup, `${scope}:${id}`).toBe(pageGroup);
      }
    });

    it('pages the cohorts chart over cohorts that have students', () => {
      const chart = INSIGHTS_PRESETS.course.find((widget) => widget.id === 'cohorts_in_course');
      const table = INSIGHTS_PRESETS.course.find((widget) => widget.id === 'cohort_details');

      expect(chart?.spec.filters).toEqual([{ field: 'students', op: 'gte', value: 1 }]);
      expect(table?.spec.filters).toEqual([]);
    });

    it('pages each bar chart on its own, four groups at a time', () => {
      const charts = [
        INSIGHTS_PRESETS.cohort.find((widget) => widget.id === 'courses_summary'),
        INSIGHTS_PRESETS.cohort.find((widget) => widget.id === 'section_scores'),
        INSIGHTS_PRESETS.course.find((widget) => widget.id === 'cohorts_in_course')
      ];

      for (const chart of charts) {
        expect(chart?.spec.limit, chart?.id).toBe(INSIGHTS_LIMITS.chartPageSize);
      }
    });

    it('pages every list and table five rows at a time', () => {
      const lists = allWidgets.filter((widget) => widget.pageGroup && widget.viz !== 'grouped_bar');

      for (const list of lists) {
        expect(list.spec.limit, list.id).toBe(INSIGHTS_LIMITS.cardPageSize);
      }
    });

    it('gives the chart and the table beside it the same rows apart from the page size', () => {
      const chart = INSIGHTS_PRESETS.cohort.find((widget) => widget.id === 'section_scores');
      const table = INSIGHTS_PRESETS.cohort.find((widget) => widget.id === 'section_scorecard');

      expect({ ...chart?.spec, limit: 0 }).toEqual({ ...table?.spec, limit: 0 });
    });

    it('leaves no table loading every row at once', () => {
      const tables = allWidgets.filter((widget) => widget.viz === 'table' && !widget.hidden);

      for (const table of tables) {
        expect(table.pageGroup, table.id).toBeDefined();
        expect(table.spec.limit ?? INSIGHTS_LIMITS.pageSize, table.id).toBeLessThanOrEqual(INSIGHTS_LIMITS.pageSize);
      }
    });

    it('keeps the top lists at their prototype size', () => {
      const hardestExercises = INSIGHTS_PRESETS.course.find((widget) => widget.id === 'hardest_exercises');
      const hardestQuestions = INSIGHTS_PRESETS.cohort.find((widget) => widget.id === 'hardest_questions');

      expect(hardestExercises?.spec.limit).toBe(INSIGHTS_LIMITS.hardestExercises);
      expect(hardestQuestions?.spec.limit).toBe(INSIGHTS_LIMITS.hardestQuestions);
      expect(hardestExercises?.pageGroup).toBeUndefined();
      expect(hardestQuestions?.pageGroup).toBeUndefined();
    });
  });

  describe('org scope', () => {
    const orgWidgets = INSIGHTS_PRESETS.org;

    it('never depends on a course or student selection', () => {
      for (const widget of orgWidgets) {
        const specJson = JSON.stringify(widget.spec);

        expect(widget.courseMode).not.toBe('single');
        for (const requirement of widget.requires) {
          expect(requirement, widget.id).toBe('cohorts');
        }
        for (const placeholder of Object.values(INSIGHTS_PLACEHOLDERS)) {
          expect(specJson).not.toContain(placeholder);
        }
      }
    });

    it('never needs course outline ranks', () => {
      for (const widget of orgWidgets) {
        expect(requiresOrderedItems(widget.spec)).toBe(false);
      }
    });

    it('never references the student placeholder across any cohort preset widgets', () => {
      for (const widget of INSIGHTS_PRESETS.cohort) {
        const specJson = JSON.stringify(widget.spec);
        expect(specJson).not.toContain(INSIGHTS_PLACEHOLDERS.student);
      }
    });

    it('compiles every widget for the org scope', () => {
      const scope = { orgId: ORG_ID, type: 'org' as const, id: ORG_ID };

      for (const widget of orgWidgets) {
        expect(() => compileInsightsQuery(widget.spec, { scope, orderedItems: [] }), widget.id).not.toThrow();
      }
    });
  });

  describe('cohort and course scopes', () => {
    it('compiles every cohort widget with its placeholders replaced', () => {
      const scope = { orgId: ORG_ID, type: 'cohort' as const, id: COHORT_ID };
      const widgets = INSIGHTS_PRESETS.cohort.map((widget) => replacePlaceholders(widget, COURSE_ID, STUDENT_ID));

      for (const widget of widgets) {
        expect(() => compileInsightsQuery(widget.spec, { scope, orderedItems: [] }), widget.id).not.toThrow();
      }
    });

    it('compiles every course widget with its placeholders replaced', () => {
      const scope = { orgId: ORG_ID, type: 'course' as const, id: COURSE_ID };
      const widgets = INSIGHTS_PRESETS.course.map((widget) => replacePlaceholders(widget, COURSE_ID, STUDENT_ID));

      for (const widget of widgets) {
        expect(() => compileInsightsQuery(widget.spec, { scope, orderedItems: [] }), widget.id).not.toThrow();
      }
    });
  });
});

function replacePlaceholders(widget: TInsightsWidget, courseId: string, studentId: string): TInsightsWidget {
  const filters = widget.spec.filters.map((filter) => {
    if (filter.value === INSIGHTS_PLACEHOLDERS.course) return { ...filter, value: courseId };
    if (filter.value === INSIGHTS_PLACEHOLDERS.student) return { ...filter, value: studentId };
    if (filter.value === INSIGHTS_PLACEHOLDERS.exercise) return { ...filter, value: EXERCISE_ID };

    return filter;
  });

  return { ...widget, spec: { ...widget.spec, filters } };
}
