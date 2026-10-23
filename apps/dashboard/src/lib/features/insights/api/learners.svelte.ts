import { INSIGHTS_LIMITS } from '@cio/utils/constants/insights';
import type { ExportDocument } from '@cio/utils/export';
import { BaseApi, classroomio } from '$lib/utils/services/api';

import { buildLearnersExportDocument } from '../utils/insights-export';
import {
  isLearnerFilterValue,
  isLearnerSort,
  learnerQueryParts,
  pivotLearnerExercises,
  visibleExerciseColumns
} from '../utils/insights-utils';
import type {
  InsightsExportRequest,
  InsightsExportSpec,
  InsightsQueryRequest,
  InsightsResult,
  InsightsRow,
  InsightsSpec,
  LearnerExerciseCell,
  LearnerExportHeaders,
  LearnerFilters,
  LearnerSort
} from '../utils/types';
import { insightsApi } from './insights.svelte';

const LEARNER_MEASURES: InsightsSpec['measures'] = [
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
  { metric: 'status_rank', agg: 'value' }
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

class InsightsLearnersApi extends BaseApi {
  rows = $state<InsightsRow[]>([]);
  total = $state(0);
  cells = $state<Record<string, Record<string, LearnerExerciseCell>>>({});
  filters = $state<LearnerFilters>({ status: '', activity: '', score: '', flag: '' });
  sort = $state<LearnerSort>('status');
  search = $state('');
  hasLoaded = $state(false);
  loadingPage = $state(false);
  loadingMore = $state(false);
  failed = $state(false);

  #seq = 0;

  get hasMore(): boolean {
    return this.rows.length < this.total;
  }

  #learnerSpec(page: number, limit: number): InsightsSpec {
    const parts = learnerQueryParts(this.filters, this.sort);
    const courseId = insightsApi.selection.courseId;
    const courseFilter = courseId ? [{ field: 'course' as const, op: 'eq' as const, value: courseId }] : [];

    return {
      source: 'learner',
      dimensions: ['learner'],
      measures: LEARNER_MEASURES,
      filters: [...parts.filters, ...courseFilter],
      sort: parts.sort,
      search: this.search || undefined,
      limit,
      page
    };
  }

  #exerciseSpec(learnerIds: string[] | null, courseId: string, limit: number): InsightsSpec {
    const learnerFilter = learnerIds ? [{ field: 'learner' as const, op: 'in' as const, value: learnerIds }] : [];

    return {
      source: 'assessment_result',
      dimensions: ['learner', 'exercise'],
      measures: EXERCISE_MEASURES,
      filters: [{ field: 'course', op: 'eq', value: courseId }, ...learnerFilter],
      sort: [],
      limit,
      page: 1
    };
  }

  async #query(spec: InsightsSpec): Promise<InsightsResult | null> {
    const scope = insightsApi.scope;
    if (!scope) return null;

    const response = await this.execute<InsightsQueryRequest>({
      requestFn: () => classroomio.insights.query.$post({ json: { scope, spec } }),
      logContext: 'loading insights learners'
    });

    return response?.data ?? null;
  }

  async #loadCells(rows: InsightsRow[], seq: number) {
    const courseId = insightsApi.selection.courseId;
    const learnerIds = rows.flatMap((row) => (typeof row['learner_id'] === 'string' ? [row['learner_id']] : []));
    if (!courseId || learnerIds.length === 0) return;

    const structure = insightsApi.dashboard?.structures[courseId];
    const exerciseCount = Math.max(1, structure?.items.filter((item) => item.type === 'EXERCISE').length ?? 0);
    const chunkSize = Math.max(
      1,
      Math.min(INSIGHTS_LIMITS.maxFilterValues, Math.floor(INSIGHTS_LIMITS.maxRows / exerciseCount))
    );
    const chunks = chunkIds(learnerIds, chunkSize);
    const results = await Promise.all(
      chunks.map((ids) => this.#query(this.#exerciseSpec(ids, courseId, ids.length * exerciseCount)))
    );
    if (seq !== this.#seq) return;

    const pivots = results.flatMap((result) => (result ? [pivotLearnerExercises(result)] : []));
    this.cells = Object.assign({}, this.cells, ...pivots);
  }

  async load() {
    this.#seq += 1;
    const seq = this.#seq;
    this.loadingPage = true;
    this.failed = false;

    const result = await this.#query(this.#learnerSpec(1, INSIGHTS_LIMITS.pageSize));
    if (seq !== this.#seq) return;

    this.loadingPage = false;
    this.hasLoaded = true;

    if (!result) {
      this.failed = true;
      return;
    }

    this.rows = result.rows;
    this.total = result.total;
    this.cells = {};
    await this.#loadCells(result.rows, seq);
  }

  async loadMore() {
    if (this.loadingMore || !this.hasMore) return;

    const seq = this.#seq;
    this.loadingMore = true;

    const nextPage = Math.floor(this.rows.length / INSIGHTS_LIMITS.pageSize) + 1;
    const result = await this.#query(this.#learnerSpec(nextPage, INSIGHTS_LIMITS.pageSize));
    this.loadingMore = false;
    if (!result || seq !== this.#seq) return;

    this.rows = [...this.rows, ...result.rows];
    this.total = result.total;
    await this.#loadCells(result.rows, seq);
  }

  async refreshVisible() {
    const seq = this.#seq;
    const limit = Math.min(INSIGHTS_LIMITS.maxRows, Math.max(INSIGHTS_LIMITS.pageSize, this.rows.length));
    const result = await this.#query(this.#learnerSpec(1, limit));
    if (!result || seq !== this.#seq) return;

    this.rows = result.rows;
    this.total = result.total;
    await this.#loadCells(result.rows, seq);
  }

  setSearch(search: string) {
    this.search = search;

    return this.load();
  }

  setSort(sort: LearnerSort) {
    this.sort = sort;

    return this.load();
  }

  setFilter(key: keyof LearnerFilters, value: string) {
    if (!isLearnerFilterValue(key, value)) return;

    Object.assign(this.filters, { [key]: value });

    return this.load();
  }

  setSortValue(value: string) {
    if (!isLearnerSort(value)) return;

    return this.setSort(value);
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
    this.search = '';
    this.sort = 'status';
    this.hasLoaded = false;
    this.failed = false;
    this.filters.status = '';
    this.filters.activity = '';
    this.filters.score = '';
    this.filters.flag = '';
  }

  async #export(spec: InsightsExportSpec): Promise<InsightsResult | null> {
    const scope = insightsApi.scope;
    if (!scope) return null;

    const response = await this.execute<InsightsExportRequest>({
      requestFn: () => classroomio.insights.export.$post({ json: { scope, spec } }),
      logContext: 'exporting insights learners'
    });

    return response?.data ?? null;
  }

  async buildExportDocument(params: {
    filename: string;
    title: string;
    subtitle?: string;
    headers: LearnerExportHeaders;
    attemptedByExercise: ReadonlyMap<string, number>;
  }): Promise<ExportDocument<{ row: InsightsRow; cells: Record<string, LearnerExerciseCell> }>> {
    const courseId = insightsApi.selection.courseId;
    const learners = await this.#export(this.#learnerSpec(1, INSIGHTS_LIMITS.maxExportRows));
    const exerciseResult = courseId
      ? await this.#export(this.#exerciseSpec(null, courseId, INSIGHTS_LIMITS.maxExportRows))
      : null;
    const cells = exerciseResult ? pivotLearnerExercises(exerciseResult) : {};
    const structure = courseId ? insightsApi.dashboard?.structures[courseId] : undefined;
    const exercises = courseId ? visibleExerciseColumns(structure, params.attemptedByExercise) : [];
    const rows = (learners?.rows ?? []).map((row) => {
      const learnerCells = cells[String(row['learner_id'])] ?? {};

      return { row, cells: learnerCells };
    });

    return buildLearnersExportDocument({
      filename: params.filename,
      title: params.title,
      subtitle: params.subtitle,
      headers: params.headers,
      rows,
      exercises
    });
  }
}

export const insightsLearnersApi = new InsightsLearnersApi();
