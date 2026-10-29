import { INSIGHTS_LIMITS } from '@cio/utils/constants/insights';
import type { ExportDocument } from '@cio/utils/export';
import { snackbar } from '$features/ui/snackbar/store';
import { t } from '$lib/utils/functions/translations';
import { BaseApi, classroomio } from '$lib/utils/services/api';

import { buildStudentsExportDocument } from '../utils/insights-export';
import {
  isStudentFilterValue,
  studentQueryParts,
  nextSort,
  pageAfterEmptyResult,
  pivotStudentExercises,
  visibleExerciseColumns
} from '../utils/insights-utils';
import type {
  InsightsExportSpec,
  InsightsStudentExportRequest,
  InsightsStudentExportResult,
  InsightsQueryRequest,
  InsightsResult,
  InsightsRow,
  InsightsSpec,
  StudentExerciseCell,
  StudentExportHeaders,
  StudentFilters,
  TableSort
} from '../utils/types';
import { insightsApi } from './insights.svelte';

const STUDENT_MEASURES: InsightsSpec['measures'] = [
  { metric: 'name', agg: 'value' },
  { metric: 'email', agg: 'value' },
  { metric: 'avatar_url', agg: 'value' },
  { metric: 'overall_progress_pct', agg: 'value' },
  { metric: 'avg_score_pct', agg: 'value' },
  { metric: 'courses_completed', agg: 'value' },
  { metric: 'courses_total', agg: 'value' },
  { metric: 'video_pct', agg: 'value' },
  { metric: 'attendance_pct', agg: 'value' },
  { metric: 'certificates', agg: 'value' },
  { metric: 'last_login_at', agg: 'value' },
  { metric: 'is_overdue', agg: 'value' },
  { metric: 'status', agg: 'value' },
  { metric: 'status_rank', agg: 'value' },
  { metric: 'now_at_title', agg: 'value' }
];

const EXERCISE_MEASURES: InsightsSpec['measures'] = [
  { metric: 'best_score_pct', agg: 'value' },
  { metric: 'state', agg: 'value' },
  { metric: 'passed', agg: 'value' }
];

function chunkIds(ids: string[], size: number): string[][] {
  const chunks: string[][] = [];

  for (let start = 0; start < ids.length; start += size) {
    chunks.push(ids.slice(start, start + size));
  }

  return chunks;
}

class InsightsStudentsApi extends BaseApi {
  rows = $state<InsightsRow[]>([]);
  total = $state(0);
  cells = $state<Record<string, Record<string, StudentExerciseCell>>>({});
  attemptedResult = $state<InsightsResult | null>(null);
  filters = $state<StudentFilters>({ status: '', activity: '', score: '', flag: '' });
  sort = $state<TableSort | null>(null);
  search = $state('');
  page = $state(1);
  hasLoaded = $state(false);
  loadingPage = $state(false);
  failed = $state(false);
  cellsFailed = $state(false);
  attemptedFailed = $state(false);

  #seq = 0;
  #attemptedCourseId: string | null = null;

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.total / INSIGHTS_LIMITS.studentsPageSize));
  }

  #studentSpec(page: number, limit: number, selectedCourseId = insightsApi.selection.courseId): InsightsSpec {
    const parts = studentQueryParts(this.filters);
    const courseFilter = selectedCourseId
      ? [{ field: 'course' as const, op: 'eq' as const, value: selectedCourseId }]
      : [];
    const sort = this.sort ? [{ field: this.sort.key, dir: this.sort.dir }] : parts.sort;

    return {
      source: 'student',
      dimensions: ['student'],
      measures: STUDENT_MEASURES,
      filters: [...parts.filters, ...courseFilter],
      sort,
      search: this.search || undefined,
      limit,
      page,
      range: 'all'
    };
  }

  #exerciseSpec(studentIds: string[] | null, courseId: string, limit: number): InsightsSpec {
    const studentFilter = studentIds ? [{ field: 'student' as const, op: 'in' as const, value: studentIds }] : [];

    return {
      source: 'assessment_result',
      dimensions: ['student', 'exercise'],
      measures: EXERCISE_MEASURES,
      filters: [{ field: 'course', op: 'eq', value: courseId }, ...studentFilter],
      sort: [],
      limit,
      page: 1,
      range: 'all'
    };
  }

  #attemptedSpec(courseId: string): InsightsSpec {
    return {
      source: 'assessment_result',
      dimensions: ['exercise'],
      measures: [{ metric: 'is_attempted', agg: 'count_if' }],
      filters: [{ field: 'course', op: 'eq', value: courseId }],
      sort: [],
      limit: INSIGHTS_LIMITS.maxRows,
      page: 1,
      range: 'all'
    };
  }

  /**
   * The exercise side of the export. The server narrows it to the exported students and attempted cells, then pages
   * it in chunks; the client only receives the cells it will render.
   */
  #exportExerciseSpec(courseId: string): InsightsExportSpec {
    return {
      source: 'assessment_result',
      dimensions: ['student', 'exercise'],
      measures: EXERCISE_MEASURES,
      filters: [{ field: 'course', op: 'eq', value: courseId }],
      sort: [],
      limit: INSIGHTS_LIMITS.maxExportRows,
      page: 1,
      range: 'all'
    };
  }

  async #query(spec: InsightsSpec, refresh = false): Promise<InsightsResult | null> {
    const scope = insightsApi.scope;
    if (!scope) return null;

    const response = await this.execute<InsightsQueryRequest>({
      requestFn: () => classroomio.insights.query.$post({ json: { scope, spec, refresh } }),
      logContext: 'loading insights students'
    });

    return response?.data ?? null;
  }

  async #loadCells(rows: InsightsRow[], seq: number, refresh: boolean, quiet: boolean) {
    const courseId = insightsApi.selection.courseId;
    const studentIds = rows.flatMap((row) => (typeof row['student_id'] === 'string' ? [row['student_id']] : []));
    if (!courseId || studentIds.length === 0) return;

    const structure = insightsApi.dashboard?.structures[courseId];
    const exerciseCount = Math.max(1, structure?.items.filter((item) => item.type === 'EXERCISE').length ?? 0);
    const chunkSize = Math.max(
      1,
      Math.min(INSIGHTS_LIMITS.maxFilterValues, Math.floor(INSIGHTS_LIMITS.maxRows / exerciseCount))
    );
    const chunks = chunkIds(studentIds, chunkSize);
    const results = await Promise.all(
      chunks.map((ids) => this.#query(this.#exerciseSpec(ids, courseId, ids.length * exerciseCount), refresh))
    );
    if (seq !== this.#seq) return;

    if (results.some((result) => !result)) {
      if (!quiet) this.cellsFailed = true;

      return;
    }

    const pivots = results.flatMap((result) => (result ? [pivotStudentExercises(result)] : []));
    this.cells = Object.assign({}, ...pivots);
    this.cellsFailed = false;
  }

  /**
   * Keeps the last successful counts when the query fails: an empty map would hide locked exercises that do have
   * attempts, which reads as data loss rather than a failed request.
   */
  async #loadAttempted(seq: number, refresh: boolean) {
    const courseId = insightsApi.selection.courseId;
    if (courseId !== this.#attemptedCourseId) {
      this.attemptedResult = null;
      this.#attemptedCourseId = courseId;
    }

    if (!courseId) {
      this.attemptedFailed = false;
      return;
    }

    const result = await this.#query(this.#attemptedSpec(courseId), refresh);
    if (seq !== this.#seq) return;

    if (!result) {
      this.attemptedFailed = true;
      return;
    }

    this.attemptedResult = result;
    this.attemptedFailed = false;
  }

  async load() {
    this.page = 1;

    await this.#loadPage();
  }

  async goToPage(page: number) {
    if (page === this.page || page < 1 || page > this.pageCount) return;

    this.page = page;

    await this.#loadPage();
  }

  refreshVisible(options: { refresh?: boolean } = {}) {
    return this.#loadPage({ quiet: true, refresh: options.refresh });
  }

  /** Reloads the current page with a visible spinner and failure state, after a failed request. */
  retry() {
    return this.#loadPage();
  }

  async #loadPage(options: { quiet?: boolean; refresh?: boolean } = {}) {
    this.#seq += 1;
    const seq = this.#seq;
    if (!options.quiet) {
      this.loadingPage = true;
      this.failed = false;
      this.cellsFailed = false;
    }

    const result = await this.#query(this.#studentSpec(this.page, INSIGHTS_LIMITS.studentsPageSize), options.refresh);
    if (seq !== this.#seq) return;

    this.loadingPage = false;
    this.hasLoaded = true;

    if (!result) {
      if (options.quiet && options.refresh) {
        snackbar.error('snackbar.insights.students_refresh_failed');
      } else if (!options.quiet) {
        this.failed = true;
      }

      return;
    }

    this.total = result.total;
    if (this.page > this.pageCount || (result.rows.length === 0 && this.page > 1)) {
      this.page = pageAfterEmptyResult(this.page, result.total, INSIGHTS_LIMITS.studentsPageSize);
      await this.#loadPage(options);
      return;
    }

    this.rows = result.rows;
    if (!options.quiet) this.cells = {};

    await Promise.all([
      this.#loadCells(result.rows, seq, Boolean(options.refresh), Boolean(options.quiet)),
      this.#loadAttempted(seq, Boolean(options.refresh))
    ]);
  }

  setSearch(search: string) {
    this.search = search;

    return this.load();
  }

  setSort(key: string) {
    this.sort = nextSort(this.sort, key);
    this.page = 1;

    return this.load();
  }

  setFilter(key: keyof StudentFilters, value: string) {
    if (!isStudentFilterValue(key, value)) return;

    Object.assign(this.filters, { [key]: value });

    return this.load();
  }

  clearFilters() {
    this.filters.status = '';
    this.filters.activity = '';
    this.filters.score = '';
    this.filters.flag = '';

    return this.load();
  }

  reset() {
    this.#seq += 1;
    this.rows = [];
    this.total = 0;
    this.cells = {};
    this.attemptedResult = null;
    this.search = '';
    this.sort = null;
    this.page = 1;
    this.hasLoaded = false;
    this.failed = false;
    this.cellsFailed = false;
    this.attemptedFailed = false;
    this.#attemptedCourseId = null;
    this.filters.status = '';
    this.filters.activity = '';
    this.filters.score = '';
    this.filters.flag = '';
  }

  async #exportStudents(request: {
    studentSpec: InsightsExportSpec;
    exerciseSpec?: InsightsExportSpec;
  }): Promise<InsightsStudentExportResult | null> {
    const scope = insightsApi.scope;
    if (!scope) return null;

    const response = await this.execute<InsightsStudentExportRequest>({
      requestFn: () => classroomio.insights.export.students.$post({ json: { scope, ...request } }),
      logContext: 'exporting insights students'
    });

    return response?.data ?? null;
  }

  async buildExportDocument(params: {
    filename: string;
    title: string;
    subtitle?: string;
    headers: StudentExportHeaders;
    attemptedByExercise: ReadonlyMap<string, number>;
  }): Promise<ExportDocument<{ row: InsightsRow; cells: Record<string, StudentExerciseCell> }>> {
    const courseId = insightsApi.selection.courseId;
    const studentSpec = this.#studentSpec(1, INSIGHTS_LIMITS.maxExportRows, courseId);
    const exerciseSpec = courseId ? this.#exportExerciseSpec(courseId) : undefined;
    const exportResult = await this.#exportStudents({ studentSpec, exerciseSpec });
    const cells = exportResult?.cells ?? {};
    const structure = courseId ? insightsApi.dashboard?.structures[courseId] : undefined;
    const exercises = courseId ? visibleExerciseColumns(structure, params.attemptedByExercise) : [];
    const rows = (exportResult?.students.rows ?? []).map((row) => {
      const studentCells = cells[String(row['student_id'])] ?? {};

      return { row, cells: studentCells };
    });
    const notes: string[] = [];
    if (exportResult?.studentsTruncated) {
      notes.push(t.get('insights.export.students_capped', { limit: INSIGHTS_LIMITS.maxExportRows }));
    }

    if (exportResult?.exercisesTruncated) {
      notes.push(t.get('insights.export.exercises_capped', { limit: INSIGHTS_LIMITS.maxExportExerciseCells }));
    }

    const subtitle = [params.subtitle, ...notes].filter(Boolean).join(' · ') || undefined;
    const courseSelected = Boolean(courseId);

    return buildStudentsExportDocument({
      filename: params.filename,
      title: params.title,
      subtitle,
      headers: params.headers,
      rows,
      exercises,
      courseSelected
    });
  }
}

export const insightsStudentsApi = new InsightsStudentsApi();
