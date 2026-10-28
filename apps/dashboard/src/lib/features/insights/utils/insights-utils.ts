import {
  INSIGHTS_DEFAULT_PERIOD_DAYS,
  INSIGHTS_LIMITS,
  INSIGHTS_PLACEHOLDERS,
  INSIGHTS_RANGE_DAYS,
  INSIGHTS_RANGES,
  INSIGHTS_THRESHOLDS,
  type TInsightsBreakdownGroup,
  type TInsightsRange,
  type TInsightsStatus
} from '@cio/utils/constants/insights';

import type {
  DonutSegment,
  HbarItem,
  InsightsCell,
  InsightsChartPoint,
  InsightsCohortOption,
  InsightsColumn,
  InsightsCourseStructure,
  InsightsDashboard,
  InsightsFilter,
  InsightsKpiContext,
  InsightsKpiDisplay,
  InsightsPageState,
  InsightsPillTone,
  InsightsRangeOption,
  InsightsResult,
  InsightsRow,
  InsightsScopeCourse,
  InsightsScopeRef,
  InsightsScopeSummary,
  InsightsScopeType,
  InsightsSelection,
  InsightsSpec,
  InsightsStructureItem,
  InsightsTitleVars,
  InsightsTone,
  InsightsTrend,
  InsightsWidget,
  InsightsWidgetContext,
  StudentExerciseCell,
  StudentFilters,
  StudentSort,
  ScopeEmptyAction,
  ScopeEmptyState,
  SelectedStudent,
  TableSort,
  WidgetEmptyState
} from './types';

type Translate = (key: string, vars?: Record<string, string | number>) => string;

export const SELF_LOADING_WIDGET_IDS: ReadonlySet<string> = new Set(['students']);

export const NO_COHORT_SERIES_KEY = 'none';

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
  muted: 'var(--chart-1)',
  purple: 'oklch(0.58 0.2 305)',
  teal: 'oklch(0.65 0.12 190)',
  pink: 'oklch(0.62 0.2 350)',
  orange: 'oklch(0.68 0.19 45)',
  indigo: 'oklch(0.55 0.22 275)',
  slate: 'oklch(0.55 0.03 250)',
  band: 'color-mix(in srgb, var(--primary) 25%, transparent)',
  neutral: 'var(--muted-foreground)'
} as const;

export const SERIES_COLORS = [
  INSIGHTS_COLORS.primary,
  INSIGHTS_COLORS.success,
  INSIGHTS_COLORS.warning,
  INSIGHTS_COLORS.purple,
  INSIGHTS_COLORS.teal,
  INSIGHTS_COLORS.pink,
  INSIGHTS_COLORS.orange,
  INSIGHTS_COLORS.indigo,
  INSIGHTS_COLORS.danger
] as const;

export const STATUS_COLORS: Record<TInsightsStatus, string> = {
  at_risk: INSIGHTS_COLORS.danger,
  lagging: INSIGHTS_COLORS.warning,
  on_track: INSIGHTS_COLORS.success,
  completed: INSIGHTS_COLORS.primary
};

export function cycleColor(index: number, palette: readonly string[] = SERIES_COLORS): string {
  const cycle = Math.floor(index / palette.length);
  const baseColor = palette[index % palette.length];
  if (cycle === 0) return baseColor;

  const isLight = cycle % 2 === 1;
  const pass = Math.floor((cycle - 1) / 2);
  const mixTarget = isLight ? 'white' : 'black';
  const startWeight = isLight ? 58 : 54;
  const weight = Number((startWeight / (1 + pass * 0.35)).toFixed(2));

  return `color-mix(in oklch, ${baseColor} ${weight}%, ${mixTarget})`;
}

const PLACEHOLDER_BY_KEY = {
  course: INSIGHTS_PLACEHOLDERS.course,
  exercise: INSIGHTS_PLACEHOLDERS.exercise
} as const;

export type PlaceholderKey = keyof typeof PLACEHOLDER_BY_KEY;

const SELECTION_BY_PLACEHOLDER: Record<PlaceholderKey, 'courseId' | 'exerciseId'> = {
  course: 'courseId',
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

  const range = widget.usesRange ? selection.range : 'all';
  const pageState = widget.pageGroup ? selection.pages[widget.pageGroup] : undefined;
  if (!pageState) return { ...widget.spec, filters, range };

  const sort = pageState.sort ? [{ field: pageState.sort.key, dir: pageState.sort.dir }] : widget.spec.sort;

  return { ...widget.spec, filters, range, sort, page: pageState.page };
}

export const FIRST_PAGE: InsightsPageState = { page: 1, sort: null };

/**
 * The widget that shows the page controls for a page group: its first table, else its first widget. The group's
 * other widgets follow that page.
 */
export function pagerOwnerId(widgets: readonly InsightsWidget[], pageGroup: string): string | null {
  const members = widgets.filter((widget) => widget.pageGroup === pageGroup);
  const table = members.find((widget) => widget.viz === 'table');

  return (table ?? members[0])?.id ?? null;
}

/** The distinct page groups the given widgets page through. */
export function pageGroupsOf(widgets: readonly InsightsWidget[]): string[] {
  const groups = new Set<string>();

  for (const widget of widgets) {
    if (widget.pageGroup) groups.add(widget.pageGroup);
  }

  return [...groups];
}

/**
 * The page to fall back to when the requested page came back empty. Always steps at least one page back, so a
 * result set that shrinks between requests cannot send the caller back to the page it just emptied.
 */
export function pageAfterEmptyResult(page: number, total: number, perPage: number): number {
  const pageSize = perPage > 0 ? perPage : 1;
  const lastPage = Math.max(1, Math.ceil(total / pageSize));

  return Math.max(1, Math.min(page - 1, lastPage));
}

/**
 * True for a card that stays as of now while a range is selected. Its Now tag says so.
 */
export function isNowCard(widget: InsightsWidget, range: TInsightsRange): boolean {
  return range !== 'all' && !widget.usesRange;
}

/**
 * Whether a range fits inside a plan's history limit. A null limit means every range fits.
 */
export function isRangeWithinDays(range: TInsightsRange, maxDays: number | null): boolean {
  if (maxDays === null) return true;

  const days = INSIGHTS_RANGE_DAYS[range];

  return days !== null && days <= maxDays;
}

/**
 * Returns the widest range inside the limit, keeping a range that already fits.
 */
export function clampRangeToDays(range: TInsightsRange, maxDays: number | null): TInsightsRange {
  if (isRangeWithinDays(range, maxDays)) return range;

  const allowed = INSIGHTS_RANGES.filter((candidate) => isRangeWithinDays(candidate, maxDays));

  return allowed.at(-1) ?? '7d';
}

export function rangeOptions(translate: Translate, maxDays: number | null = null): InsightsRangeOption[] {
  return INSIGHTS_RANGES.map((range) => ({
    value: range,
    label: translate(`analytics.range.${range}`),
    locked: !isRangeWithinDays(range, maxDays)
  }));
}

export function focusCourse(dashboard: InsightsDashboard, selection: InsightsSelection): InsightsScopeCourse | null {
  if (dashboard.scope.type === 'course') return dashboard.scope.courses[0] ?? null;

  return scopeCourse(dashboard, selection.courseId);
}

export function scopeCourse(dashboard: InsightsDashboard | null, courseId: string | null): InsightsScopeCourse | null {
  return dashboard?.scope.courses.find((course) => course.id === courseId) ?? null;
}

export function focusStructure(
  dashboard: InsightsDashboard | null,
  selection: InsightsSelection
): InsightsCourseStructure | undefined {
  if (!dashboard) return undefined;

  const course = focusCourse(dashboard, selection);

  return course ? dashboard.structures[course.id] : undefined;
}

export function widgetTitleVars(
  dashboard: InsightsDashboard,
  selection: InsightsSelection,
  _translate: Translate
): InsightsTitleVars {
  const course = focusCourse(dashboard, selection);
  const structure = course ? dashboard.structures[course.id] : undefined;
  const exercise = structure?.items.find((item) => item.id === selection.exerciseId);

  return {
    course: course?.title ?? '',
    exercise: exercise?.title ?? ''
  };
}

export function availableBreakdownGroups(
  scopeType: InsightsScopeType,
  scope: Pick<InsightsScopeSummary, 'cohortCount'>
): TInsightsBreakdownGroup[] {
  if (scopeType !== 'course' && scopeType !== 'org') return [];

  const groups: TInsightsBreakdownGroup[] = ['courses'];
  if (scope.cohortCount > 0) groups.push('cohorts');

  return groups;
}

export function defaultBreakdownGroup(scope: InsightsScopeSummary): TInsightsBreakdownGroup {
  if (scope.type === 'course' && scope.cohortCount > 0) return 'cohorts';

  return 'courses';
}

export function activeBreakdownGroup(
  selection: InsightsSelection,
  available: readonly TInsightsBreakdownGroup[]
): TInsightsBreakdownGroup {
  if (available.includes(selection.breakdown)) return selection.breakdown;

  return available[0] ?? 'courses';
}

export function isWidgetVisible(
  widget: InsightsWidget,
  dashboard: InsightsDashboard,
  selection: InsightsSelection
): boolean {
  if (widget.courseMode === 'all' && selection.courseId) return false;

  if (widget.courseMode === 'single' && !selection.courseId) return false;

  const available = availableBreakdownGroups(dashboard.scope.type, dashboard.scope);
  if (widget.breakdown !== 'core' && widget.breakdown !== activeBreakdownGroup(selection, available)) return false;

  if (widget.requires.includes('cohorts') && dashboard.scope.cohortCount <= 0) return false;

  const course = focusCourse(dashboard, selection);
  if (widget.requires.includes('grouping') && !course?.isGrouped) return false;

  if (widget.requires.includes('pass_required') && !course?.hasPassRequired) return false;

  return true;
}

export function defaultCourseId(dashboard: InsightsDashboard): string | null {
  if (dashboard.scope.type !== 'course') return null;

  return dashboard.scope.courses[0]?.id ?? null;
}

export function defaultExerciseId(structure: InsightsCourseStructure | undefined): string | null {
  const exercises = (structure?.items ?? []).filter((item) => item.type === 'EXERCISE');
  const lastPassRequired = exercises.findLast((item) => item.isPassRequired);

  return lastPassRequired?.id ?? exercises.at(-1)?.id ?? null;
}

/**
 * The empty state for a dashboard whose scope has no students: what is missing, and the pages that fix it.
 */
export function scopeEmptyState(summary: InsightsScopeSummary, orgSlug: string | null): ScopeEmptyState {
  const descriptionKey =
    summary.pendingCount > 0 ? 'insights.scope_empty.pending' : `insights.scope_empty.description.${summary.type}`;
  const titleKey = `insights.scope_empty.title.${summary.type}`;

  if (summary.type === 'org') {
    const addStudents = orgSlug
      ? { href: `/org/${orgSlug}/audience`, labelKey: 'insights.scope_empty.add_students' }
      : null;

    return { titleKey, descriptionKey, actions: addStudents ? [addStudents] : [] };
  }

  const peopleHref = summary.type === 'cohort' ? `/cohorts/${summary.id}/people` : `/courses/${summary.id}/people`;
  const invite = { href: peopleHref, labelKey: 'insights.scope_empty.invite_students' };
  if (summary.type === 'cohort' && summary.courses.length === 0) {
    const addCourses = { href: `/cohorts/${summary.id}/courses`, labelKey: 'insights.scope_empty.add_courses' };

    return {
      titleKey,
      descriptionKey: 'insights.scope_empty.description.cohort_no_courses',
      actions: [addCourses, invite]
    };
  }

  return { titleKey, descriptionKey, actions: [invite] };
}

export function hasNoStudents(dashboard: InsightsDashboard | null): dashboard is InsightsDashboard {
  return dashboard !== null && dashboard.scope.studentCount === 0;
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

export function latestScore(result: InsightsResult): number | null {
  const scores = result.rows
    .map((row) => numberCell(row, 'best_score_pct__value'))
    .filter((score): score is number => score !== null);

  return scores.at(-1) ?? null;
}

export function formatCount(value: InsightsCell | undefined): string {
  return typeof value === 'number' ? Math.round(value).toLocaleString() : '–';
}

export function percentOf(part: number | null, whole: number | null): number | null {
  if (part === null || !whole) return null;

  return (part / whole) * 100;
}

export function donutTotal(segments: readonly DonutSegment[]): number {
  return segments.reduce((sum, segment) => sum + segment.value, 0);
}

/**
 * The 1-based positions of the students on screen, for "Showing 11–20 of 57".
 */
export function studentPageRange(page: number, rowCount: number): { from: number; to: number } {
  const from = (page - 1) * INSIGHTS_LIMITS.studentsPageSize + 1;

  return { from, to: from + Math.max(0, rowCount - 1) };
}

export function studentFooterLabel(
  input: {
    pageCount: number;
    total: number;
    count: number;
    from: number;
    to: number;
    scopeType: string;
  },
  translate: Translate
): string | null {
  const scope = input.scopeType === 'course' || input.scopeType === 'org' ? input.scopeType : 'cohort';
  const isFiltered = input.total < input.count;

  if (input.pageCount > 1) {
    return isFiltered
      ? translate(`insights.students.showing.${scope}`, {
          from: input.from,
          to: input.to,
          total: input.total,
          count: input.count
        })
      : translate(`insights.students.showing_paged.${scope}`, {
          from: input.from,
          to: input.to,
          count: input.count
        });
  }

  if (isFiltered) {
    return translate(`insights.students.showing_filtered.${scope}`, {
      total: input.total,
      count: input.count
    });
  }

  return null;
}

export function widgetPaginationTarget(pageGroup: string, scopeType?: InsightsScopeType): string | null {
  if (pageGroup.startsWith('cohorts')) {
    return scopeType === 'course' ? 'cohorts_course' : 'cohorts_org';
  }

  if (pageGroup.startsWith('courses')) {
    return scopeType === 'cohort' ? 'courses_cohort' : 'courses_org';
  }

  if (pageGroup.startsWith('sections')) {
    return 'sections_course';
  }

  if (pageGroup.startsWith('overdue')) {
    return 'overdue_cohort';
  }

  return null;
}

export function widgetPaginationLabel(
  input: {
    pageGroup: string;
    from: number;
    to: number;
    total: number;
    scopeType?: InsightsScopeType;
  },
  translate: Translate
): string {
  const target = widgetPaginationTarget(input.pageGroup, input.scopeType);
  if (target) {
    return translate(`insights.pagination.${target}`, {
      from: input.from,
      to: input.to,
      total: input.total
    });
  }

  return translate('insights.pagination.showing', {
    from: input.from,
    to: input.to,
    total: input.total
  });
}

/**
 * "Now at" for a student in a course: "Finished" once done, else the section (or item) they reached.
 */
export function nowAtLabel(progressPct: number | null, title: string | null, translate: Translate): string {
  if (progressPct !== null && progressPct >= 100) return translate('insights.finished');

  return title ?? '–';
}

/**
 * Green when every pass-mark exercise is passed, red while one is graded below its mark, muted otherwise.
 */
export function exercisesPassedTone(passed: number, total: number, stillToPass: number): InsightsTone {
  if (total > 0 && passed >= total) return 'success';

  return stillToPass > 0 ? 'danger' : 'muted';
}

/**
 * The prototype's heat scale: green at 70% and above, amber from 50%, red below.
 */
export function scoreTone(scorePct: number | null): InsightsTone {
  if (scorePct === null) return 'muted';

  if (scorePct >= INSIGHTS_THRESHOLDS.heatGoodPct) return 'success';

  if (scorePct >= INSIGHTS_THRESHOLDS.heatWarnPct) return 'warning';

  return 'danger';
}

export function dropoffTone(completionPct: number | null): InsightsTone {
  if (completionPct === null) return 'muted';

  if (completionPct < INSIGHTS_THRESHOLDS.dropoffBadPct) return 'danger';

  return completionPct < INSIGHTS_THRESHOLDS.dropoffWarnPct ? 'warning' : 'info';
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

export const STATUS_PILL_TONE: Record<TInsightsStatus, InsightsPillTone> = {
  on_track: 'ok',
  lagging: 'lag',
  at_risk: 'risk',
  completed: 'done'
};

export const STATUS_DISPLAY_ORDER: readonly TInsightsStatus[] = ['on_track', 'lagging', 'at_risk', 'completed'];

export function isInsightsStatus(value: InsightsCell | undefined): value is TInsightsStatus {
  return value === 'at_risk' || value === 'lagging' || value === 'on_track' || value === 'completed';
}

export type CohortHealth = TInsightsStatus;

/**
 * A cohort's health from its students: completed when nearly everyone finished, at risk when a fifth are at risk,
 * lagging when the average score is low. Null for a cohort with no students yet.
 */
export function cohortHealth(row: InsightsRow): CohortHealth | null {
  const students = numberCell(row, 'students__value') ?? 0;
  if (students === 0) return null;

  const completed = numberCell(row, 'completed_students__value') ?? 0;
  const atRisk = numberCell(row, 'at_risk_students__value') ?? 0;
  const averageScore = numberCell(row, 'avg_score_pct__value');

  if (completed / students >= 0.95) return 'completed';

  if (atRisk / students >= 0.2) return 'at_risk';

  if (averageScore !== null && averageScore < INSIGHTS_THRESHOLDS.laggingScorePct) return 'lagging';

  return 'on_track';
}

export function toHealthSegments(result: InsightsResult, translate: Translate): DonutSegment[] {
  const studentsByHealth = new Map<CohortHealth, number>();

  for (const row of result.rows) {
    const health = cohortHealth(row);
    if (!health) continue;

    const students = numberCell(row, 'students__value') ?? 0;
    studentsByHealth.set(health, (studentsByHealth.get(health) ?? 0) + students);
  }

  return STATUS_DISPLAY_ORDER.flatMap((health) => {
    const value = studentsByHealth.get(health);
    if (!value) return [];

    const label = translate(`insights.status.${health}`);

    return [{ key: health, label, value, color: STATUS_COLORS[health] }];
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

  if (dimension === 'day' || dimension === 'period') {
    return typeof id === 'string'
      ? new Date(`${id}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      : '';
  }

  if (id === null && dimension === 'section') return translate('insights.not_in_section');

  if (id === null && dimension === 'cohort') return translate('insights.legend.all_students');

  return label ?? String(id ?? '');
}

export function hasStudents(row: InsightsRow): boolean {
  return (numberCell(row, 'students__value') ?? 0) > 0;
}

/**
 * "Cohort 2 and Cohort 5", or "Cohort 2, Cohort 5, Cohort 6 and 2 more", for cohorts with no students yet.
 * Null when there are none. The empty-cohort widget names a capped page but reports the exact total, so the
 * count can describe every empty cohort while the sentence stays short.
 */
export function emptyCohortNames(
  result: InsightsResult | null,
  translate: Translate,
  options: { countFromTotal?: boolean } = {}
): { names: string; count: number } | null {
  const empty = (result?.rows ?? []).filter((row) => !hasStudents(row));
  if (empty.length === 0) return null;

  const shown = empty.slice(0, INSIGHTS_LIMITS.emptyCohortNames).map((row) => dimensionLabel(row, 'cohort', translate));
  const total = options.countFromTotal ? Math.max(result?.total ?? 0, empty.length) : empty.length;
  const more = total - shown.length;
  const names =
    more > 0 ? translate('insights.names_and_more', { names: shown.join(', '), count: more }) : shown.join(', ');

  return { names, count: total };
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
    const seriesKey = String(row[`${seriesDimension}_id`] ?? NO_COHORT_SERIES_KEY);
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
  const segments = result.rows.map((row, index) => {
    const id = row[`${dimension}_id`];
    const color = isInsightsStatus(id) ? STATUS_COLORS[id] : cycleColor(index);
    const label = dimensionLabel(row, dimension, translate);
    const value = numberCell(row, measureKey) ?? 0;

    return { key: String(id ?? index), label, value, color };
  });
  if (dimension !== 'status') return segments;

  const order = STATUS_DISPLAY_ORDER as readonly string[];

  return segments
    .filter((segment) => segment.value > 0)
    .sort((left, right) => order.indexOf(left.key) - order.indexOf(right.key));
}

export function histogramPoints(result: InsightsResult, dimension: string, translate: Translate): InsightsChartPoint[] {
  const scored = result.rows.filter((row) => row[`${dimension}_id`] !== null);

  return toChartPoints({ ...result, rows: scored }, dimension, translate);
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

/**
 * The adjacent pair of lessons with the largest fall in completion, or null when completion never falls.
 */
export function steepestDrop(items: readonly HbarItem[]): { from: string; to: string } | null {
  let steepest: { from: string; to: string; fall: number } | null = null;

  for (let index = 1; index < items.length; index += 1) {
    const previous = items[index - 1];
    const current = items[index];
    if (previous.value === null || current.value === null) continue;

    const fall = previous.value - current.value;
    if (fall > 0 && (!steepest || fall > steepest.fall)) {
      steepest = { from: previous.label, to: current.label, fall };
    }
  }

  return steepest ? { from: steepest.from, to: steepest.to } : null;
}

/**
 * Every cohort in the course, newest first, with the student and completion counts used by the chart selector.
 */
export function cohortOptionsFromResult(result: InsightsResult | null, translate: Translate): InsightsCohortOption[] {
  if (!result) return [];

  const optionsById = new Map<string, InsightsCohortOption>();
  for (const row of result.rows) {
    const id = textCell(row, 'cohort_id');
    if (!id) continue;

    const students = numberCell(row, 'students__value') ?? 0;
    const completedStudents = numberCell(row, 'completed_students__value') ?? 0;
    const createdAt = textCell(row, 'cohort_created_at__value') ?? '';

    optionsById.set(id, {
      id,
      name: dimensionLabel(row, 'cohort', translate),
      students,
      completedStudents,
      createdAt
    });
  }

  return [...optionsById.values()].sort(
    (left, right) => right.createdAt.localeCompare(left.createdAt) || left.name.localeCompare(right.name)
  );
}

/**
 * Cohort options from the chart result itself, used only while the cohort summary is still loading.
 */
export function cohortOptionsFromSeries(
  seriesKeys: ReadonlyArray<{ key: string; label: string }>
): InsightsCohortOption[] {
  return seriesKeys
    .filter((entry) => entry.key !== NO_COHORT_SERIES_KEY)
    .map((entry) => ({
      id: entry.key,
      name: entry.label,
      students: null,
      completedStudents: null,
      createdAt: ''
    }));
}

/**
 * The starting selection: the newest cohorts that have students, so the chart opens on a readable comparison.
 */
export function defaultCohortIds(cohorts: readonly InsightsCohortOption[]): string[] {
  return cohorts
    .filter((cohort) => cohort.students === null || cohort.students > 0)
    .slice(0, INSIGHTS_LIMITS.chartedCohorts)
    .map((cohort) => cohort.id);
}

/**
 * The cohorts the user picked, newest first, dashed and marked "(in progress)" while some students haven't finished.
 * Direct students always stay on as their own line, so the chart never hides them when the selection changes.
 */
export function chartedCohorts(
  seriesKeys: ReadonlyArray<{ key: string; label: string }>,
  cohorts: readonly InsightsCohortOption[],
  selectedIds: readonly string[],
  translate: Translate
): Array<{ key: string; label: string; dashed: boolean }> {
  const cohortSeries = seriesKeys.filter((entry) => entry.key !== NO_COHORT_SERIES_KEY);
  const directSeries = seriesKeys.find((entry) => entry.key === NO_COHORT_SERIES_KEY);
  const directEntry = directSeries
    ? { ...directSeries, label: translate('insights.legend.direct_students'), dashed: false }
    : null;

  if (cohortSeries.length === 0) {
    return seriesKeys.map((entry) =>
      entry.key === NO_COHORT_SERIES_KEY && directEntry ? directEntry : { ...entry, dashed: false }
    );
  }

  const seriesById = new Map(cohortSeries.map((entry) => [entry.key, entry]));
  const optionsById = new Map(cohorts.map((cohort) => [cohort.id, cohort]));
  const selected = new Set(selectedIds);
  const knownIds = cohorts.filter((cohort) => selected.has(cohort.id)).map((cohort) => cohort.id);
  const unknownIds = selectedIds.filter((id) => !optionsById.has(id) && seriesById.has(id));
  const orderedIds = [...new Set([...knownIds, ...unknownIds])];

  const charted = orderedIds.flatMap((id) => {
    const entry = seriesById.get(id);
    if (!entry) return [];

    const cohort = optionsById.get(id);
    if (cohort?.students === 0) return [];

    const isInProgress =
      cohort !== undefined &&
      cohort.students !== null &&
      cohort.completedStudents !== null &&
      cohort.completedStudents < cohort.students;
    const label = isInProgress ? translate('insights.legend.in_progress', { name: entry.label }) : entry.label;

    return [{ key: entry.key, label, dashed: isInProgress }];
  });

  return directEntry ? [...charted, directEntry] : charted;
}

export function groupScoreDisplay(
  row: InsightsRow,
  scorePct: number | null,
  countKey: string,
  translate: Translate
): string {
  const count = numberCell(row, countKey) ?? 0;
  if (count === 0) return translate('insights.no_students_yet');

  return scorePct === null ? translate('insights.no_graded_attempts') : formatPercent(scorePct);
}

const POSITIVE_EMPTY_WIDGETS: ReadonlySet<string> = new Set(['needs_attention', 'overdue']);

const EMPTY_COPY_BY_WIDGET: Record<string, string> = {
  scores_by_exercise: 'scores',
  student_progression: 'student_scores',
  score_distribution: 'scores',
  score_distribution_course: 'scores',
  exercise_score_distribution: 'scores',
  hardest_exercises: 'hardest_exercises',
  scores_by_exercise_by_cohort: 'scores',
  section_scores: 'scores',
  hardest_questions: 'questions',
  logins_per_day: 'logins',
  logins_per_day_course: 'logins',
  lesson_dropoff: 'lessons',
  hiring_ramp: 'growth',
  courses_by_completion: 'courses_org',
  courses_at_a_glance: 'courses_cohort',
  courses_summary: 'courses_cohort',
  course_details: 'courses_cohort',
  student_courses: 'courses_cohort',
  cohorts_at_a_glance: 'cohorts_org',
  cohort_health: 'cohorts_org',
  avg_score_by_cohort: 'cohorts_org',
  avg_score_by_course: 'scores',
  cohorts_in_course: 'cohorts_course',
  cohort_details: 'cohorts_course'
};

function chartRows(widget: InsightsWidget, result: InsightsResult): InsightsRow[] {
  const dimension = widget.spec.dimensions?.[0];
  if (widget.viz !== 'histogram' || !dimension) return result.rows;

  return result.rows.filter((row) => row[`${dimension}_id`] !== null);
}

const NUMERIC_MEASURE_TYPES: ReadonlySet<InsightsColumn['valueType']> = new Set(['integer', 'number', 'percent']);

/**
 * True when a widget has nothing to show: no rows, or a chart whose every numeric measure is 0 or null.
 */
export function isEmptyResult(widget: InsightsWidget, result: InsightsResult, pageState?: InsightsPageState): boolean {
  const rows = chartRows(widget, result);
  if (rows.length === 0) return true;

  if (widget.viz === 'kpi' || widget.viz === 'table' || widget.viz === 'matrix') return false;

  if (result.total > rows.length || (pageState && pageState.page > 1)) return false;

  const measureKeys = result.columns
    .filter((column) => column.role === 'measure' && NUMERIC_MEASURE_TYPES.has(column.valueType))
    .map((column) => column.key);

  return rows.every((row) => measureKeys.every((key) => row[key] === null || row[key] === 0));
}

function emptyAction(copyKey: string, context: InsightsWidgetContext): ScopeEmptyAction | null {
  if (copyKey === 'courses_cohort' && context.scopeType === 'cohort' && context.courseCount === 0) {
    return { href: `/cohorts/${context.scopeId}/courses`, labelKey: 'insights.scope_empty.add_courses' };
  }

  if (copyKey === 'cohorts_org' && context.orgSlug) {
    return { href: `/org/${context.orgSlug}/cohorts`, labelKey: 'insights.empty_states.create_cohort' };
  }

  if (copyKey === 'cohorts_org_no_students' && context.orgSlug) {
    return { href: `/org/${context.orgSlug}/audience`, labelKey: 'insights.scope_empty.add_students' };
  }

  if (copyKey === 'cohorts_course_no_students') {
    return { href: `/courses/${context.scopeId}/people`, labelKey: 'insights.scope_empty.invite_students' };
  }

  return null;
}

/**
 * Why a widget is empty, in the user's terms: good news, nothing in the selected range, or activity still to come.
 */
export function widgetEmptyState(widget: InsightsWidget, context: InsightsWidgetContext): WidgetEmptyState {
  if (context.studentCount === 0) {
    return { kind: 'no_students', titleKey: 'insights.no_students_yet', descriptionKey: null, vars: {}, action: null };
  }

  const rangeDays = INSIGHTS_RANGE_DAYS[context.range];
  if (POSITIVE_EMPTY_WIDGETS.has(widget.id)) {
    const titleKey = `insights.empty_states.${widget.id}.title`;
    const descriptionKey = `insights.empty_states.${widget.id}.description`;

    return { kind: 'positive', titleKey, descriptionKey, vars: {}, action: null };
  }

  if (widget.usesRange && rangeDays !== null) {
    const vars = { days: rangeDays };

    return {
      kind: 'range',
      titleKey: 'insights.empty_states.range.title',
      descriptionKey: 'insights.empty_states.range.description',
      vars,
      action: null
    };
  }

  let copyKey = EMPTY_COPY_BY_WIDGET[widget.id] ?? 'default';

  if (
    context.cohortCount > 0 &&
    context.scopeType === 'course' &&
    (widget.id === 'cohorts_in_course' || widget.id === 'cohort_details')
  ) {
    copyKey = 'cohorts_course_no_students';
  }

  if (
    context.cohortCount > 0 &&
    context.scopeType === 'org' &&
    (widget.id === 'cohort_health' || widget.id === 'avg_score_by_cohort')
  ) {
    copyKey = 'cohorts_org_no_students';
  }

  const action = emptyAction(copyKey, context);

  return {
    kind: 'waiting',
    titleKey: `insights.empty_states.${copyKey}.title`,
    descriptionKey: `insights.empty_states.${copyKey}.description`,
    vars: {},
    action
  };
}

const STATIC_NOTE_KEYS: Record<string, string> = {
  score_distribution: 'insights.notes.score_distribution',
  score_distribution_course: 'insights.notes.score_distribution',
  course_details: 'insights.notes.course_details',
  section_scorecard: 'insights.notes.section_scorecard',
  overdue: 'insights.notes.overdue',
  hardest_questions: 'insights.notes.hardest_questions',
  logins_per_day_course: 'insights.notes.logins_per_day'
};

const FIRST_TRY_KEYS = ['first_try_pass__pooled', 'passed_first_try__rate'];

function hasNoFirstTryData(result: InsightsResult | null): boolean {
  const firstTryKey = result?.columns.find((column) => FIRST_TRY_KEYS.includes(column.key))?.key;
  if (!result || !firstTryKey || result.rows.length === 0) return false;

  return result.rows.every((row) => row[firstTryKey] === null);
}

function studentsNoteKey(context: InsightsWidgetContext): string {
  if (context.scopeType === 'course') return 'insights.notes.students.course_scope';

  return context.courseSelected ? 'insights.notes.students.one_course' : 'insights.notes.students.all_courses';
}

const TOP_LIST_WIDGETS: ReadonlySet<string> = new Set(['hardest_exercises', 'hardest_questions']);

/**
 * True when a widget that should show every row hit the server's safety cap. Paged widgets and top lists never are.
 */
function isCutShort(widget: InsightsWidget, result: InsightsResult): boolean {
  if (widget.pageGroup || TOP_LIST_WIDGETS.has(widget.id)) return false;

  return result.total > result.rows.length;
}

/**
 * The notes under a widget, in the prototype's customer wording. Empty when the prototype shows none.
 */
export function widgetNotes(
  widget: InsightsWidget,
  result: InsightsResult | null,
  context: InsightsWidgetContext,
  translate: Translate
): string[] {
  const notes: string[] = [];
  const staticKey = STATIC_NOTE_KEYS[widget.id];
  const shown = result?.rows.length ?? 0;

  if (staticKey) notes.push(translate(staticKey));

  if (widget.id === 'needs_attention' && context.scopeType !== 'org') {
    notes.push(translate('insights.notes.needs_attention'));
  }

  if (widget.id === 'logins_per_day' && context.scopeType === 'cohort') {
    notes.push(translate('insights.notes.logins_per_day'));
  }

  if (widget.id === 'students') notes.push(translate(studentsNoteKey(context)));

  if (widget.id === 'cohorts_at_a_glance' && shown > 0) notes.push(translate('insights.notes.cohorts_select'));

  if (widget.id === 'courses_at_a_glance' && shown > 0) notes.push(translate('insights.notes.courses_select'));

  if (result && isCutShort(widget, result)) {
    notes.push(translate('insights.notes.showing_first', { shown, total: result.total }));
  }

  if ((widget.id === 'cohort_health' || widget.id === 'avg_score_by_cohort') && shown > 0) {
    notes.push(translate('insights.notes.cohorts_in_table', { count: shown }));
  }

  if (widget.id === 'cohort_health') {
    const empty = emptyCohortNames(result, translate);
    if (empty) notes.push(translate('insights.notes.not_counted_empty', empty));
  }

  if (widget.id === 'cohorts_in_course' || widget.id === 'scores_by_exercise_by_cohort') {
    const empty = emptyCohortNames(context.emptyCohorts, translate, { countFromTotal: true });
    if (empty) notes.push(translate('insights.notes.not_charted_empty', empty));
  }

  if (widget.id === 'scores_by_exercise_by_cohort' && result?.rows.some((row) => row['cohort_id'] === null)) {
    notes.push(translate('insights.notes.direct_students_charted'));
  }

  if (widget.id === 'lesson_dropoff' && result) {
    const drop = steepestDrop(toHbarItems(result, 'lesson', translate));
    if (drop) notes.push(translate('insights.notes.lesson_dropoff', drop));
  }

  if (hasNoFirstTryData(result)) notes.push(translate('insights.notes.no_pass_mark'));

  return notes;
}

export const CHIP_CLASS = 'ui:border-border ui:bg-card rounded-full border px-3 py-1 text-xs tabular-nums';

export function truncateLabel(label: string, maxLength = 16): string {
  return label.length > maxLength ? `${label.slice(0, maxLength - 1)}…` : label;
}

export function questionHint(
  context: string | null,
  wrongAnswer: string | null,
  translate: Translate
): string | undefined {
  if (context && wrongAnswer) {
    return translate('insights.question_hint.context_and_answer', { context, answer: wrongAnswer });
  }

  if (wrongAnswer) return translate('insights.question_hint.answer', { answer: wrongAnswer });

  return context ?? undefined;
}

export function formatShortDate(value: InsightsCell | undefined): string {
  if (typeof value !== 'string') return '–';

  return new Date(value).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

/**
 * "Section 2" (or "Section 2 · Title"), numbered by the section's position in the course outline.
 */
export function sectionLabel(
  sectionId: InsightsCell | undefined,
  structure: InsightsCourseStructure | undefined,
  translate: Translate,
  options: { withTitle: boolean }
): string {
  const section = structure?.sections.find((entry) => entry.id === sectionId);
  if (!section) return translate('insights.not_in_section');

  const number = section.rank + 1;

  return options.withTitle
    ? translate('insights.section_with_title', { number, title: section.title })
    : translate('insights.section_number', { number });
}

export const STUDENT_FILTER_OPTIONS: { [Key in keyof StudentFilters]: ReadonlyArray<StudentFilters[Key]> } = {
  status: ['', 'at_risk', 'lagging', 'on_track', 'completed'],
  activity: ['', 'today', 'idle'],
  score: ['', 'lt50', 'mid', 'gte70'],
  flag: ['', 'overdue', 'certified', 'not_certified']
};

export const STUDENT_SORTS: readonly StudentSort[] = ['status', 'progress', 'name', 'low_score'];

export function isStudentFilterValue(key: keyof StudentFilters, value: string): boolean {
  return (STUDENT_FILTER_OPTIONS[key] as readonly string[]).includes(value);
}

export function isStudentSort(value: string): value is StudentSort {
  return (STUDENT_SORTS as readonly string[]).includes(value);
}

const STUDENT_SORT_SPEC: Record<StudentSort, InsightsSpec['sort']> = {
  status: [
    { field: 'status_rank__value', dir: 'asc' },
    { field: 'avg_score_pct__value', dir: 'asc' }
  ],
  progress: [{ field: 'overall_progress_pct__value', dir: 'asc' }],
  name: [{ field: 'student', dir: 'asc' }],
  low_score: [{ field: 'avg_score_pct__value', dir: 'asc' }]
};

export function studentQueryParts(
  filters: StudentFilters,
  sort: StudentSort = 'status'
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

  return { filters: specFilters, sort: STUDENT_SORT_SPEC[sort] };
}

export function countActiveStudentFilters(filters: StudentFilters): number {
  return Object.values(filters).filter(Boolean).length;
}

function isExerciseState(value: InsightsCell | undefined): value is StudentExerciseCell['state'] {
  return value === 'not_taken' || value === 'awaiting_grade' || value === 'graded';
}

export function pivotStudentExercises(result: InsightsResult): Record<string, Record<string, StudentExerciseCell>> {
  const cells: Record<string, Record<string, StudentExerciseCell>> = {};

  for (const row of result.rows) {
    const studentId = textCell(row, 'student_id');
    const exerciseId = textCell(row, 'exercise_id');
    if (!studentId || !exerciseId) continue;

    const state = row['state__value'];
    const passed = row['passed__value'];

    cells[studentId] ??= {};
    cells[studentId][exerciseId] = {
      scorePct: numberCell(row, 'best_score_pct__value'),
      state: isExerciseState(state) ? state : 'not_taken',
      passed: typeof passed === 'boolean' ? passed : null
    };
  }

  return cells;
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);

  if (value === null || typeof value !== 'object') return value;

  const entries = Object.entries(value).sort(([left], [right]) => left.localeCompare(right));

  return Object.fromEntries(entries.map(([key, entry]) => [key, sortKeys(entry)]));
}

/**
 * One key per distinct request, whatever order the spec's keys were written in, so identical widgets share one request.
 */
export function specRequestKey(scope: InsightsScopeRef, spec: InsightsSpec, refresh: boolean): string {
  return JSON.stringify(sortKeys({ scope, spec, refresh }));
}

const DEFAULT_COURSE_SORT: InsightsSpec['sort'] = [{ field: 'course', dir: 'asc' }];

/**
 * One page of a student's courses for the student sheet, sorted on the server.
 */
export function studentCoursesSpec(studentId: string, pageState: InsightsPageState): InsightsSpec {
  const sort = pageState.sort ? [{ field: pageState.sort.key, dir: pageState.sort.dir }] : DEFAULT_COURSE_SORT;

  return {
    source: 'student_course',
    dimensions: ['course'],
    measures: [
      { metric: 'progress_pct', agg: 'value' },
      { metric: 'now_at_title', agg: 'value' },
      { metric: 'avg_score_pct', agg: 'value' },
      { metric: 'pass_mark_passed', agg: 'value' },
      { metric: 'pass_mark_exercises', agg: 'value' },
      { metric: 'still_to_pass', agg: 'value' }
    ],
    filters: [{ field: 'student', op: 'eq', value: studentId }],
    sort,
    limit: INSIGHTS_LIMITS.cardPageSize,
    page: pageState.page,
    range: 'all'
  };
}

export function studentScoresSpec(studentId: string, courseId: string, range: TInsightsRange): InsightsSpec {
  return {
    source: 'assessment_result',
    dimensions: ['exercise'],
    measures: [
      { metric: 'best_score_pct', agg: 'value' },
      { metric: 'state', agg: 'value' }
    ],
    filters: [
      { field: 'course', op: 'eq', value: courseId },
      { field: 'student', op: 'eq', value: studentId }
    ],
    sort: [{ field: 'exercise', dir: 'asc' }],
    limit: 200,
    page: 1,
    range
  };
}

export function selectedStudentCourseSpec(studentId: string, courseId: string): InsightsSpec {
  return {
    source: 'student_course',
    dimensions: ['course'],
    measures: [
      { metric: 'progress_pct', agg: 'value' },
      { metric: 'now_at_title', agg: 'value' }
    ],
    filters: [
      { field: 'course', op: 'eq', value: courseId },
      { field: 'student', op: 'eq', value: studentId }
    ],
    sort: [],
    limit: 1,
    page: 1,
    range: 'all'
  };
}

export function toSelectedStudent(row: InsightsRow | undefined): SelectedStudent | null {
  if (!row) return null;

  const id = textCell(row, 'student_id');
  if (!id) return null;

  const name = textCell(row, 'name__value') ?? textCell(row, 'student_label') ?? '';

  return { id, name, row };
}

/**
 * The selection a widget is still waiting for, or null when its spec can run.
 */
export function missingSelection(widget: InsightsWidget, selection: InsightsSelection): PlaceholderKey | null {
  const keys = Object.keys(PLACEHOLDER_BY_KEY) as PlaceholderKey[];

  return keys.find((key) => widgetUsesPlaceholder(widget, key) && !selection[SELECTION_BY_PLACEHOLDER[key]]) ?? null;
}

type KpiFormatter = (
  row: InsightsRow | undefined,
  translate: Translate,
  context: InsightsKpiContext
) => InsightsKpiDisplay;

type DeltaWording = 'gained' | 'compared';

function shareTrend(part: number | null, whole: number | null): InsightsTrend {
  const share = percentOf(part, whole);

  return share !== null && share >= INSIGHTS_THRESHOLDS.alertSharePct ? 'down' : 'flat';
}

function deltaPeriodKey(wording: DeltaWording, rangeDays: number | null): string {
  if (rangeDays === null) return wording === 'gained' ? 'this_week' : 'vs_last_week';

  return wording === 'gained' ? 'in_days' : 'vs_days_ago';
}

/**
 * The context line for a percentage that moved over the period: "+4 pts vs last week" under All time,
 * "+6 pts in the last 30 days" under a range. Green up, red down.
 */
export function formatPointsDelta(
  current: number | null,
  previous: number | null,
  wording: DeltaWording,
  rangeDays: number | null,
  translate: Translate
): Pick<InsightsKpiDisplay, 'description' | 'trend'> {
  if (current === null || previous === null) return {};

  const period = deltaPeriodKey(wording, rangeDays);
  const days = rangeDays ?? INSIGHTS_DEFAULT_PERIOD_DAYS;
  const points = Math.round(current - previous);
  if (points > 0) {
    return { description: translate(`insights.kpi.delta.${period}.up`, { count: points, days }), trend: 'up' };
  }

  if (points < 0) {
    return { description: translate(`insights.kpi.delta.${period}.down`, { count: -points, days }), trend: 'down' };
  }

  return { description: translate(`insights.kpi.delta.${period}.flat`, { days }), trend: 'flat' };
}

function addedInRange(
  count: number,
  rangeDays: number,
  translate: Translate
): Pick<InsightsKpiDisplay, 'description' | 'trend'> {
  const description = translate('insights.kpi.added_in_days', { count, days: rangeDays });

  return { description, trend: count > 0 ? 'up' : 'flat' };
}

function loggedInTitle(rangeDays: number | null, translate: Translate): string | undefined {
  return rangeDays === null ? undefined : translate('insights.kpi.logged_in_days', { days: rangeDays });
}

function averageScoreKpi(
  row: InsightsRow | undefined,
  translate: Translate,
  context: InsightsKpiContext
): InsightsKpiDisplay {
  const value = formatPercent(row?.['avg_score_pct__avg']);
  const description =
    context.rangeDays === null
      ? translate('insights.kpi.avg_score_hint')
      : translate('insights.kpi.avg_score_in_days', { days: context.rangeDays });

  return { value, description, trend: 'flat' };
}

function progressKpi(row: InsightsRow | undefined, translate: Translate, rangeDays: number | null): InsightsKpiDisplay {
  const average = numberCell(row, 'overall_progress_pct__avg');
  const existingAverage = numberCell(row, 'overall_progress_pct_existing__avg');
  const averageAtStart = numberCell(row, 'overall_progress_pct_at_period_start__avg');
  const delta = formatPointsDelta(existingAverage, averageAtStart, 'gained', rangeDays, translate);

  return { value: formatPercent(average), ...delta };
}

function completedDescription(
  percent: string,
  certified: number,
  completedInPeriod: number,
  translate: Translate,
  context: InsightsKpiContext
): string {
  if (context.rangeDays !== null) {
    return translate('insights.kpi.completed_in_days', { percent, count: completedInPeriod, days: context.rangeDays });
  }

  if (context.courseSelected) return translate('insights.kpi.share_of_cohort', { percent });

  return translate('insights.kpi.completed_certified', { percent, count: certified });
}

const KPI_FORMATTERS: Record<string, KpiFormatter> = {
  kpi_logged_in_today: (row, translate, context) => {
    const activeKey = context.rangeDays === null ? 'logged_in_today__count_if' : 'logged_in_period__count_if';
    const active = numberCell(row, activeKey);
    const total = numberCell(row, 'rows__count');
    const value = `${formatCount(active)} / ${formatCount(total)}`;
    const percent = formatPercent(percentOf(active, total));
    const description = translate('insights.kpi.share_of_cohort', { percent });
    const title = loggedInTitle(context.rangeDays, translate);

    return { title, value, description, trend: 'flat' };
  },
  kpi_avg_progress: (row, translate, context) => {
    if (context.rangeDays !== null) return progressKpi(row, translate, context.rangeDays);

    const value = formatPercent(row?.['overall_progress_pct__avg']);
    const description = translate('insights.kpi.avg_progress_hint');

    return { value, description, trend: 'flat' };
  },
  kpi_avg_score: averageScoreKpi,
  kpi_avg_grade: averageScoreKpi,
  kpi_overdue: (row, translate) => {
    const overdue = numberCell(row, 'is_overdue__count_if');
    const total = numberCell(row, 'rows__count');
    const description = translate('insights.kpi.overdue_hint');

    return { value: formatCount(overdue), description, trend: shareTrend(overdue, total) };
  },
  kpi_completed: (row, translate, context) => {
    const completed = numberCell(row, 'is_completed_all__count_if');
    const total = numberCell(row, 'rows__count');
    const certified = numberCell(row, 'certificates__sum') ?? 0;
    const completedInPeriod = numberCell(row, 'completed_all_in_period__count_if') ?? 0;
    const percent = formatPercent(percentOf(completed, total));
    const description = completedDescription(percent, certified, completedInPeriod, translate, context);
    const trend = context.rangeDays !== null && completedInPeriod > 0 ? 'up' : 'flat';

    return { value: formatCount(completed), description, trend };
  },
  kpi_enrolled: (row, translate, context) => {
    const enrolled = numberCell(row, 'rows__count');
    const enrolledInPeriod = numberCell(row, 'enrolled_in_period__count_if') ?? 0;
    const description =
      context.rangeDays === null
        ? translate('insights.kpi.enrolled_this_week', { count: enrolledInPeriod })
        : translate('insights.kpi.enrolled_in_days', { count: enrolledInPeriod, days: context.rangeDays });

    return { value: formatCount(enrolled), description, trend: enrolledInPeriod > 0 ? 'up' : 'flat' };
  },
  kpi_completion_rate: (row, translate, context) => {
    const rate = numberCell(row, 'is_completed__rate');
    const rateAtStart = numberCell(row, 'completion_rate_at_period_start__pooled');
    const delta = formatPointsDelta(rate, rateAtStart, 'compared', context.rangeDays, translate);

    return { value: formatPercent(rate), ...delta };
  },
  kpi_first_try_pass: (row, translate, context) => {
    const took = numberCell(row, 'took_pass_mark__count_if') ?? 0;
    const stillToPass = numberCell(row, 'has_still_to_pass__count_if') ?? 0;
    const value = formatPercent(row?.['first_try_pass__pooled']);
    const description =
      context.rangeDays === null
        ? translate('insights.kpi.first_try_context', { took, still: stillToPass })
        : translate('insights.kpi.first_try_in_days', { took, still: stillToPass, days: context.rangeDays });

    return { value, description, trend: 'flat' };
  },
  kpi_median_days: (row, translate, context) => {
    const days = numberCell(row, 'days_to_finish__median');
    const description =
      context.rangeDays === null
        ? translate('insights.kpi.median_days_hint')
        : translate('insights.kpi.median_days_in_days', { days: context.rangeDays });

    return { value: formatCount(days), description, trend: 'flat' };
  },
  kpi_logged_in_week: (row, translate, context) => {
    const active = numberCell(row, 'logged_in_period__count_if');
    const total = numberCell(row, 'rows__count');
    const percent = formatPercent(percentOf(active, total));
    const description = translate('insights.kpi.share_of_enrolled', { percent });
    const title = loggedInTitle(context.rangeDays, translate);

    return { title, value: formatCount(active), description, trend: 'flat' };
  },
  kpi_progress_trend: (row, translate, context) => progressKpi(row, translate, context.rangeDays),
  kpi_completions: (row, translate, context) => {
    const completed = numberCell(row, 'is_completed__count_if');
    const enrolled = numberCell(row, 'rows__count');
    const completedInPeriod = numberCell(row, 'completed_in_period__count_if') ?? 0;
    if (context.rangeDays !== null) {
      return { value: formatCount(completed), ...addedInRange(completedInPeriod, context.rangeDays, translate) };
    }

    const percent = formatPercent(percentOf(completed, enrolled));
    const description = translate('insights.kpi.share_of_enrolled', { percent });

    return { value: formatCount(completed), description, trend: completedInPeriod > 0 ? 'up' : 'flat' };
  },
  kpi_certificates: (row, translate, context) => {
    const certified = numberCell(row, 'is_certified__count_if');
    const completed = numberCell(row, 'is_completed__count_if');
    const certifiedInPeriod = numberCell(row, 'certified_in_period__count_if') ?? 0;
    if (context.rangeDays !== null) {
      return { value: formatCount(certified), ...addedInRange(certifiedInPeriod, context.rangeDays, translate) };
    }

    const percent = formatPercent(percentOf(certified, completed));
    const description = translate('insights.kpi.share_of_completions', { percent });

    return { value: formatCount(certified), description, trend: 'flat' };
  },
  kpi_needs_attention: (row, translate) => {
    const flagged = numberCell(row, 'is_at_risk__count_if');
    const total = numberCell(row, 'rows__count');
    const description = translate('insights.kpi.needs_attention_hint');

    return { value: formatCount(flagged), description, trend: shareTrend(flagged, total) };
  }
};

const NO_DATA_HINT_KEYS: Record<string, string> = {
  kpi_avg_score: 'insights.kpi.no_data.graded',
  kpi_avg_grade: 'insights.kpi.no_data.graded',
  kpi_first_try_pass: 'insights.kpi.no_data.first_try',
  kpi_median_days: 'insights.kpi.no_data.completions',
  kpi_completion_rate: 'insights.kpi.no_data.enrolments'
};

function formatKpiValue(
  widget: InsightsWidget,
  result: InsightsResult | null,
  translate: Translate,
  context: InsightsKpiContext
): InsightsKpiDisplay {
  const formatter = KPI_FORMATTERS[widget.id];
  const row = result?.rows[0];
  if (formatter) return formatter(row, translate, context);

  const firstMeasure = widget.spec.measures[0];
  const value = formatCount(row?.[`${firstMeasure?.metric}__${firstMeasure?.agg}`]);

  return { value };
}

export function formatKpi(
  widget: InsightsWidget,
  result: InsightsResult | null,
  translate: Translate,
  context: InsightsKpiContext
): InsightsKpiDisplay {
  const display = formatKpiValue(widget, result, translate, context);
  if (!context.hasStudents && result) {
    return { ...display, description: translate('insights.kpi.no_data.students'), trend: 'flat' };
  }

  const hintKey = NO_DATA_HINT_KEYS[widget.id];
  if (display.value !== '–' || !hintKey || !result) return display;

  const description =
    context.rangeDays === null
      ? translate(hintKey)
      : translate('insights.kpi.no_data.in_days', { days: context.rangeDays });

  return { ...display, description, trend: 'flat' };
}

export function growthYMax(
  points: readonly InsightsChartPoint[],
  valueKey: string,
  studentTarget: number | null,
  seatLimit: number | null
): number {
  const values = points.map((point) => point[valueKey]).filter((value): value is number => typeof value === 'number');

  return Math.max(1, ...values, studentTarget ?? 0, seatLimit ?? 0);
}

export function nextSort(current: TableSort | null, key: string): TableSort {
  if (current?.key === key) return { key, dir: current.dir === 'asc' ? 'desc' : 'asc' };

  return { key, dir: 'asc' };
}
