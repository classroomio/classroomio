import {
  ANALYTICS_STATUSES,
  ANALYTICS_THRESHOLDS,
  type TAnalyticsFilterField,
  type TAnalyticsRange,
  type TAnalyticsStatus
} from '../constants/analytics';
import type { TAnalyticsFilter, TAnalyticsQuerySpec } from '../validation/analytics';

export const ANALYTICS_ATTENTION_REASONS = ['inactive', 'low_score', 'overdue', 'low_video'] as const;

export type AnalyticsAttentionReason = (typeof ANALYTICS_ATTENTION_REASONS)[number];

export type AnalyticsDrilldownFacet =
  | { kind: 'status'; status: TAnalyticsStatus }
  | { kind: 'attention'; reason: AnalyticsAttentionReason }
  | { kind: 'cohort_health'; health: TAnalyticsStatus | null }
  | { kind: 'overdue' }
  | { kind: 'completed' }
  | { kind: 'lesson_incomplete'; lessonId: string }
  | { kind: 'score_bucket'; bucket: number }
  | { kind: 'scored' };

export type AnalyticsDrilldown = {
  widgetId: string;
  facet: AnalyticsDrilldownFacet | null;
  filters: TAnalyticsFilter[];
  range: TAnalyticsRange;
  expectedTotal: number | null;
};

export type AnalyticsDrilldownRow = Record<string, string | number | boolean | null | undefined>;

export type AnalyticsDrilldownInput = {
  widgetId: string;
  spec: TAnalyticsQuerySpec;
  rows: readonly AnalyticsDrilldownRow[];
  segmentKey: string | null;
};

type DrilldownPart = Pick<AnalyticsDrilldown, 'facet' | 'filters' | 'expectedTotal'>;

type DrilldownRule = {
  usesRange?: boolean;
  whole?: (input: AnalyticsDrilldownInput) => DrilldownPart | null;
  segment?: (key: string, input: AnalyticsDrilldownInput) => DrilldownPart | null;
};

const CROSS_SOURCE_FIELDS: readonly TAnalyticsFilterField[] = ['course'];

const SCORE_BUCKET_FLOOR = 4;
const SCORE_BUCKET_CEILING = 9;
const SCORE_BUCKET_WIDTH = 10;

const ATTENTION_FILTER_FIELDS: Record<AnalyticsAttentionReason, TAnalyticsFilterField> = {
  inactive: 'is_inactive',
  low_score: 'is_low_score',
  overdue: 'is_overdue',
  low_video: 'is_low_video'
};

const ATTENTION_MEASURE_KEYS: Record<string, AnalyticsAttentionReason> = {
  is_inactive__count_if: 'inactive',
  is_low_score__count_if: 'low_score',
  is_overdue__count_if: 'overdue',
  is_low_video__count_if: 'low_video'
};

function carriedFilters(spec: TAnalyticsQuerySpec, fields?: readonly TAnalyticsFilterField[]): TAnalyticsFilter[] {
  if (!fields) return [...spec.filters];

  return spec.filters.filter((filter) => fields.includes(filter.field));
}

function isStatus(value: string): value is TAnalyticsStatus {
  return (ANALYTICS_STATUSES as readonly string[]).includes(value);
}

function numberValue(row: AnalyticsDrilldownRow, key: string): number {
  const value = row[key];

  return typeof value === 'number' ? value : 0;
}

/**
 * A cohort's health from its students: completed when nearly everyone finished, at risk when a fifth are at risk,
 * lagging when the average score is low. Null for a cohort with no students yet.
 */
export function cohortHealth(row: AnalyticsDrilldownRow): TAnalyticsStatus | null {
  const students = numberValue(row, 'students__value');
  if (students === 0) return null;

  const completed = numberValue(row, 'completed_students__value');
  const atRisk = numberValue(row, 'at_risk_students__value');
  const averageScore = row['avg_score_pct__value'];

  if (completed / students >= 0.95) return 'completed';

  if (atRisk / students >= 0.2) return 'at_risk';

  if (typeof averageScore === 'number' && averageScore < ANALYTICS_THRESHOLDS.laggingScorePct) return 'lagging';

  return 'on_track';
}

function cohortHealthPart(
  rows: readonly AnalyticsDrilldownRow[],
  spec: TAnalyticsQuerySpec,
  health: TAnalyticsStatus | null
): DrilldownPart | null {
  const matching = rows.filter((row) => {
    const rowHealth = cohortHealth(row);

    return health ? rowHealth === health : rowHealth !== null;
  });
  const cohortIds = matching.flatMap((row) => (typeof row['cohort_id'] === 'string' ? [row['cohort_id']] : []));
  if (cohortIds.length === 0) return null;

  const expectedTotal = matching.reduce((total, row) => total + numberValue(row, 'students__value'), 0);
  const cohortFilter: TAnalyticsFilter = { field: 'cohort', op: 'in', value: cohortIds };

  return {
    facet: { kind: 'cohort_health', health },
    filters: [...carriedFilters(spec, CROSS_SOURCE_FIELDS), cohortFilter],
    expectedTotal
  };
}

function scoreBucketFilters(bucket: number): TAnalyticsFilter[] | null {
  if (!Number.isInteger(bucket) || bucket < SCORE_BUCKET_FLOOR || bucket > SCORE_BUCKET_CEILING) return null;

  const filters: TAnalyticsFilter[] = [];
  if (bucket > SCORE_BUCKET_FLOOR) {
    filters.push({ field: 'avg_score_pct', op: 'gte', value: bucket * SCORE_BUCKET_WIDTH });
  }

  if (bucket < SCORE_BUCKET_CEILING) {
    filters.push({ field: 'avg_score_pct', op: 'lt', value: (bucket + 1) * SCORE_BUCKET_WIDTH });
  }

  return filters;
}

function statusSegment(key: string, { spec }: AnalyticsDrilldownInput): DrilldownPart | null {
  if (!isStatus(key)) return null;

  const filters: TAnalyticsFilter[] = [...spec.filters, { field: 'status', op: 'eq', value: key }];

  return { facet: { kind: 'status', status: key }, filters, expectedTotal: null };
}

function scoreDistributionRule(): DrilldownRule {
  return {
    usesRange: true,
    whole: ({ spec }) => ({
      facet: { kind: 'scored' },
      filters: [...spec.filters, { field: 'avg_score_pct', op: 'gte', value: 0 }],
      expectedTotal: null
    }),
    segment: (key, { spec }) => {
      const bucket = Number(key);
      const bucketFilters = scoreBucketFilters(bucket);
      if (!bucketFilters) return null;

      return {
        facet: { kind: 'score_bucket', bucket },
        filters: [...spec.filters, ...bucketFilters],
        expectedTotal: null
      };
    }
  };
}

function flagWhole(
  facet: AnalyticsDrilldownFacet,
  filter: TAnalyticsFilter,
  fields?: readonly TAnalyticsFilterField[]
): NonNullable<DrilldownRule['whole']> {
  return ({ spec }) => ({ facet, filters: [...carriedFilters(spec, fields), filter], expectedTotal: null });
}

const DRILLDOWN_RULES: Record<string, DrilldownRule> = {
  kpi_needs_attention: {
    whole: flagWhole({ kind: 'status', status: 'at_risk' }, { field: 'is_at_risk', op: 'is_true' })
  },
  kpi_overdue: { whole: flagWhole({ kind: 'overdue' }, { field: 'is_overdue', op: 'is_true' }) },
  kpi_completed: { whole: flagWhole({ kind: 'completed' }, { field: 'is_completed_all', op: 'is_true' }) },
  students_by_status: { segment: statusSegment },
  students_by_status_course: { segment: statusSegment },
  needs_attention: {
    segment: (key, { spec }) => {
      const reason = ATTENTION_MEASURE_KEYS[key];
      if (!reason) return null;

      const filter: TAnalyticsFilter = { field: ATTENTION_FILTER_FIELDS[reason], op: 'is_true' };

      return { facet: { kind: 'attention', reason }, filters: [...spec.filters, filter], expectedTotal: null };
    }
  },
  cohort_health: {
    whole: ({ spec, rows }) => cohortHealthPart(rows, spec, null),
    segment: (key, { spec, rows }) => (isStatus(key) ? cohortHealthPart(rows, spec, key) : null)
  },
  overdue: {
    whole: flagWhole({ kind: 'overdue' }, { field: 'is_overdue', op: 'is_true' }, CROSS_SOURCE_FIELDS)
  },
  lesson_dropoff: {
    segment: (key, { spec }) => {
      if (!key) return null;

      const filter: TAnalyticsFilter = { field: 'lesson_incomplete', op: 'eq', value: key };

      return {
        facet: { kind: 'lesson_incomplete', lessonId: key },
        filters: [...carriedFilters(spec, CROSS_SOURCE_FIELDS), filter],
        expectedTotal: null
      };
    }
  },
  score_distribution: scoreDistributionRule(),
  score_distribution_course: scoreDistributionRule()
};

export function hasWholeDrilldown(widgetId: string): boolean {
  return Boolean(DRILLDOWN_RULES[widgetId]?.whole);
}

export function hasSegmentDrilldown(widgetId: string): boolean {
  return Boolean(DRILLDOWN_RULES[widgetId]?.segment);
}

/**
 * The students behind a widget number, as the one place that decides which student filters reproduce it. A null
 * segment key drills into the whole widget. Returns null when the widget or segment has no exact student list.
 */
export function widgetDrilldown(input: AnalyticsDrilldownInput): AnalyticsDrilldown | null {
  const rule = DRILLDOWN_RULES[input.widgetId];
  if (!rule) return null;

  const part = input.segmentKey === null ? rule.whole?.(input) : rule.segment?.(input.segmentKey, input);
  if (!part) return null;

  const range = rule.usesRange ? input.spec.range : 'all';

  return { widgetId: input.widgetId, range, ...part };
}
