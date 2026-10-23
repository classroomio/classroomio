import { describe, expect, it } from 'vitest';

import { compileInsightsQuery, requiresOrderedItems } from '@cio/db/queries/insights';
import { INSIGHTS_LIMITS, INSIGHTS_PLACEHOLDERS } from '@cio/utils/constants/insights';
import { ZInsightsWidget, type TInsightsWidget } from '@cio/utils/validation/insights';

import { INSIGHTS_PRESETS } from '@api/services/insights/presets';

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const COHORT_ID = '22222222-2222-4222-8222-222222222222';
const COURSE_ID = '33333333-3333-4333-8333-333333333333';
const LEARNER_ID = '44444444-4444-4444-8444-444444444444';
const EXERCISE_ID = '55555555-5555-4555-8555-555555555555';
const GRID_COLUMNS = 12;

const COHORT_ALL_WIDGETS = [
  'kpi_logged_in_today',
  'kpi_avg_progress',
  'kpi_avg_score',
  'kpi_overdue',
  'kpi_completed',
  'courses_summary',
  'learners_by_status',
  'course_details',
  'learner_courses',
  'needs_attention',
  'overdue',
  'learners',
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
  'learner_progression',
  'learners_by_status_course',
  'section_scores',
  'score_distribution_course',
  'section_scorecard',
  'needs_attention',
  'overdue',
  'hardest_questions',
  'learners',
  'logins_per_day_course'
];

const COURSE_WIDGETS = [
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
  'learners'
];

const ORG_WIDGETS = [
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
    'learner_progression',
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

function visibleWidgets(widgets: TInsightsWidget[], mode: 'all' | 'single'): TInsightsWidget[] {
  return widgets.filter((widget) => widget.courseMode === 'any' || widget.courseMode === mode);
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

  it('counts attempted exercises for the single-course score band', () => {
    const widget = INSIGHTS_PRESETS.cohort.find((candidate) => candidate.id === 'scores_by_exercise');

    expect(widget).toBeDefined();
    expect(widget?.courseMode).toBe('single');
    expect(widget?.spec.dimensions).toEqual(['exercise']);
    expect(widget?.spec.measures).toContainEqual({ metric: 'is_attempted', agg: 'count_if' });
  });

  describe('widget order per picker mode', () => {
    it('lists the cohort widgets in prototype order', () => {
      const cohort = INSIGHTS_PRESETS.cohort;

      expect(visibleWidgets(cohort, 'all').map((widget) => widget.id)).toEqual(COHORT_ALL_WIDGETS);
      expect(visibleWidgets(cohort, 'single').map((widget) => widget.id)).toEqual(COHORT_SINGLE_WIDGETS);
    });

    it('lists the course widgets in prototype order', () => {
      const course = INSIGHTS_PRESETS.course;

      expect(visibleWidgets(course, 'all').map((widget) => widget.id)).toEqual(COURSE_WIDGETS);
      expect(visibleWidgets(course, 'single').map((widget) => widget.id)).toEqual(COURSE_WIDGETS);
    });

    it('lists the org widgets in prototype order', () => {
      const org = INSIGHTS_PRESETS.org;

      expect(visibleWidgets(org, 'all').map((widget) => widget.id)).toEqual(ORG_WIDGETS);
      expect(visibleWidgets(org, 'single').map((widget) => widget.id)).toEqual(ORG_WIDGETS);
    });
  });

  describe('12-column tiling per picker mode', () => {
    it.each(['cohort', 'course', 'org'] as const)('tiles the %s panels in both modes', (scopeType) => {
      for (const mode of ['all', 'single'] as const) {
        const panels = visibleWidgets(INSIGHTS_PRESETS[scopeType], mode).filter((widget) => widget.viz !== 'kpi');
        const widths = rowWidths(panels);

        expect(widths, `${scopeType} ${mode}`).not.toHaveLength(0);
        for (const width of widths) {
          expect(width, `${scopeType} ${mode}`).toBeLessThanOrEqual(GRID_COLUMNS);
        }
        for (const widget of panels) {
          expect(widget.span, widget.id).toBeGreaterThanOrEqual(4);
          expect(widget.span, widget.id).toBeLessThanOrEqual(GRID_COLUMNS);
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
  });

  describe('paired widgets', () => {
    it('shares one spec between the cohort course chart and table', () => {
      const chart = INSIGHTS_PRESETS.cohort.find((widget) => widget.id === 'courses_summary');
      const table = INSIGHTS_PRESETS.cohort.find((widget) => widget.id === 'course_details');

      expect(chart?.spec).toEqual(table?.spec);
    });

    it('shares one spec between the course cohort chart and table', () => {
      const chart = INSIGHTS_PRESETS.course.find((widget) => widget.id === 'cohorts_in_course');
      const table = INSIGHTS_PRESETS.course.find((widget) => widget.id === 'cohort_details');

      expect(chart?.spec).toEqual(table?.spec);
    });

    it('shares one spec across the three org cohort widgets', () => {
      const glance = INSIGHTS_PRESETS.org.find((widget) => widget.id === 'cohorts_at_a_glance');
      const health = INSIGHTS_PRESETS.org.find((widget) => widget.id === 'cohort_health');
      const scores = INSIGHTS_PRESETS.org.find((widget) => widget.id === 'avg_score_by_cohort');

      expect(glance?.spec).toEqual(health?.spec);
      expect(glance?.spec).toEqual(scores?.spec);
    });
  });

  describe('org scope', () => {
    const orgWidgets = INSIGHTS_PRESETS.org;

    it('never depends on a course or learner selection', () => {
      for (const widget of orgWidgets) {
        const specJson = JSON.stringify(widget.spec);

        expect(widget.courseMode).not.toBe('single');
        expect(widget.requires).toEqual([]);
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
      const widgets = INSIGHTS_PRESETS.cohort.map((widget) => replacePlaceholders(widget, COURSE_ID, LEARNER_ID));

      for (const widget of widgets) {
        expect(() => compileInsightsQuery(widget.spec, { scope, orderedItems: [] }), widget.id).not.toThrow();
      }
    });

    it('compiles every course widget with its placeholders replaced', () => {
      const scope = { orgId: ORG_ID, type: 'course' as const, id: COURSE_ID };
      const widgets = INSIGHTS_PRESETS.course.map((widget) => replacePlaceholders(widget, COURSE_ID, LEARNER_ID));

      for (const widget of widgets) {
        expect(() => compileInsightsQuery(widget.spec, { scope, orderedItems: [] }), widget.id).not.toThrow();
      }
    });
  });
});

function replacePlaceholders(widget: TInsightsWidget, courseId: string, learnerId: string): TInsightsWidget {
  const filters = widget.spec.filters.map((filter) => {
    if (filter.value === INSIGHTS_PLACEHOLDERS.course) return { ...filter, value: courseId };
    if (filter.value === INSIGHTS_PLACEHOLDERS.learner) return { ...filter, value: learnerId };
    if (filter.value === INSIGHTS_PLACEHOLDERS.exercise) return { ...filter, value: EXERCISE_ID };

    return filter;
  });

  return { ...widget, spec: { ...widget.spec, filters } };
}
