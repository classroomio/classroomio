import { ANALYTICS_PLACEHOLDERS } from '@cio/utils/constants/analytics';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const plan = vi.hoisted(() => ({ isFree: false }));
const apiExecute = vi.hoisted(() => vi.fn());
const snackbarError = vi.hoisted(() => vi.fn());

vi.mock('$features/ui/snackbar/store', () => ({
  snackbar: {
    error: snackbarError,
    info: vi.fn(),
    loading: vi.fn(() => 'toast-1'),
    success: vi.fn()
  }
}));

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

import { analyticsApi } from './analytics.svelte';
import type { AnalyticsDashboard, AnalyticsFilter, AnalyticsResult, AnalyticsWidget } from '../utils/types';

type WidgetInput = {
  id: string;
  pageGroup?: string;
  usesRange?: boolean;
  breakdown?: 'core' | 'courses' | 'cohorts';
  filters?: AnalyticsFilter[];
  hidden?: boolean;
};

function widgetOf(input: WidgetInput): AnalyticsWidget {
  return {
    id: input.id,
    titleKey: `analytics.widgets.${input.id}.title`,
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
  } as unknown as AnalyticsWidget;
}

function resultOf(rowCount: number, total: number): AnalyticsResult {
  return {
    rows: Array.from({ length: rowCount }, (_, index) => ({ id: `row-${index}` })),
    columns: [],
    total
  } as unknown as AnalyticsResult;
}

function setDashboard(scopeType: 'cohort' | 'org', widgets: AnalyticsWidget[], cohortCount = 0) {
  analyticsApi.scope = { type: scopeType, id: 'scope-1' } as never;
  analyticsApi.dashboard = {
    scope: { type: scopeType, id: 'scope-1', cohortCount, courses: [] },
    widgets,
    structures: {}
  } as unknown as AnalyticsDashboard;
}

describe('analytics page state', () => {
  beforeEach(() => {
    analyticsApi.selection = {
      courseId: null,
      exerciseId: null,
      range: 'all',
      breakdown: 'courses',
      cohortIds: null,
      pages: {}
    };
    analyticsApi.widgetStates = {};
    plan.isFree = false;
    vi.restoreAllMocks();
  });

  it('drops a wider remembered range onto the free plan allowance', () => {
    plan.isFree = true;
    analyticsApi.selection.range = '90d';

    analyticsApi.reset();

    expect(analyticsApi.selection.range).toBe('7d');
  });

  it('keeps a wider remembered range on a paid plan', () => {
    analyticsApi.selection.range = '90d';

    analyticsApi.reset();

    expect(analyticsApi.selection.range).toBe('90d');
  });

  it('steps back one page at a time instead of re-fetching an emptied page', async () => {
    const table = widgetOf({ id: 'course_details', pageGroup: 'courses' });
    setDashboard('cohort', [table]);
    analyticsApi.selection.pages = { courses: { page: 3, sort: null } };

    const requestedPages: number[] = [];
    vi.spyOn(analyticsApi, 'sharedQuery').mockImplementation(async (spec) => {
      requestedPages.push(spec.page ?? 1);

      return resultOf(0, 15);
    });

    await analyticsApi.runWidget(table);

    expect(requestedPages).toEqual([3, 2, 1]);
    expect(analyticsApi.pageState('courses').page).toBe(1);
  });

  it('jumps to the last page when the result set shrank below the requested page', async () => {
    const table = widgetOf({ id: 'course_details', pageGroup: 'courses' });
    setDashboard('cohort', [table]);
    analyticsApi.selection.pages = { courses: { page: 5, sort: null } };

    const requestedPages: number[] = [];
    vi.spyOn(analyticsApi, 'sharedQuery').mockImplementation(async (spec) => {
      const page = spec.page ?? 1;
      requestedPages.push(page);

      return page === 5 ? resultOf(0, 7) : resultOf(2, 7);
    });

    await analyticsApi.runWidget(table);

    expect(requestedPages).toEqual([5, 2]);
    expect(analyticsApi.pageState('courses').page).toBe(2);
    expect(analyticsApi.widgetState('course_details').result?.rows).toHaveLength(2);
  });

  it('keeps standing pagers intact when the range changes', async () => {
    const table = widgetOf({ id: 'course_details', pageGroup: 'courses' });
    const rangeWidget = widgetOf({ id: 'scores_by_exercise', usesRange: true });
    setDashboard('cohort', [table, rangeWidget]);
    const sort = { key: 'progress_pct__avg', dir: 'asc' as const };
    analyticsApi.selection.pages = { courses: { page: 3, sort } };

    vi.spyOn(analyticsApi, 'sharedQuery').mockResolvedValue(resultOf(1, 1));

    await analyticsApi.selectRange('7d');

    expect(analyticsApi.pageState('courses')).toEqual({ page: 3, sort });
    expect(analyticsApi.widgetState('scores_by_exercise').result).not.toBeNull();
    expect(analyticsApi.widgetState('course_details').result).toBeNull();
  });

  it('keeps standing pagers intact when the exercise changes', async () => {
    const table = widgetOf({ id: 'course_details', pageGroup: 'courses' });
    const exerciseWidget = widgetOf({
      id: 'exercise_score_distribution',
      usesRange: true,
      filters: [{ field: 'exercise', op: 'eq', value: ANALYTICS_PLACEHOLDERS.exercise }]
    });
    setDashboard('cohort', [table, exerciseWidget]);
    analyticsApi.selection.pages = { courses: { page: 2, sort: null } };

    vi.spyOn(analyticsApi, 'sharedQuery').mockResolvedValue(resultOf(1, 1));

    await analyticsApi.selectExercise('exercise-1');

    expect(analyticsApi.pageState('courses')).toEqual({ page: 2, sort: null });
    expect(analyticsApi.widgetState('exercise_score_distribution').result).not.toBeNull();
    expect(analyticsApi.widgetState('course_details').result).toBeNull();
  });

  it('keeps page groups of widgets outside the selected breakdown', async () => {
    const coursesWidget = widgetOf({ id: 'courses_by_completion', pageGroup: 'courses' });
    const cohortsWidget = widgetOf({ id: 'cohorts_at_a_glance', pageGroup: 'cohorts', breakdown: 'cohorts' });
    setDashboard('org', [coursesWidget, cohortsWidget], 3);
    analyticsApi.selection.breakdown = 'courses';
    analyticsApi.selection.pages = {
      courses: { page: 2, sort: null },
      cohorts: { page: 4, sort: null }
    };

    vi.spyOn(analyticsApi, 'sharedQuery').mockResolvedValue(resultOf(3, 20));

    await analyticsApi.setBreakdown('cohorts');

    expect(analyticsApi.pageState('courses')).toEqual({ page: 2, sort: null });
    expect(analyticsApi.pageState('cohorts')).toEqual({ page: 1, sort: null });
  });

  it('drops a widget result that resolves after the scope changed', async () => {
    const table = widgetOf({ id: 'course_details' });
    setDashboard('cohort', [table]);
    let resolveQuery = (_result: AnalyticsResult) => {};
    const pending = new Promise<AnalyticsResult | null>((resolve) => {
      resolveQuery = resolve;
    });
    vi.spyOn(analyticsApi, 'sharedQuery').mockReturnValue(pending);

    const run = analyticsApi.runWidget(table);
    analyticsApi.reset();
    resolveQuery(resultOf(1, 1));
    await run;

    expect(analyticsApi.widgetState('course_details').result).toBeNull();
    expect(analyticsApi.widgetState('course_details').loading).toBe(false);
  });

  it('applies the newest request when the same widget runs again after a reset', async () => {
    const table = widgetOf({ id: 'course_details' });
    setDashboard('cohort', [table]);
    const pending: Array<(result: AnalyticsResult) => void> = [];
    vi.spyOn(analyticsApi, 'sharedQuery').mockImplementation(
      () =>
        new Promise<AnalyticsResult | null>((resolve) => {
          pending.push((result) => resolve(result));
        })
    );

    const firstRun = analyticsApi.runWidget(table);
    analyticsApi.reset();
    setDashboard('cohort', [table]);
    const secondRun = analyticsApi.runWidget(table);

    pending[0](resultOf(3, 3));
    pending[1](resultOf(1, 1));
    await Promise.all([firstRun, secondRun]);

    expect(analyticsApi.widgetState('course_details').result?.rows).toHaveLength(1);
  });

  it('runs hidden data widgets without adding them to the rendered grid', async () => {
    const chart = widgetOf({ id: 'scores_by_exercise_by_cohort', breakdown: 'cohorts' });
    const options = widgetOf({ id: 'cohort_empty', breakdown: 'cohorts', hidden: true });
    setDashboard('org', [chart, options], 3);
    analyticsApi.selection.breakdown = 'cohorts';

    vi.spyOn(analyticsApi, 'sharedQuery').mockResolvedValue(resultOf(1, 1));

    await analyticsApi.runVisibleWidgets();

    expect(analyticsApi.visibleWidgets.map((widget) => widget.id)).toContain('cohort_empty');
    expect(analyticsApi.displayWidgets.map((widget) => widget.id)).not.toContain('cohort_empty');
    expect(analyticsApi.widgetState('cohort_empty').result).not.toBeNull();
  });
});

describe('analytics refresh', () => {
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
    analyticsApi.scope = { type: 'course', id: 'course-1' } as never;
    analyticsApi.dashboard = {
      ...summary,
      scope: { ...summary.scope, studentCount: 5 }
    } as unknown as AnalyticsDashboard;
    analyticsApi.selection = {
      courseId: 'course-1',
      exerciseId: null,
      range: 'all',
      breakdown: 'courses',
      cohortIds: null,
      pages: { courses: { page: 2, sort: null } }
    };
    analyticsApi.cohortOptions = [];
    analyticsApi.cohortOptionsHasLoaded = false;
    analyticsApi.cohortOptionsOpen = false;
  });

  it('refreshes the summary and keeps a surviving course selection and page', async () => {
    const runWidgets = vi.spyOn(analyticsApi, 'runVisibleWidgets').mockResolvedValue();

    await analyticsApi.poll();

    expect(apiExecute).toHaveBeenCalledTimes(1);
    expect(analyticsApi.dashboard?.scope.studentCount).toBe(9);
    expect(analyticsApi.selection.courseId).toBe('course-1');
    expect(analyticsApi.pageState('courses').page).toBe(2);
    expect(runWidgets).toHaveBeenCalledWith({});
  });

  it('falls back to the default course and clears offsets when the selected course is gone', async () => {
    analyticsApi.dashboard = {
      ...summary,
      scope: {
        ...summary.scope,
        courses: [
          { id: 'course-1', title: 'Leadership', isGrouped: true, hasPassRequired: false },
          { id: 'course-2', title: 'New course', isGrouped: true, hasPassRequired: false }
        ]
      }
    } as unknown as AnalyticsDashboard;
    analyticsApi.selection.courseId = 'course-old';

    vi.spyOn(analyticsApi, 'runVisibleWidgets').mockResolvedValue();

    await analyticsApi.poll();

    expect(analyticsApi.selection.courseId).toBe('course-1');
    expect(analyticsApi.pageState('courses').page).toBe(1);
  });

  it('passes the refresh flag to widgets on a manual refresh', async () => {
    const runWidgets = vi.spyOn(analyticsApi, 'runVisibleWidgets').mockResolvedValue();

    await analyticsApi.refreshAll();

    expect(runWidgets).toHaveBeenCalledWith({ refresh: true });
  });

  it('still refreshes widgets when the summary request fails', async () => {
    apiExecute.mockResolvedValue(undefined);
    const runWidgets = vi.spyOn(analyticsApi, 'runVisibleWidgets').mockResolvedValue();

    await analyticsApi.poll();

    expect(runWidgets).toHaveBeenCalledWith({});
  });

  it('reports a failed manual refresh but stays silent while polling', async () => {
    apiExecute.mockImplementation(async (options: { onError?: () => void }) => {
      options.onError?.();
    });
    snackbarError.mockClear();
    vi.spyOn(analyticsApi, 'runVisibleWidgets').mockResolvedValue();

    await analyticsApi.poll();

    expect(snackbarError).not.toHaveBeenCalled();

    await analyticsApi.refreshAll();

    expect(snackbarError).toHaveBeenCalledWith('snackbar.analytics.refresh_failed');
  });

  it('preloads the cohort picker for a scope with more than one cohort', async () => {
    apiExecute.mockImplementation(async (options: { onSuccess?: (response: unknown) => void }) => {
      const response = { data: summary };
      options.onSuccess?.(response);

      return response;
    });
    const shared = vi
      .spyOn(analyticsApi, 'sharedQuery')
      .mockResolvedValue(
        cohortResult(
          [{ id: 'coh-a', name: 'Cohort A', students: 4, completed: 1, createdAt: '2026-04-03T00:00:00Z' }],
          2
        )
      );
    vi.spyOn(analyticsApi, 'runVisibleWidgets').mockResolvedValue();

    await analyticsApi.loadDashboard({ type: 'course', id: 'course-1' } as never);

    expect(shared).toHaveBeenCalledWith(expect.objectContaining({ source: 'cohort_summary' }), { refresh: false });
    expect(analyticsApi.cohortOptions.map((option) => option.id)).toEqual(['coh-a']);
  });

  it('skips the cohort preload when the scope has one cohort', async () => {
    const singleCohortSummary = { ...summary, scope: { ...summary.scope, cohortCount: 1 } };
    apiExecute.mockImplementation(async (options: { onSuccess?: (response: unknown) => void }) => {
      const response = { data: singleCohortSummary };
      options.onSuccess?.(response);

      return response;
    });
    const shared = vi.spyOn(analyticsApi, 'sharedQuery').mockResolvedValue(cohortResult([], 1));
    vi.spyOn(analyticsApi, 'runVisibleWidgets').mockResolvedValue();

    await analyticsApi.loadDashboard({ type: 'course', id: 'course-1' } as never);

    expect(shared).not.toHaveBeenCalled();
  });

  it('refreshes an open picker when polling and on open', async () => {
    const pickerResult = cohortResult(
      [{ id: 'coh-a', name: 'Cohort A', students: 4, completed: 1, createdAt: '2026-04-03T00:00:00Z' }],
      1
    );
    const shared = vi.spyOn(analyticsApi, 'sharedQuery').mockResolvedValue(pickerResult);
    vi.spyOn(analyticsApi, 'runVisibleWidgets').mockResolvedValue();
    analyticsApi.cohortOptionsHasLoaded = true;
    analyticsApi.cohortOptionsOpen = true;

    await analyticsApi.poll();

    expect(shared).toHaveBeenCalledWith(expect.objectContaining({ source: 'cohort_summary' }), { refresh: false });

    shared.mockClear();
    await analyticsApi.openCohortOptions();

    expect(shared).toHaveBeenCalledWith(expect.objectContaining({ source: 'cohort_summary' }), { refresh: true });
  });
});

function cohortResult(
  rows: Array<{ id: string; name: string; students: number; completed: number; createdAt: string }>,
  total: number
): AnalyticsResult {
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
  } as unknown as AnalyticsResult;
}

describe('analytics cohort picker', () => {
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
    analyticsApi.selection = {
      courseId: null,
      exerciseId: null,
      range: 'all',
      breakdown: 'cohorts',
      cohortIds: null,
      pages: {}
    };
    analyticsApi.scope = { type: 'course', id: 'course-1' } as never;
    analyticsApi.dashboard = {
      scope: { type: 'course', id: 'course-1', cohortCount: 25, courses: [] },
      widgets: [],
      structures: {}
    } as unknown as AnalyticsDashboard;
    analyticsApi.cohortOptions = [];
    analyticsApi.cohortOptionsById = {};
    analyticsApi.cohortOptionsSearch = '';
    analyticsApi.cohortOptionsMatchTotal = 0;
    analyticsApi.cohortOptionsHasLoaded = false;
    vi.restoreAllMocks();
  });

  it('loads a page on open, searches on the server and appends the next page', async () => {
    const specs: Array<{ page?: number; search?: string }> = [];
    vi.spyOn(analyticsApi, 'sharedQuery').mockImplementation(async (spec) => {
      specs.push({ page: spec.page, search: spec.search });

      if (spec.search === 'spring') return cohortResult([cohortC], 1);
      if ((spec.page ?? 1) === 1) return cohortResult([cohortA, cohortB], 25);

      return cohortResult([cohortC], 25);
    });

    await analyticsApi.loadCohortOptions();

    expect(analyticsApi.cohortOptions.map((option) => option.id)).toEqual(['coh-a', 'coh-b']);
    expect(analyticsApi.cohortOptionsMatchTotal).toBe(25);
    expect(analyticsApi.cohortOptionsHasMore).toBe(true);
    expect(analyticsApi.cohortCount).toBe(25);
    expect(analyticsApi.cohortOptionsById['coh-a']?.name).toBe('Cohort A');

    await analyticsApi.searchCohortOptions('spring');

    expect(specs.at(-1)).toEqual({ page: 1, search: 'spring' });
    expect(analyticsApi.cohortOptions.map((option) => option.id)).toEqual(['coh-c']);

    await analyticsApi.searchCohortOptions('');
    await analyticsApi.loadMoreCohortOptions();

    expect(specs.at(-1)).toEqual({ page: 2, search: undefined });
    expect(analyticsApi.cohortOptions.map((option) => option.id)).toEqual(['coh-a', 'coh-b', 'coh-c']);
  });

  it('clears the picker state when the dashboard resets', async () => {
    vi.spyOn(analyticsApi, 'sharedQuery').mockResolvedValue(cohortResult([cohortA], 1));

    await analyticsApi.loadCohortOptions();
    analyticsApi.reset();

    expect(analyticsApi.cohortOptions).toEqual([]);
    expect(analyticsApi.cohortOptionsById).toEqual({});
    expect(analyticsApi.cohortOptionsHasLoaded).toBe(false);
    expect(analyticsApi.cohortOptionsSearch).toBe('');
  });
});
