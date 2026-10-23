import { classroomio, type InferResponseType } from '$lib/utils/services/api';
import type { TInsightsStatus } from '@cio/utils/constants/insights';
import type { TInsightsExportRequest, TInsightsQueryRequest } from '@cio/utils/validation/insights';

export type InsightsQueryRequest = typeof classroomio.insights.query.$post;
export type InsightsExportRequest = typeof classroomio.insights.export.$post;
export type InsightsDashboardRequest = (typeof classroomio.insights.dashboards)[':scopeType'][':scopeId']['$get'];

type InsightsQuerySuccess = Extract<InferResponseType<InsightsQueryRequest>, { success: true }>;
export type InsightsResult = InsightsQuerySuccess['data'];
export type InsightsRow = InsightsResult['rows'][number];
export type InsightsCell = InsightsRow[string];
export type InsightsColumn = InsightsResult['columns'][number];

export type InsightsQueryBody = TInsightsQueryRequest;
export type InsightsSpec = InsightsQueryBody['spec'];
export type InsightsScopeRef = InsightsQueryBody['scope'];
export type InsightsScopeType = InsightsScopeRef['type'];
export type InsightsFilter = NonNullable<InsightsSpec['filters']>[number];

export type InsightsExportBody = TInsightsExportRequest;
export type InsightsExportSpec = InsightsExportBody['spec'];

type InsightsDashboardSuccess = Extract<InferResponseType<InsightsDashboardRequest>, { success: true }>;
export type InsightsDashboard = InsightsDashboardSuccess['data'];
export type InsightsWidget = InsightsDashboard['widgets'][number];
export type InsightsScopeSummary = InsightsDashboard['scope'];
export type InsightsScopeCourse = InsightsScopeSummary['courses'][number];
export type InsightsCourseStructure = InsightsDashboard['structures'][string];
export type InsightsStructureItem = InsightsCourseStructure['items'][number];

export type InsightsSelection = {
  courseId: string | null;
  learnerId: string | null;
  exerciseId: string | null;
};

export type InsightsWidgetState = {
  result: InsightsResult | null;
  loading: boolean;
  failed: boolean;
};

export type InsightsTone = 'success' | 'info' | 'warning' | 'danger' | 'muted';

export type InsightsChartPoint = { key: string; label: string; rank: number } & Record<string, number | string | null>;

export type InsightsChartSeries = { key: string; label: string; color: string };

export type InsightsKpiDisplay = { value: string; description?: string };

export type WidgetRendererProps = { widget: InsightsWidget; result: InsightsResult };

export type DonutSegment = { key: string; label: string; value: number; color: string };

export type HbarItem = {
  key: string;
  label: string;
  value: number | null;
  display: string;
  hint?: string;
  tone?: InsightsTone;
};

export type LearnerStatusFilter = '' | TInsightsStatus;
export type LearnerActivityFilter = '' | 'today' | 'idle';
export type LearnerScoreFilter = '' | 'lt50' | 'mid' | 'gte70';
export type LearnerFlagFilter = '' | 'overdue' | 'certified' | 'not_certified';
export type LearnerSort = 'status' | 'progress' | 'name' | 'low_score';

export type LearnerFilters = {
  status: LearnerStatusFilter;
  activity: LearnerActivityFilter;
  score: LearnerScoreFilter;
  flag: LearnerFlagFilter;
};

export type LearnerExerciseCell = {
  scorePct: number | null;
  state: 'not_taken' | 'awaiting_grade' | 'graded';
  passed: boolean | null;
};

export type LearnerExportHeaders = {
  name: string;
  email: string;
  progress: string;
  averageScore: string;
  coursesCompleted: string;
  video: string;
  classroom: string;
  certificates: string;
  lastLogin: string;
  status: string;
  statusLabels: Record<TInsightsStatus, string>;
};
