import type { InsightsQueryOutput, InsightsScopeRef, InsightsScopeSummary } from '@cio/db/queries/insights';
import type { InsightsStudentTableSort } from '@cio/utils/insights';
import type {
  TInsightsBreakdownGroup,
  TInsightsRange,
  TInsightsScopeType,
  TInsightsStatus
} from '@cio/utils/constants/insights';
import type { TInsightsQuerySpec, TInsightsWidget } from '@cio/utils/validation/insights';

export type InsightsActor = {
  profileId: string;
  orgId: string;
  orgRoles: Record<string, number>;
};

export type AuthorizedInsightsScope = InsightsScopeRef & { courseIds: string[] };

export type InsightsQueryResult = InsightsQueryOutput & {
  range: TInsightsRange;
  generatedAt: string;
  cached: boolean;
  refreshThrottled: boolean;
};

export type InsightsExerciseCell = {
  scorePct: number | null;
  state: 'not_taken' | 'awaiting_grade' | 'graded';
  passed: boolean | null;
};

export type InsightsStudentExportResult = {
  students: InsightsQueryOutput;
  cells: Record<string, Record<string, InsightsExerciseCell>>;
  studentsTruncated: boolean;
  exercisesTruncated: boolean;
};

export type InsightsStructureItem = {
  id: string;
  type: 'LESSON' | 'EXERCISE';
  title: string;
  rank: number;
  sectionId: string | null;
  isPassRequired: boolean;
  passMark: number | null;
  isLocked: boolean;
  maxPoints: number | null;
};

export type InsightsCourseStructure = {
  courseId: string;
  isGrouped: boolean;
  sections: Array<{ id: string; title: string; rank: number }>;
  items: InsightsStructureItem[];
};

export type InsightsDashboard = {
  scope: InsightsScopeSummary & { type: TInsightsScopeType; id: string };
  structures: Record<string, InsightsCourseStructure>;
  widgets: TInsightsWidget[];
  refreshIntervalSeconds: number;
};

/** The caller-selected course, exercise, breakdown and range behind one snapshot, with defaults filled. */
export type InsightsSnapshotSelection = {
  courseId: string | null;
  exerciseId: string | null;
  breakdown: TInsightsBreakdownGroup;
  range: TInsightsRange;
};

export type InsightsSnapshotQuery = {
  courseId?: string | null;
  exerciseId?: string | null;
  range?: TInsightsRange;
  breakdown?: TInsightsBreakdownGroup;
  refresh?: boolean;
};

/** One widget of a snapshot: its resolved spec, or the error that kept its result empty. */
export type InsightsSnapshotWidget = {
  id: string;
  viz: TInsightsWidget['viz'];
  description: string;
  spec: TInsightsQuerySpec;
  result: InsightsQueryOutput | null;
  errorCode: string | null;
};

export type InsightsDashboardSnapshot = {
  scope: InsightsScopeSummary & { type: TInsightsScopeType; id: string };
  selection: InsightsSnapshotSelection;
  generatedAt: string;
  widgets: InsightsSnapshotWidget[];
};

export type InsightsStudentRow = {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  progressPct: number | null;
  avgScorePct: number | null;
  coursesCompleted: number | null;
  coursesTotal: number | null;
  videoPct: number | null;
  attendancePct: number | null;
  certificates: number | null;
  lastLoginAt: string | null;
  isOverdue: boolean | null;
  status: TInsightsStatus | null;
  nowAt: string | null;
};

export type InsightsStudentsQuery = {
  courseId?: string | null;
  search?: string;
  status?: TInsightsStatus | null;
  isOverdue?: boolean | null;
  sort?: InsightsStudentTableSort | null;
  dir?: 'asc' | 'desc';
  page?: number;
  limit?: number;
};

export type InsightsStudentsResult = {
  rows: InsightsStudentRow[];
  page: number;
  limit: number;
  total: number;
};
