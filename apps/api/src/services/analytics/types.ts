import type { AnalyticsQueryOutput, AnalyticsScopeRef, AnalyticsScopeSummary } from '@cio/db/queries/analytics';
import type { TAnalyticsScopeType } from '@cio/utils/constants/analytics';
import type { TAnalyticsWidget } from '@cio/utils/validation/analytics';

export type AnalyticsActor = {
  profileId: string;
  orgId: string;
  orgRoles: Record<string, number>;
};

export type AuthorizedAnalyticsScope = AnalyticsScopeRef & { courseIds: string[] };

export type AnalyticsQueryResult = AnalyticsQueryOutput & {
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
