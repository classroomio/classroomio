import type { SQL } from 'drizzle-orm';

import type {
  TAnalyticsAgg,
  TAnalyticsDimension,
  TAnalyticsFilterField,
  TAnalyticsFilterOp,
  TAnalyticsMetric,
  TAnalyticsScopeType,
  TAnalyticsSource
} from '@cio/utils/constants/analytics';

export type AnalyticsValueType = 'id' | 'text' | 'integer' | 'number' | 'percent' | 'boolean' | 'date' | 'datetime';

export type AnalyticsScopeRef = {
  orgId: string;
  type: TAnalyticsScopeType;
  id: string;
};

export type AnalyticsOrderedItem = {
  courseId: string;
  itemId: string;
  itemType: 'LESSON' | 'EXERCISE';
  itemRank: number;
  sectionId: string | null;
  sectionRank: number | null;
};

export type AnalyticsPushdown = {
  courseIds?: string[];
  cohortIds?: string[];
  studentIds?: string[];
};

export type AnalyticsCompileContext = {
  scope: AnalyticsScopeRef;
  orderedItems: AnalyticsOrderedItem[];
  pushdown: AnalyticsPushdown;
  byCohort: boolean;
  loginWindowDays: number;
  rangeDays: number | null;
  periodDays: number;
};

export type AnalyticsDimensionDefinition = {
  valueType: AnalyticsValueType;
  key: SQL;
  label?: SQL;
  rank?: SQL;
};

export type AnalyticsMetricDefinition = {
  valueType: AnalyticsValueType;
  value: SQL;
  denominator?: SQL;
  aggs: readonly TAnalyticsAgg[];
};

export type AnalyticsFilterDefinition =
  | { kind: 'pushdown'; target: keyof AnalyticsPushdown }
  | {
      kind: 'predicate';
      column: SQL;
      valueType: AnalyticsValueType;
      ops: readonly TAnalyticsFilterOp[];
      allowedValues?: readonly string[];
    };

export type AnalyticsSourceDefinition = {
  id: TAnalyticsSource;
  scopeTypes: readonly TAnalyticsScopeType[];
  requiresCohortBridge?: boolean;
  build: (context: AnalyticsCompileContext) => SQL;
  dimensions: Partial<Record<TAnalyticsDimension, AnalyticsDimensionDefinition>>;
  metrics: Partial<Record<TAnalyticsMetric, AnalyticsMetricDefinition>>;
  filters: Partial<Record<TAnalyticsFilterField, AnalyticsFilterDefinition>>;
  searchColumns?: readonly SQL[];
};

export type AnalyticsColumn = {
  key: string;
  role: 'dimension' | 'measure';
  valueType: AnalyticsValueType;
};

export type AnalyticsCell = string | number | boolean | null;

export type AnalyticsRow = Record<string, AnalyticsCell>;

export type AnalyticsQueryOutput = {
  columns: AnalyticsColumn[];
  rows: AnalyticsRow[];
  total: number;
};

export type AnalyticsScopeCourse = {
  id: string;
  title: string;
  isGrouped: boolean;
  hasPassRequired: boolean;
};

export type AnalyticsScopeSummary = {
  name: string;
  description: string | null;
  studentCount: number;
  pendingCount: number;
  cohortCount: number;
  activeCohortCount: number;
  studentTarget: number | null;
  seatsUsed: number | null;
  seatsNotJoined: number | null;
  courses: AnalyticsScopeCourse[];
};

export type AnalyticsExerciseMeta = {
  id: string;
  courseId: string;
  completionPolicy: string;
  passThreshold: number | null;
  isUnlocked: boolean | null;
  maxPoints: number;
};
