import {
  INSIGHTS_PLACEHOLDERS,
  type TInsightsBreakdownGroup,
  type TInsightsRange,
  type TInsightsScopeType,
  type TInsightsStatus
} from '../constants/insights';
import type { TInsightsFilter, TInsightsQuerySpec, TInsightsWidget } from '../validation/insights';

export type InsightsPlaceholderKey = 'course' | 'exercise';

export type InsightsWidgetPageState = {
  page: number;
  sort: { key: string; dir: 'asc' | 'desc' } | null;
};

export type InsightsWidgetSelection = {
  courseId: string | null;
  exerciseId: string | null;
  range: TInsightsRange;
  breakdown: TInsightsBreakdownGroup;
  pages: Record<string, InsightsWidgetPageState>;
};

export type InsightsWidgetScope = {
  type: TInsightsScopeType;
  cohortCount: number;
  courses: Array<{ id: string; isGrouped: boolean; hasPassRequired: boolean }>;
};

export type InsightsWidgetDashboard = { scope: InsightsWidgetScope };

export type InsightsWidgetStructure = {
  items: Array<{ id: string; type: 'LESSON' | 'EXERCISE'; isPassRequired: boolean }>;
};

export type InsightsStudentTableSort = 'status' | 'name' | 'progress' | 'score' | 'low_score' | 'last_login';

/**
 * Widgets the dashboard loads itself, so snapshots skip them and callers use their own endpoints instead. The
 * dashboard and the snapshot service share this list so the two can never disagree about what a snapshot holds.
 */
export const SELF_LOADING_WIDGET_IDS: ReadonlySet<string> = new Set(['students']);

export type InsightsStudentsTableQuery = {
  courseId?: string | null;
  search?: string;
  status?: TInsightsStatus | null;
  isOverdue?: boolean | null;
  sort?: InsightsStudentTableSort | null;
  dir?: 'asc' | 'desc';
  page: number;
  limit: number;
  filters?: readonly TInsightsFilter[];
};

const PLACEHOLDER_BY_KEY: Record<InsightsPlaceholderKey, string> = {
  course: INSIGHTS_PLACEHOLDERS.course,
  exercise: INSIGHTS_PLACEHOLDERS.exercise
};

const SELECTION_BY_PLACEHOLDER: Record<InsightsPlaceholderKey, 'courseId' | 'exerciseId'> = {
  course: 'courseId',
  exercise: 'exerciseId'
};

export function widgetUsesPlaceholder(widget: TInsightsWidget, key: InsightsPlaceholderKey): boolean {
  return (widget.spec.filters ?? []).some((filter) => filter.value === PLACEHOLDER_BY_KEY[key]);
}

function placeholdersOf(filter: TInsightsFilter): InsightsPlaceholderKey | null {
  const keys = Object.keys(PLACEHOLDER_BY_KEY) as InsightsPlaceholderKey[];

  return keys.find((key) => filter.value === PLACEHOLDER_BY_KEY[key]) ?? null;
}

function fillPlaceholder(filter: TInsightsFilter, selection: InsightsWidgetSelection): TInsightsFilter | null {
  const placeholder = placeholdersOf(filter);
  if (!placeholder) return filter;

  const value = selection[SELECTION_BY_PLACEHOLDER[placeholder]];
  if (!value) return null;

  return { ...filter, value };
}

/**
 * The spec a widget runs for a selection, or null while a filter placeholder is still unfilled.
 */
export function resolveWidgetSpec(
  widget: TInsightsWidget,
  selection: InsightsWidgetSelection
): TInsightsQuerySpec | null {
  const filters: TInsightsFilter[] = [];

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

/**
 * The selection a widget is still waiting for, or null when its spec can run.
 */
export function missingSelection(
  widget: TInsightsWidget,
  selection: InsightsWidgetSelection
): InsightsPlaceholderKey | null {
  const keys = Object.keys(PLACEHOLDER_BY_KEY) as InsightsPlaceholderKey[];

  return keys.find((key) => widgetUsesPlaceholder(widget, key) && !selection[SELECTION_BY_PLACEHOLDER[key]]) ?? null;
}

export function availableBreakdownGroups(
  scopeType: TInsightsScopeType,
  scope: Pick<InsightsWidgetScope, 'cohortCount'>
): TInsightsBreakdownGroup[] {
  if (scopeType !== 'course' && scopeType !== 'org') return [];

  const groups: TInsightsBreakdownGroup[] = ['courses'];
  if (scope.cohortCount > 0) groups.push('cohorts');

  return groups;
}

export function defaultBreakdownGroup(scope: InsightsWidgetScope): TInsightsBreakdownGroup {
  if (scope.type === 'course' && scope.cohortCount > 0) return 'cohorts';

  return 'courses';
}

export function activeBreakdownGroup(
  selection: InsightsWidgetSelection,
  available: readonly TInsightsBreakdownGroup[]
): TInsightsBreakdownGroup {
  if (available.includes(selection.breakdown)) return selection.breakdown;

  return available[0] ?? 'courses';
}

function focusCourse(
  dashboard: InsightsWidgetDashboard,
  selection: InsightsWidgetSelection
): InsightsWidgetScope['courses'][number] | null {
  if (dashboard.scope.type === 'course') return dashboard.scope.courses[0] ?? null;

  return dashboard.scope.courses.find((course) => course.id === selection.courseId) ?? null;
}

export function isWidgetVisible(
  widget: TInsightsWidget,
  dashboard: InsightsWidgetDashboard,
  selection: InsightsWidgetSelection
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

export function defaultCourseId(dashboard: InsightsWidgetDashboard): string | null {
  if (dashboard.scope.type !== 'course') return null;

  return dashboard.scope.courses[0]?.id ?? null;
}

export function defaultExerciseId(structure: InsightsWidgetStructure | undefined): string | null {
  const exercises = (structure?.items ?? []).filter((item) => item.type === 'EXERCISE');

  let lastPassRequired: InsightsWidgetStructure['items'][number] | undefined;
  for (const item of exercises) {
    if (item.isPassRequired) lastPassRequired = item;
  }

  return lastPassRequired?.id ?? exercises[exercises.length - 1]?.id ?? null;
}

const STUDENT_MEASURES: TInsightsQuerySpec['measures'] = [
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

const STUDENT_SORT_SPEC: Record<InsightsStudentTableSort, TInsightsQuerySpec['sort']> = {
  status: [
    { field: 'status_rank__value', dir: 'asc' },
    { field: 'avg_score_pct__value', dir: 'asc' }
  ],
  progress: [{ field: 'overall_progress_pct__value', dir: 'asc' }],
  name: [{ field: 'student', dir: 'asc' }],
  score: [{ field: 'avg_score_pct__value', dir: 'asc' }],
  low_score: [{ field: 'avg_score_pct__value', dir: 'asc' }],
  last_login: [{ field: 'last_login_at__value', dir: 'desc' }]
};

function studentsSort(sort: InsightsStudentTableSort | null | undefined, dir?: 'asc' | 'desc') {
  const base = STUDENT_SORT_SPEC[sort ?? 'status'];
  if (!dir) return base;

  return base.map((entry) => ({ ...entry, dir }));
}

/**
 * The one student table spec the dashboard and the public API both run.
 */
export function studentsTableSpec(query: InsightsStudentsTableQuery): TInsightsQuerySpec {
  const filters: TInsightsFilter[] = [...(query.filters ?? [])];

  if (query.status) filters.push({ field: 'status', op: 'eq', value: query.status });

  if (query.isOverdue === true) filters.push({ field: 'is_overdue', op: 'is_true' });
  if (query.isOverdue === false) filters.push({ field: 'is_overdue', op: 'is_false' });

  if (query.courseId) filters.push({ field: 'course', op: 'eq', value: query.courseId });

  return {
    source: 'student',
    dimensions: ['student'],
    measures: STUDENT_MEASURES,
    filters,
    sort: studentsSort(query.sort, query.dir),
    search: query.search || undefined,
    limit: query.limit,
    page: query.page,
    range: 'all'
  };
}
