import { classroomio, type InferResponseType } from '$lib/utils/services/api';
import type { TInsightsBreakdownGroup, TInsightsRange, TInsightsStatus } from '@cio/utils/constants/insights';
import type { TInsightsExportRequest, TInsightsQueryRequest } from '@cio/utils/validation/insights';

export type InsightsQueryRequest = typeof classroomio.insights.query.$post;
export type InsightsExportRequest = typeof classroomio.insights.export.$post;
export type InsightsStudentExportRequest = typeof classroomio.insights.export.students.$post;
export type InsightsDashboardRequest = (typeof classroomio.insights.dashboards)[':scopeType'][':scopeId']['$get'];
export type UpdateInsightsSettingsRequest = typeof classroomio.insights.settings.$put;

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

type InsightsStudentExportSuccess = Extract<InferResponseType<InsightsStudentExportRequest>, { success: true }>;
export type InsightsStudentExportResult = InsightsStudentExportSuccess['data'];

type InsightsDashboardSuccess = Extract<InferResponseType<InsightsDashboardRequest>, { success: true }>;
export type InsightsDashboard = InsightsDashboardSuccess['data'];
export type InsightsWidget = InsightsDashboard['widgets'][number];
export type InsightsScopeSummary = InsightsDashboard['scope'];
export type InsightsScopeCourse = InsightsScopeSummary['courses'][number];
export type InsightsCourseStructure = InsightsDashboard['structures'][string];
export type InsightsStructureItem = InsightsCourseStructure['items'][number];

export type InsightsSelection = {
  courseId: string | null;
  exerciseId: string | null;
  range: TInsightsRange;
  breakdown: TInsightsBreakdownGroup;
  cohortIds: string[] | null;
  pages: Record<string, InsightsPageState>;
};

export type InsightsCohortOption = {
  id: string;
  name: string;
  students: number | null;
  completedStudents: number | null;
  createdAt: string;
};

export type ScopeEmptyAction = { href: string; labelKey: string };

export type ScopeEmptyState = { titleKey: string; descriptionKey: string; actions: ScopeEmptyAction[] };

export type SelectedStudent = { id: string; name: string; row: InsightsRow };

export type InsightsWidgetState = {
  result: InsightsResult | null;
  loading: boolean;
  failed: boolean;
};

export type InsightsTone = 'success' | 'info' | 'warning' | 'danger' | 'muted';

export type InsightsChartPoint = { key: string; label: string; rank: number } & Record<string, number | string | null>;

export type InsightsChartSeries = { key: string; label: string; color: string };

export type InsightsTrend = 'up' | 'down' | 'flat';

export type InsightsKpiDisplay = { title?: string; value: string; description?: string; trend?: InsightsTrend };

export type WidgetEmptyKind = 'no_students' | 'waiting' | 'positive' | 'range';

export type WidgetEmptyState = {
  kind: WidgetEmptyKind;
  titleKey: string;
  descriptionKey: string | null;
  vars: Record<string, string | number>;
  action: ScopeEmptyAction | null;
};

export type InsightsKpiContext = { courseSelected: boolean; rangeDays: number | null; hasStudents: boolean };

export type InsightsWidgetContext = {
  scopeType: InsightsScopeType;
  scopeId: string;
  orgSlug: string | null;
  range: TInsightsRange;
  courseCount: number;
  courseSelected: boolean;
  cohortCount: number;
  studentCount: number;
  emptyCohorts: InsightsResult | null;
};

export type InsightsPillTone = 'ok' | 'lag' | 'risk' | 'done' | 'none';

export type InsightsTitleVars = { course: string; exercise: string };

export type InsightsRangeOption = { value: TInsightsRange; label: string; locked: boolean };

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

export type StudentStatusFilter = '' | TInsightsStatus;
export type StudentActivityFilter = '' | 'today' | 'idle';
export type StudentScoreFilter = '' | 'lt50' | 'mid' | 'gte70';
export type StudentFlagFilter = '' | 'overdue' | 'certified' | 'not_certified';
export type StudentSort = 'status' | 'progress' | 'name' | 'low_score';

export type StudentFilters = {
  status: StudentStatusFilter;
  activity: StudentActivityFilter;
  score: StudentScoreFilter;
  flag: StudentFlagFilter;
};

export type StudentExerciseCell = {
  scorePct: number | null;
  state: 'not_taken' | 'awaiting_grade' | 'graded';
  passed: boolean | null;
};

export type StudentExportHeaders = {
  name: string;
  email: string;
  progress: string;
  nowAt: string;
  finished: string;
  averageScore: string;
  coursesCompleted: string;
  video: string;
  classroom: string;
  certificates: string;
  lastLogin: string;
  status: string;
  statusLabels: Record<TInsightsStatus, string>;
};

export type TableSort = { key: string; dir: 'asc' | 'desc' };

export type InsightsPageState = { page: number; sort: TableSort | null };
