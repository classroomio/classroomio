import { INSIGHTS_PLACEHOLDERS, INSIGHTS_THRESHOLDS, type TInsightsStatus } from '@cio/utils/constants/insights';

import type {
  DonutSegment,
  HbarItem,
  InsightsCell,
  InsightsChartPoint,
  InsightsCourseStructure,
  InsightsDashboard,
  InsightsFilter,
  InsightsKpiDisplay,
  InsightsResult,
  InsightsRow,
  InsightsScopeCourse,
  InsightsSelection,
  InsightsSpec,
  InsightsStructureItem,
  InsightsTone,
  InsightsWidget,
  LearnerExerciseCell,
  LearnerFilters,
  LearnerSort
} from './types';

type Translate = (key: string, vars?: Record<string, string | number>) => string;

export const SELF_LOADING_WIDGET_IDS: ReadonlySet<string> = new Set(['learners']);

export const LEARNER_DETAIL_ELEMENT_ID = 'insights-learner-detail';

export const WIDGET_SPAN_CLASS: Record<number, string> = {
  4: 'lg:col-span-4',
  5: 'lg:col-span-5',
  6: 'lg:col-span-6',
  7: 'lg:col-span-7',
  8: 'lg:col-span-8',
  9: 'lg:col-span-9',
  10: 'lg:col-span-10',
  11: 'lg:col-span-11',
  12: 'lg:col-span-12'
};

const GRID_COLUMNS = 12;

/**
 * Each widget's span once packed in order on the 12-column grid: the last widget of a row that is not full widens
 * to fill it, so hidden widgets never leave a hole.
 */
export function fillRowSpans(widgets: readonly InsightsWidget[]): Map<string, number> {
  const spans = new Map<string, number>();
  let rowWidgetId: string | null = null;
  let rowWidth = 0;

  const closeRow = () => {
    if (rowWidgetId === null) return;

    spans.set(rowWidgetId, (spans.get(rowWidgetId) ?? 0) + GRID_COLUMNS - rowWidth);
    rowWidgetId = null;
    rowWidth = 0;
  };

  for (const widget of widgets) {
    if (rowWidth + widget.span > GRID_COLUMNS) closeRow();

    spans.set(widget.id, widget.span);
    rowWidgetId = widget.id;
    rowWidth += widget.span;
  }
  closeRow();

  return spans;
}

export const INSIGHTS_COLORS = {
  primary: 'var(--primary)',
  success: 'var(--success)',
  danger: 'var(--destructive)',
  warning: 'oklch(0.769 0.188 70.08)',
  muted: 'var(--chart-1)'
} as const;

export const SERIES_COLORS = [
  INSIGHTS_COLORS.primary,
  INSIGHTS_COLORS.success,
  INSIGHTS_COLORS.warning,
  INSIGHTS_COLORS.muted,
  INSIGHTS_COLORS.danger
] as const;

export const STATUS_COLORS: Record<TInsightsStatus, string> = {
  at_risk: INSIGHTS_COLORS.danger,
  lagging: INSIGHTS_COLORS.warning,
  on_track: INSIGHTS_COLORS.success,
  completed: INSIGHTS_COLORS.primary
};

const PLACEHOLDER_BY_KEY = {
  course: INSIGHTS_PLACEHOLDERS.course,
  learner: INSIGHTS_PLACEHOLDERS.learner,
  exercise: INSIGHTS_PLACEHOLDERS.exercise
} as const;

type PlaceholderKey = keyof typeof PLACEHOLDER_BY_KEY;

const SELECTION_BY_PLACEHOLDER: Record<PlaceholderKey, keyof InsightsSelection> = {
  course: 'courseId',
  learner: 'learnerId',
  exercise: 'exerciseId'
};

export function widgetUsesPlaceholder(widget: InsightsWidget, key: PlaceholderKey): boolean {
  return (widget.spec.filters ?? []).some((filter) => filter.value === PLACEHOLDER_BY_KEY[key]);
}

function fillPlaceholder(filter: InsightsFilter, selection: InsightsSelection): InsightsFilter | null {
  const placeholder = (Object.keys(PLACEHOLDER_BY_KEY) as PlaceholderKey[]).find(
    (key) => filter.value === PLACEHOLDER_BY_KEY[key]
  );
  if (!placeholder) return filter;

  const value = selection[SELECTION_BY_PLACEHOLDER[placeholder]];
  if (!value) return null;

  return { ...filter, value };
}

export function resolveWidgetSpec(widget: InsightsWidget, selection: InsightsSelection): InsightsSpec | null {
  const filters: InsightsFilter[] = [];

  for (const filter of widget.spec.filters ?? []) {
    const filled = fillPlaceholder(filter, selection);
    if (!filled) return null;

    filters.push(filled);
  }

  const hasCourseFilter = filters.some((filter) => filter.field === 'course');
  if (widget.courseMode === 'any' && selection.courseId && !hasCourseFilter) {
    filters.push({ field: 'course', op: 'eq', value: selection.courseId });
  }

  return { ...widget.spec, filters };
}

export function focusCourse(dashboard: InsightsDashboard, selection: InsightsSelection): InsightsScopeCourse | null {
  if (dashboard.scope.type === 'course') return dashboard.scope.courses[0] ?? null;

  return dashboard.scope.courses.find((course) => course.id === selection.courseId) ?? null;
}

export function isWidgetVisible(
  widget: InsightsWidget,
  dashboard: InsightsDashboard,
  selection: InsightsSelection
): boolean {
  if (widget.courseMode === 'all' && selection.courseId) return false;

  if (widget.courseMode === 'single' && !selection.courseId) return false;

  const course = focusCourse(dashboard, selection);
  if (widget.requires.includes('grouping') && !course?.isGrouped) return false;

  if (widget.requires.includes('pass_required') && !course?.hasPassRequired) return false;

  return true;
}

export function defaultCourseId(dashboard: InsightsDashboard): string | null {
  if (dashboard.scope.type === 'org') return null;

  return dashboard.scope.courses.length === 1 ? (dashboard.scope.courses[0]?.id ?? null) : null;
}

export function defaultExerciseId(structure: InsightsCourseStructure | undefined): string | null {
  const exercises = (structure?.items ?? []).filter((item) => item.type === 'EXERCISE');
  const lastPassRequired = exercises.findLast((item) => item.isPassRequired);

  return lastPassRequired?.id ?? exercises.at(-1)?.id ?? null;
}

export function visibleExerciseColumns(
  structure: InsightsCourseStructure | undefined,
  attemptedByExercise: ReadonlyMap<string, number>
): InsightsStructureItem[] {
  return (structure?.items ?? []).filter(
    (item) =>
      item.type === 'EXERCISE' && (!item.isLocked || item.isPassRequired || (attemptedByExercise.get(item.id) ?? 0) > 0)
  );
}

export function attemptedByExercise(result: InsightsResult | null): Map<string, number> {
  const attempted = new Map<string, number>();

  for (const row of result?.rows ?? []) {
    const exerciseId = textCell(row, 'exercise_id');
    if (!exerciseId) continue;

    attempted.set(exerciseId, numberCell(row, 'is_attempted__count_if') ?? 0);
  }

  return attempted;
}

export function numberCell(row: InsightsRow | undefined, key: string): number | null {
  const value = row?.[key];

  return typeof value === 'number' ? value : null;
}

export function textCell(row: InsightsRow | undefined, key: string): string | null {
  const value = row?.[key];

  return typeof value === 'string' ? value : null;
}

export function formatPercent(value: InsightsCell | undefined): string {
  return typeof value === 'number' ? `${Math.round(value)}%` : '–';
}

export function formatCount(value: InsightsCell | undefined): string {
  return typeof value === 'number' ? Math.round(value).toLocaleString() : '–';
}

export function percentOf(part: number | null, whole: number | null): number | null {
  if (part === null || !whole) return null;

  return (part / whole) * 100;
}

export function scoreTone(scorePct: number | null): InsightsTone {
  if (scorePct === null) return 'muted';

  if (scorePct >= 90) return 'success';

  if (scorePct >= 80) return 'info';

  if (scorePct >= 70) return 'warning';

  return 'danger';
}

export function passTone(scorePct: number | null, passMark: number | null): InsightsTone {
  if (scorePct === null || passMark === null) return scoreTone(scorePct);

  return scorePct >= passMark ? 'success' : 'danger';
}

export const TONE_CELL_CLASS: Record<InsightsTone, string> = {
  success: 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400',
  info: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
  warning: 'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400',
  danger: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400',
  muted: 'bg-transparent ui:text-muted-foreground'
};

export const STATUS_BADGE_VARIANT: Record<TInsightsStatus, 'destructive' | 'warning' | 'success' | 'default'> = {
  at_risk: 'destructive',
  lagging: 'warning',
  on_track: 'success',
  completed: 'default'
};

export function isInsightsStatus(value: InsightsCell | undefined): value is TInsightsStatus {
  return value === 'at_risk' || value === 'lagging' || value === 'on_track' || value === 'completed';
}

export type CohortHealth = TInsightsStatus;

export function cohortHealth(row: InsightsRow): CohortHealth {
  const learners = numberCell(row, 'rows__count') ?? 0;
  const completed = numberCell(row, 'is_completed_all__count_if') ?? 0;
  const atRisk = numberCell(row, 'is_at_risk__count_if') ?? 0;
  const averageScore = numberCell(row, 'avg_score_pct__avg');

  if (learners > 0 && completed / learners >= 0.95) return 'completed';

  if (learners > 0 && atRisk / learners >= 0.2) return 'at_risk';

  if (averageScore !== null && averageScore < INSIGHTS_THRESHOLDS.laggingScorePct) return 'lagging';

  return 'on_track';
}

export function toHealthSegments(result: InsightsResult, translate: Translate): DonutSegment[] {
  const learnersByHealth = new Map<CohortHealth, number>();

  for (const row of result.rows) {
    const health = cohortHealth(row);
    const learners = numberCell(row, 'rows__count') ?? 0;
    learnersByHealth.set(health, (learnersByHealth.get(health) ?? 0) + learners);
  }

  return [...learnersByHealth.entries()].map(([health, value]) => {
    const label = translate(`insights.status.${health}`);

    return { key: health, label, value, color: STATUS_COLORS[health] };
  });
}

export function formatUpdatedAgo(generatedAt: string | null, now: number, translate: Translate): string {
  if (!generatedAt) return '';

  const seconds = Math.max(0, Math.round((now - Date.parse(generatedAt)) / 1000));
  if (seconds < 60) return translate('insights.updated_seconds_ago', { count: seconds });

  return translate('insights.updated_minutes_ago', { count: Math.floor(seconds / 60) });
}

export function oldestGeneratedAt(results: ReadonlyArray<InsightsResult | null>): string | null {
  const timestamps = results.flatMap((result) => (result ? [result.generatedAt] : []));
  if (timestamps.length === 0) return null;

  return timestamps.reduce((oldest, timestamp) => (Date.parse(timestamp) < Date.parse(oldest) ? timestamp : oldest));
}

const BUCKET_TRANSLATION_PREFIX: Record<string, string> = {
  progress_bucket_25: 'insights.buckets.progress',
  score_bucket_10: 'insights.buckets.score'
};

export function dimensionLabel(row: InsightsRow, dimension: string, translate: Translate): string {
  const id = row[`${dimension}_id`];
  const label = textCell(row, `${dimension}_label`);
  const bucketPrefix = BUCKET_TRANSLATION_PREFIX[dimension];

  if (bucketPrefix) return translate(`${bucketPrefix}.${id}`);

  if (dimension === 'status') return translate(`insights.status.${id}`);

  if (dimension === 'day' || dimension === 'week') {
    return typeof id === 'string'
      ? new Date(`${id}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      : '';
  }

  if (id === null && dimension === 'section') return translate('insights.not_in_section');

  if (id === null && dimension === 'cohort') return translate('insights.no_cohort');

  return label ?? String(id ?? '');
}

export function toChartPoints(result: InsightsResult, dimension: string, translate: Translate): InsightsChartPoint[] {
  const measureKeys = result.columns.filter((column) => column.role === 'measure').map((column) => column.key);

  return result.rows.map((row, index) => {
    const values = Object.fromEntries(measureKeys.map((key) => [key, numberCell(row, key)]));
    const label = dimensionLabel(row, dimension, translate);

    return {
      ...values,
      key: String(row[`${dimension}_id`] ?? `none-${index}`),
      label,
      rank: numberCell(row, `${dimension}_rank`) ?? index
    };
  });
}

function createChartPoint(
  row: InsightsRow,
  dimension: string,
  key: string,
  index: number,
  translate: Translate
): InsightsChartPoint {
  const label = dimensionLabel(row, dimension, translate);
  const rank = numberCell(row, `${dimension}_rank`) ?? index;

  return { key, label, rank };
}

export function toSeriesPoints(
  result: InsightsResult,
  xDimension: string,
  seriesDimension: string,
  measureKey: string,
  translate: Translate
): { points: InsightsChartPoint[]; seriesKeys: Array<{ key: string; label: string }> } {
  const pointsByKey = new Map<string, InsightsChartPoint>();
  const seriesByKey = new Map<string, string>();

  result.rows.forEach((row, index) => {
    const xKey = String(row[`${xDimension}_id`] ?? `none-${index}`);
    const seriesKey = String(row[`${seriesDimension}_id`] ?? 'none');
    const point = pointsByKey.get(xKey) ?? createChartPoint(row, xDimension, xKey, index, translate);

    point[seriesKey] = numberCell(row, measureKey);
    pointsByKey.set(xKey, point);
    seriesByKey.set(seriesKey, dimensionLabel(row, seriesDimension, translate));
  });

  const points = [...pointsByKey.values()].sort((left, right) => left.rank - right.rank);
  const seriesKeys = [...seriesByKey.entries()].map(([key, label]) => ({ key, label }));

  return { points, seriesKeys };
}

export function toDonutSegments(result: InsightsResult, dimension: string, translate: Translate): DonutSegment[] {
  const measureKey = result.columns.find((column) => column.role === 'measure')?.key ?? '';

  return result.rows.map((row, index) => {
    const id = row[`${dimension}_id`];
    const color = isInsightsStatus(id) ? STATUS_COLORS[id] : SERIES_COLORS[index % SERIES_COLORS.length];
    const label = dimensionLabel(row, dimension, translate);
    const value = numberCell(row, measureKey) ?? 0;

    return { key: String(id ?? index), label, value, color };
  });
}

export function toHbarItems(result: InsightsResult, dimension: string | null, translate: Translate): HbarItem[] {
  const measures = result.columns.filter((column) => column.role === 'measure');
  const firstMeasure = measures[0];
  if (!firstMeasure) return [];

  const isPercent = firstMeasure.valueType === 'percent';
  const format = isPercent ? formatPercent : formatCount;

  if (!dimension) {
    const row = result.rows[0];

    return measures.map((measure) => {
      const value = numberCell(row, measure.key);
      const label = translate(`insights.measures.${measure.key}`);

      return { key: measure.key, label, value, display: format(value), tone: 'danger' };
    });
  }

  return toChartPoints(result, dimension, translate).map((point) => {
    const raw = point[firstMeasure.key];
    const value = typeof raw === 'number' ? raw : null;

    return { key: point.key, label: point.label, value, display: format(value) };
  });
}

export function hbarMax(items: HbarItem[], isPercent: boolean): number {
  if (isPercent) return 100;

  return Math.max(1, ...items.map((item) => item.value ?? 0));
}

export const LEARNER_FILTER_OPTIONS: { [Key in keyof LearnerFilters]: ReadonlyArray<LearnerFilters[Key]> } = {
  status: ['', 'at_risk', 'lagging', 'on_track', 'completed'],
  activity: ['', 'today', 'idle'],
  score: ['', 'lt50', 'mid', 'gte70'],
  flag: ['', 'overdue', 'certified', 'not_certified']
};

export const LEARNER_SORTS: readonly LearnerSort[] = ['status', 'progress', 'name', 'low_score'];

export function isLearnerFilterValue(key: keyof LearnerFilters, value: string): boolean {
  return (LEARNER_FILTER_OPTIONS[key] as readonly string[]).includes(value);
}

export function isLearnerSort(value: string): value is LearnerSort {
  return (LEARNER_SORTS as readonly string[]).includes(value);
}

const LEARNER_SORT_SPEC: Record<LearnerSort, InsightsSpec['sort']> = {
  status: [
    { field: 'status_rank__value', dir: 'asc' },
    { field: 'avg_score_pct__value', dir: 'asc' }
  ],
  progress: [{ field: 'overall_progress_pct__value', dir: 'asc' }],
  name: [{ field: 'learner', dir: 'asc' }],
  low_score: [{ field: 'avg_score_pct__value', dir: 'asc' }]
};

export function learnerQueryParts(
  filters: LearnerFilters,
  sort: LearnerSort
): { filters: InsightsFilter[]; sort: InsightsSpec['sort'] } {
  const specFilters: InsightsFilter[] = [];

  if (filters.status) specFilters.push({ field: 'status', op: 'eq', value: filters.status });

  if (filters.activity === 'today') specFilters.push({ field: 'logged_in_today', op: 'is_true' });

  if (filters.activity === 'idle') specFilters.push({ field: 'is_inactive', op: 'is_true' });

  if (filters.score === 'lt50') specFilters.push({ field: 'avg_score_pct', op: 'lt', value: 50 });

  if (filters.score === 'mid') {
    specFilters.push({ field: 'avg_score_pct', op: 'gte', value: 50 }, { field: 'avg_score_pct', op: 'lt', value: 70 });
  }

  if (filters.score === 'gte70') specFilters.push({ field: 'avg_score_pct', op: 'gte', value: 70 });

  if (filters.flag === 'overdue') specFilters.push({ field: 'is_overdue', op: 'is_true' });

  if (filters.flag === 'certified') specFilters.push({ field: 'has_certificate', op: 'is_true' });

  if (filters.flag === 'not_certified') specFilters.push({ field: 'has_certificate', op: 'is_false' });

  return { filters: specFilters, sort: LEARNER_SORT_SPEC[sort] };
}

export function countActiveLearnerFilters(filters: LearnerFilters): number {
  return Object.values(filters).filter(Boolean).length;
}

function isExerciseState(value: InsightsCell | undefined): value is LearnerExerciseCell['state'] {
  return value === 'not_taken' || value === 'awaiting_grade' || value === 'graded';
}

export function pivotLearnerExercises(result: InsightsResult): Record<string, Record<string, LearnerExerciseCell>> {
  const cells: Record<string, Record<string, LearnerExerciseCell>> = {};

  for (const row of result.rows) {
    const learnerId = textCell(row, 'learner_id');
    const exerciseId = textCell(row, 'exercise_id');
    if (!learnerId || !exerciseId) continue;

    const state = row['state__value'];
    const passed = row['passed__value'];

    cells[learnerId] ??= {};
    cells[learnerId][exerciseId] = {
      scorePct: numberCell(row, 'best_score_pct__value'),
      state: isExerciseState(state) ? state : 'not_taken',
      passed: typeof passed === 'boolean' ? passed : null
    };
  }

  return cells;
}

const KPI_FORMATTERS: Record<string, (row: InsightsRow | undefined, translate: Translate) => InsightsKpiDisplay> = {
  kpi_logged_in_today: (row, translate) => {
    const active = numberCell(row, 'logged_in_today__count_if');
    const total = numberCell(row, 'rows__count');
    const value = `${formatCount(active)} / ${formatCount(total)}`;
    const percent = formatPercent(percentOf(active, total));
    const description = translate('insights.kpi.share_of_learners', { percent });

    return { value, description };
  },
  kpi_logged_in_week: (row, translate) => {
    const active = numberCell(row, 'logged_in_week__count_if');
    const total = numberCell(row, 'rows__count');
    const percent = formatPercent(percentOf(active, total));
    const description = translate('insights.kpi.share_of_learners', { percent });

    return { value: formatCount(active), description };
  },
  kpi_avg_progress: (row, translate) => ({
    value: formatPercent(row?.['overall_progress_pct__avg']),
    description: translate('insights.kpi.avg_progress_hint')
  }),
  kpi_avg_score: (row, translate) => ({
    value: formatPercent(row?.['avg_score_pct__avg']),
    description: translate('insights.kpi.avg_score_hint')
  }),
  kpi_overdue: (row, translate) => ({
    value: formatCount(row?.['is_overdue__count_if']),
    description: translate('insights.kpi.overdue_hint')
  }),
  kpi_completed: (row, translate) => ({
    value: formatCount(row?.['is_completed_all__count_if']),
    description: translate('insights.kpi.certified', { count: numberCell(row, 'certificates__sum') ?? 0 })
  }),
  kpi_enrolled: (row) => ({ value: formatCount(row?.['rows__count']) }),
  kpi_completion_rate: (row) => ({ value: formatPercent(row?.['is_completed__rate']) }),
  kpi_required_pass_rate: (row, translate) => ({
    value: formatPercent(row?.['required_pass__pooled']),
    description: translate('insights.kpi.required_pass_hint')
  }),
  kpi_median_days: (row, translate) => {
    const days = numberCell(row, 'days_to_finish__median');

    return { value: days === null ? '–' : translate('insights.kpi.days', { count: Math.round(days) }) };
  },
  kpi_completions: (row, translate) => ({
    value: formatCount(row?.['is_completed__count_if']),
    description: translate('insights.kpi.certified', { count: numberCell(row, 'is_certified__count_if') ?? 0 })
  }),
  kpi_needs_attention: (row, translate) => ({
    value: formatCount(row?.['is_at_risk__count_if']),
    description: translate('insights.kpi.needs_attention_hint')
  })
};

export function formatKpi(
  widget: InsightsWidget,
  result: InsightsResult | null,
  translate: Translate
): InsightsKpiDisplay {
  const formatter = KPI_FORMATTERS[widget.id];
  const row = result?.rows[0];
  if (formatter) return formatter(row, translate);

  const firstMeasure = widget.spec.measures[0];
  const value = formatCount(row?.[`${firstMeasure?.metric}__${firstMeasure?.agg}`]);

  return { value };
}
