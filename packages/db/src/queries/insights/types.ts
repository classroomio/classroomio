import type { SQL } from 'drizzle-orm';

import type {
  TInsightsAgg,
  TInsightsDimension,
  TInsightsFilterField,
  TInsightsFilterOp,
  TInsightsMetric,
  TInsightsScopeType,
  TInsightsSource
} from '@cio/utils/constants/insights';

export type InsightsValueType = 'id' | 'text' | 'integer' | 'number' | 'percent' | 'boolean' | 'date' | 'datetime';

export type InsightsScopeRef = {
  orgId: string;
  type: TInsightsScopeType;
  id: string;
};

export type InsightsOrderedItem = {
  courseId: string;
  itemId: string;
  itemType: 'LESSON' | 'EXERCISE';
  itemRank: number;
  sectionId: string | null;
  sectionRank: number | null;
};

export type InsightsPushdown = {
  courseIds?: string[];
  cohortIds?: string[];
  learnerIds?: string[];
};

export type InsightsCompileContext = {
  scope: InsightsScopeRef;
  orderedItems: InsightsOrderedItem[];
  pushdown: InsightsPushdown;
  byCohort: boolean;
  loginWindowDays: number;
  rangeDays: number | null;
  periodDays: number;
};

export type InsightsDimensionDefinition = {
  valueType: InsightsValueType;
  key: SQL;
  label?: SQL;
  rank?: SQL;
};

export type InsightsMetricDefinition = {
  valueType: InsightsValueType;
  value: SQL;
  denominator?: SQL;
  aggs: readonly TInsightsAgg[];
};

export type InsightsFilterDefinition =
  | { kind: 'pushdown'; target: keyof InsightsPushdown }
  | {
      kind: 'predicate';
      column: SQL;
      valueType: InsightsValueType;
      ops: readonly TInsightsFilterOp[];
      allowedValues?: readonly string[];
    };

export type InsightsSourceDefinition = {
  id: TInsightsSource;
  scopeTypes: readonly TInsightsScopeType[];
  requiresCohortBridge?: boolean;
  build: (context: InsightsCompileContext) => SQL;
  dimensions: Partial<Record<TInsightsDimension, InsightsDimensionDefinition>>;
  metrics: Partial<Record<TInsightsMetric, InsightsMetricDefinition>>;
  filters: Partial<Record<TInsightsFilterField, InsightsFilterDefinition>>;
  searchColumns?: readonly SQL[];
};

export type InsightsColumn = {
  key: string;
  role: 'dimension' | 'measure';
  valueType: InsightsValueType;
};

export type InsightsCell = string | number | boolean | null;

export type InsightsRow = Record<string, InsightsCell>;

export type InsightsQueryOutput = {
  columns: InsightsColumn[];
  rows: InsightsRow[];
  total: number;
};

export type InsightsScopeCourse = {
  id: string;
  title: string;
  isGrouped: boolean;
  hasPassRequired: boolean;
};

export type InsightsScopeSummary = {
  name: string;
  description: string | null;
  learnerCount: number;
  pendingCount: number;
  cohortCount: number;
  activeCohortCount: number;
  learnerTarget: number | null;
  courses: InsightsScopeCourse[];
};

export type InsightsExerciseMeta = {
  id: string;
  courseId: string;
  completionPolicy: string;
  passThreshold: number | null;
  isUnlocked: boolean | null;
  maxPoints: number;
};
