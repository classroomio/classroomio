import { INSIGHTS_PLACEHOLDERS } from '@cio/utils/constants/insights';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const plan = vi.hoisted(() => ({ isFree: false }));
const apiExecute = vi.hoisted(() => vi.fn());

vi.mock('$lib/utils/services/api', () => ({
  BaseApi: class {
    execute = apiExecute;
  },
  classroomio: {}
}));

vi.mock('$lib/utils/store/org', () => ({
  isFreePlan: {
    subscribe(run: (value: boolean) => void) {
      run(plan.isFree);

      return () => {};
    }
  }
}));

import { insightsApi } from './insights.svelte';
import type { InsightsDashboard, InsightsFilter, InsightsResult, InsightsWidget } from '../utils/types';

type WidgetInput = {
  id: string;
  pageGroup?: string;
  usesRange?: boolean;
  breakdown?: 'core' | 'courses' | 'cohorts';
  filters?: InsightsFilter[];
  hidden?: boolean;
};

function widgetOf(input: WidgetInput): InsightsWidget {
  return {
    id: input.id,
    titleKey: `insights.widgets.${input.id}.title`,
    viz: 'table',
    span: 12,
    courseMode: 'any',
    breakdown: input.breakdown ?? 'core',
    hidden: input.hidden ?? false,
    requires: [],
    usesRange: input.usesRange ?? false,
    pageGroup: input.pageGroup,
    spec: {
      source: 'student',
      dimensions: [],
      measures: [],
      filters: input.filters ?? [],
      sort: [],
      limit: 5,
      page: 1,
      range: 'all'
    }
  } as unknown as InsightsWidget;
}

function resultOf(rowCount: number, total: number): InsightsResult {
  return {
    rows: Array.from({ length: rowCount }, (_, index) => ({ id: `row-${index}` })),
    columns: [],
    total
  } as unknown as InsightsResult;
}

function setDashboard(scopeType: 'cohort' | 'org', widgets: InsightsWidget[], cohortCount = 0) {
  insightsApi.scope = { type: scopeType, id: 'scope-1' } as never;
  insightsApi.dashboard = {
    scope: { type: scopeType, id: 'scope-1', cohortCount, courses: [] },
    widgets,
    structures: {}
  } as unknown as InsightsDashboard;
}

describe('insights page state', () => {
  beforeEach(() => {
    insightsApi.selection = {
      courseId: null,
      exerciseId: null,
      range: 'all',
      breakdown: 'courses',
      cohortIds: null,
      pages: {}
    };
    insightsApi.widgetStates = {};
    plan.isFree = false;
    vi.restoreAllMocks();
  });

  it('drops a wider remembered range onto the free plan allowance', () => {
    plan.isFree = true;
    insightsApi.selection.range = '90d';

    insightsApi.reset();

    expect(insightsApi.selection.range).toBe('7d');
  });

  it('keeps a wider remembered range on a paid plan', () => {
    insightsApi.selection.range = '90d';

    insightsApi.reset();

    expect(insightsApi.selection.range).toBe('90d');
  });

  it('steps back one page at a time instead of re-fetching an emptied page', async () => {
    const table = widgetOf({ id: 'course_details', pageGroup: 'courses' });
    setDashboard('cohort', [table]);
    insightsApi.selection.pages = { courses: { page: 3, sort: null } };

    const requestedPages: number[] = [];
    vi.spyOn(insightsApi, 'sharedQuery').mockImplementation(async (spec) => {
      requestedPages.push(spec.page ?? 1);

      return resultOf(0, 15);
    });

    await insightsApi.runWidget(table);

    expect(requestedPages).toEqual([3, 2, 1]);
    expect(insightsApi.pageState('courses').page).toBe(1);
  });

  it('jumps to the last page when the result set shrank below the requested page', async () => {
    const table = widgetOf({ id: 'course_details', pageGroup: 'courses' });
    setDashboard('cohort', [table]);
    insightsApi.selection.pages = { courses: { page: 5, sort: null } };

    const requestedPages: number[] = [];
    vi.spyOn(insightsApi, 'sharedQuery').mockImplementation(async (spec) => {
      const page = spec.page ?? 1;
      requestedPages.push(page);

      return page === 5 ? resultOf(0, 7) : resultOf(2, 7);
    });

    await insightsApi.runWidget(table);

    expect(requestedPages).toEqual([5, 2]);
    expect(insightsApi.pageState('courses').page).toBe(2);
    expect(insightsApi.widgetState('course_details').result?.rows).toHaveLength(2);
  });

  it('keeps standing pagers intact when the range changes', async () => {
    const table = widgetOf({ id: 'course_details', pageGroup: 'courses' });
    const rangeWidget = widgetOf({ id: 'scores_by_exercise', usesRange: true });
    setDashboard('cohort', [table, rangeWidget]);
    const sort = { key: 'progress_pct__avg', dir: 'asc' as const };
    insightsApi.selection.pages = { courses: { page: 3, sort } };

    vi.spyOn(insightsApi, 'sharedQuery').mockResolvedValue(resultOf(1, 1));

    await insightsApi.selectRange('7d');

    expect(insightsApi.pageState('courses')).toEqual({ page: 3, sort });
    expect(insightsApi.widgetState('scores_by_exercise').result).not.toBeNull();
    expect(insightsApi.widgetState('course_details').result).toBeNull();
  });

  it('keeps standing pagers intact when the exercise changes', async () => {
    const table = widgetOf({ id: 'course_details', pageGroup: 'courses' });
    const exerciseWidget = widgetOf({
      id: 'exercise_score_distribution',
      usesRange: true,
      filters: [{ field: 'exercise', op: 'eq', value: INSIGHTS_PLACEHOLDERS.exercise }]
    });
    setDashboard('cohort', [table, exerciseWidget]);
    insightsApi.selection.pages = { courses: { page: 2, sort: null } };

    vi.spyOn(insightsApi, 'sharedQuery').mockResolvedValue(resultOf(1, 1));

    await insightsApi.selectExercise('exercise-1');

    expect(insightsApi.pageState('courses')).toEqual({ page: 2, sort: null });
    expect(insightsApi.widgetState('exercise_score_distribution').result).not.toBeNull();
    expect(insightsApi.widgetState('course_details').result).toBeNull();
  });

  it('keeps page groups of widgets outside the selected breakdown', async () => {
    const coursesWidget = widgetOf({ id: 'courses_by_completion', pageGroup: 'courses' });
    const cohortsWidget = widgetOf({ id: 'cohorts_at_a_glance', pageGroup: 'cohorts', breakdown: 'cohorts' });
    setDashboard('org', [coursesWidget, cohortsWidget], 3);
    insightsApi.selection.breakdown = 'courses';
    insightsApi.selection.pages = {
      courses: { page: 2, sort: null },
      cohorts: { page: 4, sort: null }
    };

    vi.spyOn(insightsApi, 'sharedQuery').mockResolvedValue(resultOf(3, 20));

    await insightsApi.setBreakdown('cohorts');

    expect(insightsApi.pageState('courses')).toEqual({ page: 2, sort: null });
    expect(insightsApi.pageState('cohorts')).toEqual({ page: 1, sort: null });
  });

  it('runs hidden data widgets without adding them to the rendered grid', async () => {
    const chart = widgetOf({ id: 'scores_by_exercise_by_cohort', breakdown: 'cohorts' });
    const options = widgetOf({ id: 'cohort_empty', breakdown: 'cohorts', hidden: true });
    setDashboard('org', [chart, options], 3);
    insightsApi.selection.breakdown = 'cohorts';

    vi.spyOn(insightsApi, 'sharedQuery').mockResolvedValue(resultOf(1, 1));

    await insightsApi.runVisibleWidgets();

    expect(insightsApi.visibleWidgets.map((widget) => widget.id)).toContain('cohort_empty');
    expect(insightsApi.displayWidgets.map((widget) => widget.id)).not.toContain('cohort_empty');
    expect(insightsApi.widgetState('cohort_empty').result).not.toBeNull();
  });
});

describe('insights refresh', () => {
  const summary = {
    scope: {
      type: 'course',
      id: 'course-1',
      name: 'Leadership',
      description: null,
      studentCount: 9,
      pendingCount: 0,
      cohortCount: 2,
      activeCohortCount: 0,
      studentTarget: null,
      courses: [{ id: 'course-1', title: 'Leadership', isGrouped: true, hasPassRequired: false }]
    },
    structures: {},
    widgets: [],
    refreshIntervalSeconds: 30
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    apiExecute.mockReset();
    apiExecute.mockResolvedValue({ data: summary });
    insightsApi.scope = { type: 'course', id: 'course-1' } as never;
    insightsApi.dashboard = {
      ...summary,
      scope: { ...summary.scope, studentCount: 5 }
    } as unknown as InsightsDashboard;
    insightsApi.selection = {
      courseId: 'course-1',
      exerciseId: null,
      range: 'all',
      breakdown: 'courses',
      cohortIds: null,
      pages: { courses: { page: 2, sort: null } }
    };
    insightsApi.cohortOptions = [];
    insightsApi.cohortOptionsHasLoaded = false;
    insightsApi.cohortOptionsOpen = false;
  });

  it('refreshes the summary and keeps a surviving course selection and page', async () => {
    const runWidgets = vi.spyOn(insightsApi, 'runVisibleWidgets').mockResolvedValue();

    await insightsApi.poll();

    expect(apiExecute).toHaveBeenCalledTimes(1);
    expect(insightsApi.dashboard?.scope.studentCount).toBe(9);
    expect(insightsApi.selection.courseId).toBe('course-1');
    expect(insightsApi.pageState('courses').page).toBe(2);
    expect(runWidgets).toHaveBeenCalledWith({});
  });

  it('falls back to the default course and clears offsets when the selected course is gone', async () => {
    insightsApi.dashboard = {
      ...summary,
      scope: {
        ...summary.scope,
        courses: [
          { id: 'course-1', title: 'Leadership', isGrouped: true, hasPassRequired: false },
          { id: 'course-2', title: 'New course', isGrouped: true, hasPassRequired: false }
        ]
      }
    } as unknown as InsightsDashboard;
    insightsApi.selection.courseId = 'course-old';

    vi.spyOn(insightsApi, 'runVisibleWidgets').mockResolvedValue();

    await insightsApi.poll();

    expect(insightsApi.selection.courseId).toBe('course-1');
    expect(insightsApi.pageState('courses').page).toBe(1);
  });

  it('passes the refresh flag to widgets on a manual refresh', async () => {
    const runWidgets = vi.spyOn(insightsApi, 'runVisibleWidgets').mockResolvedValue();

    await insightsApi.refreshAll();

    expect(runWidgets).toHaveBeenCalledWith({ refresh: true });
  });

  it('still refreshes widgets when the summary request fails', async () => {
    apiExecute.mockResolvedValue(undefined);
    const runWidgets = vi.spyOn(insightsApi, 'runVisibleWidgets').mockResolvedValue();

    await insightsApi.poll();

    expect(runWidgets).toHaveBeenCalledWith({});
  });

  it('refreshes an open picker when polling and on open', async () => {
    const pickerResult = cohortResult(
      [{ id: 'coh-a', name: 'Cohort A', students: 4, completed: 1, createdAt: '2026-04-03T00:00:00Z' }],
      1
    );
    const shared = vi.spyOn(insightsApi, 'sharedQuery').mockResolvedValue(pickerResult);
    vi.spyOn(insightsApi, 'runVisibleWidgets').mockResolvedValue();
    insightsApi.cohortOptionsHasLoaded = true;
    insightsApi.cohortOptionsOpen = true;

    await insightsApi.poll();

    expect(shared).toHaveBeenCalledWith(expect.objectContaining({ source: 'cohort_summary' }), { refresh: false });

    shared.mockClear();
    await insightsApi.openCohortOptions();

    expect(shared).toHaveBeenCalledWith(expect.objectContaining({ source: 'cohort_summary' }), { refresh: true });
  });
});

function cohortResult(
  rows: Array<{ id: string; name: string; students: number; completed: number; createdAt: string }>,
  total: number
): InsightsResult {
  return {
    rows: rows.map((row) => ({
      cohort_id: row.id,
      cohort_label: row.name,
      students__value: row.students,
      completed_students__value: row.completed,
      cohort_created_at__value: row.createdAt
    })),
    columns: [],
    total
  } as unknown as InsightsResult;
}

describe('insights cohort picker', () => {
  const cohortA = {
    id: 'coh-a',
    name: 'Cohort A',
    students: 4,
    completed: 1,
    createdAt: '2026-04-03T00:00:00Z'
  };
  const cohortB = {
    id: 'coh-b',
    name: 'Cohort B',
    students: 0,
    completed: 0,
    createdAt: '2026-04-02T00:00:00Z'
  };
  const cohortC = {
    id: 'coh-c',
    name: 'Spring cohort',
    students: 2,
    completed: 2,
    createdAt: '2026-04-01T00:00:00Z'
  };

  beforeEach(() => {
    insightsApi.selection = {
      courseId: null,
      exerciseId: null,
      range: 'all',
      breakdown: 'cohorts',
      cohortIds: null,
      pages: {}
    };
    insightsApi.scope = { type: 'course', id: 'course-1' } as never;
    insightsApi.dashboard = {
      scope: { type: 'course', id: 'course-1', cohortCount: 25, courses: [] },
      widgets: [],
      structures: {}
    } as unknown as InsightsDashboard;
    insightsApi.cohortOptions = [];
    insightsApi.cohortOptionsById = {};
    insightsApi.cohortOptionsSearch = '';
    insightsApi.cohortOptionsMatchTotal = 0;
    insightsApi.cohortOptionsHasLoaded = false;
    vi.restoreAllMocks();
  });

  it('loads a page on open, searches on the server and appends the next page', async () => {
    const specs: Array<{ page?: number; search?: string }> = [];
    vi.spyOn(insightsApi, 'sharedQuery').mockImplementation(async (spec) => {
      specs.push({ page: spec.page, search: spec.search });

      if (spec.search === 'spring') return cohortResult([cohortC], 1);
      if ((spec.page ?? 1) === 1) return cohortResult([cohortA, cohortB], 25);

      return cohortResult([cohortC], 25);
    });

    await insightsApi.loadCohortOptions();

    expect(insightsApi.cohortOptions.map((option) => option.id)).toEqual(['coh-a', 'coh-b']);
    expect(insightsApi.cohortOptionsMatchTotal).toBe(25);
    expect(insightsApi.cohortOptionsHasMore).toBe(true);
    expect(insightsApi.cohortCount).toBe(25);
    expect(insightsApi.cohortOptionsById['coh-a']?.name).toBe('Cohort A');

    await insightsApi.searchCohortOptions('spring');

    expect(specs.at(-1)).toEqual({ page: 1, search: 'spring' });
    expect(insightsApi.cohortOptions.map((option) => option.id)).toEqual(['coh-c']);

    await insightsApi.searchCohortOptions('');
    await insightsApi.loadMoreCohortOptions();

    expect(specs.at(-1)).toEqual({ page: 2, search: undefined });
    expect(insightsApi.cohortOptions.map((option) => option.id)).toEqual(['coh-a', 'coh-b', 'coh-c']);
  });

  it('clears the picker state when the dashboard resets', async () => {
    vi.spyOn(insightsApi, 'sharedQuery').mockResolvedValue(cohortResult([cohortA], 1));

    await insightsApi.loadCohortOptions();
    insightsApi.reset();

    expect(insightsApi.cohortOptions).toEqual([]);
    expect(insightsApi.cohortOptionsById).toEqual({});
    expect(insightsApi.cohortOptionsHasLoaded).toBe(false);
    expect(insightsApi.cohortOptionsSearch).toBe('');
  });
});
