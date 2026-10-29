import { INSIGHTS_LIMITS } from '@cio/utils/constants/insights';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { studentExportPost, queryPost, snackbarError } = vi.hoisted(() => ({
  studentExportPost: vi.fn(),
  queryPost: vi.fn(),
  snackbarError: vi.fn()
}));

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
    async execute({ requestFn }: { requestFn: () => Promise<{ json: () => Promise<unknown> }> }) {
      const response = await requestFn();
      const result = (await response.json()) as { success: boolean; data?: unknown };

      return result.success ? result : undefined;
    }
  },
  classroomio: {
    insights: {
      query: { $post: queryPost },
      export: { students: { $post: studentExportPost } }
    }
  }
}));

vi.mock('$lib/utils/functions/translations', () => ({
  t: {
    get: (key: string, vars: Record<string, unknown> = {}) => `${key}:${JSON.stringify(vars)}`
  }
}));

vi.mock('$lib/utils/store/org', () => ({
  isFreePlan: {
    subscribe(run: (value: boolean) => void) {
      run(false);

      return () => {};
    }
  }
}));

import { insightsApi } from './insights.svelte';
import { insightsStudentsApi } from './students.svelte';
import type { InsightsDashboard, InsightsRow, StudentExerciseCell, StudentExportHeaders } from '../utils/types';

const headers: StudentExportHeaders = {
  name: 'Name',
  email: 'Email',
  progress: 'Progress',
  nowAt: 'Now at',
  finished: 'Finished',
  averageScore: 'Average score',
  coursesCompleted: 'Courses completed',
  video: 'Video',
  classroom: 'Classroom',
  certificates: 'Certificates',
  lastLogin: 'Last login',
  status: 'Status',
  statusLabels: {
    at_risk: 'At risk',
    lagging: 'Lagging',
    on_track: 'On track',
    completed: 'Completed'
  }
};

const studentRows = [
  { student_id: 'student-1', name__value: 'Jane Doe', status__value: 'at_risk' },
  { student_id: 'student-2', name__value: 'John Doe', status__value: 'on_track' },
  { student_id: 'student-3', name__value: 'Ada Lovelace', status__value: 'completed' }
] as InsightsRow[];

const exerciseRows = [
  {
    student_id: 'student-1',
    exercise_id: 'exercise-1',
    best_score_pct__value: 80,
    state__value: 'graded',
    passed__value: true
  }
] as InsightsRow[];

function toCells(rows: InsightsRow[]): Record<string, Record<string, StudentExerciseCell>> {
  const cells: Record<string, Record<string, StudentExerciseCell>> = {};

  for (const row of rows) {
    const studentId = String(row.student_id);
    const exerciseId = String(row.exercise_id);

    cells[studentId] ??= {};
    cells[studentId][exerciseId] = {
      scorePct: typeof row.best_score_pct__value === 'number' ? row.best_score_pct__value : null,
      state: row.state__value === 'graded' ? 'graded' : 'not_taken',
      passed: typeof row.passed__value === 'boolean' ? row.passed__value : null
    };
  }

  return cells;
}

function setSelection(courseId: string | null) {
  insightsApi.scope = { type: 'cohort', id: 'scope-1' };
  insightsApi.selection = {
    courseId,
    exerciseId: null,
    range: 'all',
    breakdown: 'core',
    cohortIds: null,
    pages: {}
  };
  insightsApi.dashboard = {
    structures: {
      'course-1': { items: [{ id: 'exercise-1', title: 'Exercise one', type: 'EXERCISE' }] }
    }
  } as unknown as InsightsDashboard;
}

function respondWith(
  studentRowsResult: InsightsRow[],
  exerciseRowsResult: InsightsRow[] = [],
  flags: { studentsTruncated?: boolean; exercisesTruncated?: boolean } = {}
) {
  studentExportPost.mockImplementation(async () => ({
    json: async () => ({
      success: true,
      data: {
        students: { rows: studentRowsResult, columns: [], total: studentRowsResult.length },
        cells: toCells(exerciseRowsResult),
        studentsTruncated: flags.studentsTruncated ?? false,
        exercisesTruncated: flags.exercisesTruncated ?? false
      }
    })
  }));
}

function resultResponse(rows: InsightsRow[], total = rows.length) {
  return {
    json: async () => ({ success: true, data: { rows, columns: [], total } })
  };
}

function failureResponse() {
  return {
    json: async () => ({ success: false, error: 'boom' })
  };
}

function specOf(request: { json: { spec: { dimensions: string[] } } }): string {
  const dimensions = request.json.spec.dimensions;
  if (dimensions.includes('exercise') && dimensions.includes('student')) return 'cells';
  if (dimensions.includes('exercise')) return 'attempted';

  return 'students';
}

describe('insights students load failures', () => {
  beforeEach(() => {
    queryPost.mockReset();
    snackbarError.mockClear();
    insightsStudentsApi.rows = [];
    insightsStudentsApi.total = 0;
    insightsStudentsApi.cells = {};
    insightsStudentsApi.attemptedResult = null;
    insightsStudentsApi.hasLoaded = false;
    insightsStudentsApi.loadingPage = false;
    insightsStudentsApi.failed = false;
    insightsStudentsApi.cellsFailed = false;
    insightsStudentsApi.attemptedFailed = false;
    insightsStudentsApi.page = 1;
    insightsStudentsApi.search = '';
    insightsStudentsApi.sort = null;
    insightsStudentsApi.filters = { status: '', activity: '', score: '', flag: '' };
  });

  it('keeps the rows and reports a failed manual refresh', async () => {
    setSelection(null);
    insightsStudentsApi.rows = [studentRows[0]];
    insightsStudentsApi.hasLoaded = true;
    queryPost.mockResolvedValue(failureResponse());

    await insightsStudentsApi.refreshVisible({ refresh: true });

    expect(insightsStudentsApi.rows).toHaveLength(1);
    expect(insightsStudentsApi.failed).toBe(false);
    expect(snackbarError).toHaveBeenCalledWith('snackbar.insights.students_refresh_failed');
  });

  it('stays silent when a background refresh fails', async () => {
    setSelection(null);
    insightsStudentsApi.rows = [studentRows[0]];
    insightsStudentsApi.hasLoaded = true;
    queryPost.mockResolvedValue(failureResponse());

    await insightsStudentsApi.refreshVisible();

    expect(snackbarError).not.toHaveBeenCalled();
  });

  it('marks a failed first load instead of rendering an empty table', async () => {
    setSelection(null);
    queryPost.mockResolvedValue(failureResponse());

    await insightsStudentsApi.load();

    expect(insightsStudentsApi.hasLoaded).toBe(true);
    expect(insightsStudentsApi.failed).toBe(true);
    expect(insightsStudentsApi.rows).toHaveLength(0);
  });

  it('stops a non-quiet load when an exercise chunk fails', async () => {
    setSelection('course-1');
    queryPost.mockImplementation(async (request) => {
      if (specOf(request) === 'cells') return failureResponse();

      return specOf(request) === 'attempted' ? resultResponse([]) : resultResponse([studentRows[0]]);
    });

    await insightsStudentsApi.load();

    expect(insightsStudentsApi.cellsFailed).toBe(true);
    expect(insightsStudentsApi.cells).toEqual({});
    expect(insightsStudentsApi.rows).toHaveLength(1);
  });

  it('keeps the loaded exercise cells when a background refresh fails', async () => {
    setSelection('course-1');
    queryPost.mockImplementation(async (request) => {
      if (specOf(request) === 'cells') return resultResponse(exerciseRows);

      return specOf(request) === 'attempted' ? resultResponse([]) : resultResponse([studentRows[0]]);
    });

    await insightsStudentsApi.load();
    const loadedCells = structuredClone(insightsStudentsApi.cells);

    queryPost.mockImplementation(async (request) => {
      if (specOf(request) === 'cells') return failureResponse();

      return specOf(request) === 'attempted' ? resultResponse([]) : resultResponse([studentRows[0]]);
    });

    await insightsStudentsApi.refreshVisible();

    expect(insightsStudentsApi.cells).toEqual(loadedCells);
    expect(insightsStudentsApi.cellsFailed).toBe(false);
  });

  it('keeps the last attempted counts when that query fails', async () => {
    const attemptedRows = [{ exercise_id: 'exercise-1', is_attempted__count_if: 2 }] as InsightsRow[];
    setSelection('course-1');
    queryPost.mockImplementation(async (request) => {
      if (specOf(request) === 'attempted') return resultResponse(attemptedRows);
      if (specOf(request) === 'cells') return resultResponse([]);

      return resultResponse([studentRows[0]]);
    });

    await insightsStudentsApi.load();
    expect(insightsStudentsApi.attemptedResult?.rows).toHaveLength(1);

    queryPost.mockImplementation(async (request) => {
      if (specOf(request) === 'attempted') return failureResponse();
      if (specOf(request) === 'cells') return resultResponse([]);

      return resultResponse([studentRows[0]]);
    });

    await insightsStudentsApi.refreshVisible();

    expect(insightsStudentsApi.attemptedFailed).toBe(true);
    expect(insightsStudentsApi.attemptedResult?.rows).toHaveLength(1);
  });
});

describe('insights students export', () => {
  beforeEach(() => {
    studentExportPost.mockReset();
    queryPost.mockReset();
    insightsStudentsApi.rows = [];
    insightsStudentsApi.filters = { status: 'at_risk', activity: '', score: '', flag: '' };
    insightsStudentsApi.search = 'jane';
    insightsStudentsApi.sort = { key: 'status_rank__value', dir: 'asc' };
  });

  it('exports every matching student, not only the rows on the current page', async () => {
    setSelection('course-1');
    insightsStudentsApi.rows = [studentRows[0]];
    respondWith(studentRows, exerciseRows);

    const document = await insightsStudentsApi.buildExportDocument({
      filename: 'Cohort students',
      title: 'Cohort',
      headers,
      attemptedByExercise: new Map([['exercise-1', 1]])
    });

    const request = studentExportPost.mock.calls[0]?.[0];

    expect(request?.json.studentSpec).toMatchObject({
      page: 1,
      limit: INSIGHTS_LIMITS.maxExportRows,
      search: 'jane',
      sort: [{ field: 'status_rank__value', dir: 'asc' }],
      filters: [
        { field: 'status', op: 'eq', value: 'at_risk' },
        { field: 'course', op: 'eq', value: 'course-1' }
      ]
    });
    expect(request?.json.exerciseSpec).toMatchObject({
      page: 1,
      limit: INSIGHTS_LIMITS.maxExportRows,
      filters: [{ field: 'course', op: 'eq', value: 'course-1' }]
    });
    expect(studentExportPost).toHaveBeenCalledTimes(1);
    expect(document.rows).toHaveLength(3);
    expect(document.columns.map((column) => column.header)).toEqual([
      'Name',
      'Email',
      'Progress',
      'Now at',
      'Exercise one',
      'Video',
      'Classroom',
      'Certificates',
      'Last login',
      'Status'
    ]);
    expect(document.columns.find((column) => column.key === 'exercise_exercise-1')?.value(document.rows[0])).toBe(80);
  });

  it('does not request exercise columns when no course is selected', async () => {
    setSelection(null);
    respondWith(studentRows);

    const document = await insightsStudentsApi.buildExportDocument({
      filename: 'Cohort students',
      title: 'Cohort',
      headers,
      attemptedByExercise: new Map()
    });

    const request = studentExportPost.mock.calls[0]?.[0];

    expect(request?.json.exerciseSpec).toBeUndefined();
    expect(document.rows).toHaveLength(3);
    expect(document.columns.some((column) => column.key.startsWith('exercise_'))).toBe(false);
    expect(document.columns.map((column) => column.header)).toEqual([
      'Name',
      'Email',
      'Progress',
      'Average score',
      'Courses completed',
      'Video',
      'Classroom',
      'Certificates',
      'Last login',
      'Status'
    ]);
  });

  it('puts a visible cap notice in the document when the export is partial', async () => {
    setSelection('course-1');
    respondWith(studentRows, exerciseRows, { studentsTruncated: true, exercisesTruncated: true });

    const document = await insightsStudentsApi.buildExportDocument({
      filename: 'Cohort students',
      title: 'Cohort',
      headers,
      attemptedByExercise: new Map([['exercise-1', 1]])
    });

    expect(document.subtitle).toContain('insights.export.students_capped');
    expect(document.subtitle).toContain('insights.export.exercises_capped');
  });

  it('throws when the export request fails', async () => {
    setSelection('course-1');
    studentExportPost.mockImplementation(async () => failureResponse());

    await expect(
      insightsStudentsApi.buildExportDocument({
        filename: 'Cohort students',
        title: 'Cohort',
        headers,
        attemptedByExercise: new Map()
      })
    ).rejects.toThrow('Insights student export failed');
  });

  it('forces the table query on a manual refresh', async () => {
    setSelection(null);
    queryPost.mockImplementation(async () => ({
      json: async () => ({
        success: true,
        data: { rows: [studentRows[0]], columns: [], total: 1 }
      })
    }));

    await insightsStudentsApi.refreshVisible({ refresh: true });

    const request = queryPost.mock.calls[0]?.[0];

    expect(request?.json.refresh).toBe(true);
    expect(insightsStudentsApi.rows).toHaveLength(1);
  });
});
