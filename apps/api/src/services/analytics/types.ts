import type { AnalyticsQueryOutput, AnalyticsScopeRef, AnalyticsScopeSummary } from '@cio/db/queries/analytics';
import type { AnalyticsStudentTableSort } from '@cio/utils/analytics';
import type {
  TAnalyticsBreakdownGroup,
  TAnalyticsRange,
  TAnalyticsScopeType,
  TAnalyticsStatus
} from '@cio/utils/constants/analytics';
import type { TAnalyticsQuerySpec, TAnalyticsWidget } from '@cio/utils/validation/analytics';

export type AnalyticsActor = {
  profileId: string;
  orgId: string;
  orgRoles: Record<string, number>;
};

export type AuthorizedAnalyticsScope = AnalyticsScopeRef & { courseIds: string[] };

export type AnalyticsQueryResult = AnalyticsQueryOutput & {
  range: TAnalyticsRange;
  generatedAt: string;
  cached: boolean;
  refreshThrottled: boolean;
};

export type AnalyticsExerciseCell = {
  scorePct: number | null;
  state: 'not_taken' | 'awaiting_grade' | 'graded';
  passed: boolean | null;
};

export type AnalyticsStudentExportResult = {
  students: AnalyticsQueryOutput;
  cells: Record<string, Record<string, AnalyticsExerciseCell>>;
  studentsTruncated: boolean;
  exercisesTruncated: boolean;
};

export type AnalyticsStructureItem = {
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

export type AnalyticsCourseStructure = {
  courseId: string;
  isGrouped: boolean;
  sections: Array<{ id: string; title: string; rank: number }>;
  items: AnalyticsStructureItem[];
};

export type AnalyticsDashboard = {
  scope: AnalyticsScopeSummary & { type: TAnalyticsScopeType; id: string };
  structures: Record<string, AnalyticsCourseStructure>;
  widgets: TAnalyticsWidget[];
  refreshIntervalSeconds: number;
};

/** The caller-selected course, exercise, breakdown and range behind one snapshot, with defaults filled. */
export type AnalyticsSnapshotSelection = {
  courseId: string | null;
  exerciseId: string | null;
  breakdown: TAnalyticsBreakdownGroup;
  range: TAnalyticsRange;
};

export type AnalyticsSnapshotQuery = {
  courseId?: string | null;
  exerciseId?: string | null;
  range?: TAnalyticsRange;
  breakdown?: TAnalyticsBreakdownGroup;
  refresh?: boolean;
};

/** One widget of a snapshot: its resolved spec, or the error that kept its result empty. */
export type AnalyticsSnapshotWidget = {
  id: string;
  viz: TAnalyticsWidget['viz'];
  description: string;
  spec: TAnalyticsQuerySpec;
  result: AnalyticsQueryOutput | null;
  errorCode: string | null;
};

export type AnalyticsDashboardSnapshot = {
  scope: AnalyticsScopeSummary & { type: TAnalyticsScopeType; id: string };
  selection: AnalyticsSnapshotSelection;
  generatedAt: string;
  widgets: AnalyticsSnapshotWidget[];
};

export type AnalyticsStudentRow = {
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
  status: TAnalyticsStatus | null;
  nowAt: string | null;
};

export type AnalyticsStudentsQuery = {
  courseId?: string | null;
  search?: string;
  status?: TAnalyticsStatus | null;
  isOverdue?: boolean | null;
  sort?: AnalyticsStudentTableSort | null;
  dir?: 'asc' | 'desc';
  page?: number;
  limit?: number;
};

export type AnalyticsStudentsResult = {
  rows: AnalyticsStudentRow[];
  page: number;
  limit: number;
  total: number;
};
