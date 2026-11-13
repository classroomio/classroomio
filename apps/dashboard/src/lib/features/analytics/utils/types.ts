import { classroomio, type InferResponseType } from '$lib/utils/services/api';
import type { TAnalyticsBreakdownGroup, TAnalyticsRange, TAnalyticsStatus } from '@cio/utils/constants/analytics';
import type { TAnalyticsExportRequest, TAnalyticsQueryRequest } from '@cio/utils/validation/analytics';

export type AnalyticsQueryRequest = typeof classroomio.analytics.query.$post;
export type AnalyticsExportRequest = typeof classroomio.analytics.export.$post;
export type AnalyticsStudentExportRequest = typeof classroomio.analytics.export.students.$post;
export type AnalyticsDashboardRequest = (typeof classroomio.analytics.dashboards)[':scopeType'][':scopeId']['$get'];
export type UpdateAnalyticsSettingsRequest = typeof classroomio.analytics.settings.$put;

type AnalyticsQuerySuccess = Extract<InferResponseType<AnalyticsQueryRequest>, { success: true }>;
export type AnalyticsResult = AnalyticsQuerySuccess['data'];
export type AnalyticsRow = AnalyticsResult['rows'][number];
export type AnalyticsCell = AnalyticsRow[string];
export type AnalyticsColumn = AnalyticsResult['columns'][number];

export type AnalyticsQueryBody = TAnalyticsQueryRequest;
export type AnalyticsSpec = AnalyticsQueryBody['spec'];
export type AnalyticsScopeRef = AnalyticsQueryBody['scope'];
export type AnalyticsScopeType = AnalyticsScopeRef['type'];
export type AnalyticsFilter = NonNullable<AnalyticsSpec['filters']>[number];

export type AnalyticsExportBody = TAnalyticsExportRequest;
export type AnalyticsExportSpec = AnalyticsExportBody['spec'];

type AnalyticsStudentExportSuccess = Extract<InferResponseType<AnalyticsStudentExportRequest>, { success: true }>;
export type AnalyticsStudentExportResult = AnalyticsStudentExportSuccess['data'];

type AnalyticsDashboardSuccess = Extract<InferResponseType<AnalyticsDashboardRequest>, { success: true }>;
export type AnalyticsDashboard = AnalyticsDashboardSuccess['data'];
export type AnalyticsWidget = AnalyticsDashboard['widgets'][number];
export type AnalyticsScopeSummary = AnalyticsDashboard['scope'];
export type AnalyticsScopeCourse = AnalyticsScopeSummary['courses'][number];

export type PlanSeatUsage = { used: number; limit: number | null };
export type SeatUsage = { used: number; limit: number; notJoined: number };
export type AnalyticsCourseStructure = AnalyticsDashboard['structures'][string];
export type AnalyticsStructureItem = AnalyticsCourseStructure['items'][number];

export type AnalyticsSelection = {
  courseId: string | null;
  exerciseId: string | null;
  range: TAnalyticsRange;
  breakdown: TAnalyticsBreakdownGroup;
  cohortIds: string[] | null;
  pages: Record<string, AnalyticsPageState>;
};

export type AnalyticsCohortOption = {
  id: string;
  name: string;
  students: number | null;
  completedStudents: number | null;
  createdAt: string;
};

export type ScopeEmptyAction = { href: string; labelKey: string };

export type ScopeEmptyState = { titleKey: string; descriptionKey: string; actions: ScopeEmptyAction[] };

export type SelectedStudent = { id: string; name: string; row: AnalyticsRow };

export type AnalyticsWidgetState = {
  result: AnalyticsResult | null;
  loading: boolean;
  failed: boolean;
};

export type AnalyticsTone = 'success' | 'info' | 'warning' | 'danger' | 'muted';

export type AnalyticsChartPoint = { key: string; label: string; rank: number } & Record<string, number | string | null>;

export type AnalyticsChartSeries = { key: string; label: string; color: string };

export type AnalyticsTrend = 'up' | 'down' | 'flat';

export type AnalyticsKpiDisplay = { title?: string; value: string; description?: string; trend?: AnalyticsTrend };

export type WidgetEmptyKind = 'no_students' | 'waiting' | 'positive' | 'range';

export type WidgetEmptyState = {
  kind: WidgetEmptyKind;
  titleKey: string;
  descriptionKey: string | null;
  vars: Record<string, string | number>;
  action: ScopeEmptyAction | null;
};

export type AnalyticsKpiContext = { courseSelected: boolean; rangeDays: number | null; hasStudents: boolean };

export type AnalyticsWidgetContext = {
  scopeType: AnalyticsScopeType;
  scopeId: string;
  orgSlug: string | null;
  range: TAnalyticsRange;
  courseCount: number;
  courseSelected: boolean;
  cohortCount: number;
  studentCount: number;
  emptyCohorts: AnalyticsResult | null;
};

export type AnalyticsPillTone = 'ok' | 'lag' | 'risk' | 'done' | 'none';

export type AnalyticsTitleVars = { course: string; exercise: string };

export type AnalyticsRangeOption = { value: TAnalyticsRange; label: string; locked: boolean };

export type WidgetRendererProps = { widget: AnalyticsWidget; result: AnalyticsResult };

export type DonutSegment = { key: string; label: string; value: number; color: string };

export type HbarItem = {
  key: string;
  label: string;
  value: number | null;
  display: string;
  hint?: string;
  tone?: AnalyticsTone;
};

export type StudentStatusFilter = '' | TAnalyticsStatus;
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
  statusLabels: Record<TAnalyticsStatus, string>;
};

export type TableSort = { key: string; dir: 'asc' | 'desc' };

export type AnalyticsPageState = { page: number; sort: TableSort | null };
