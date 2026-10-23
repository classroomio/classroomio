import type { InsightsQueryOutput, InsightsScopeRef, InsightsScopeSummary } from '@cio/db/queries/insights';
import type { TInsightsScopeType } from '@cio/utils/constants/insights';
import type { TInsightsWidget } from '@cio/utils/validation/insights';

export type InsightsActor = {
  profileId: string;
  orgId: string;
  orgRoles: Record<string, number>;
};

export type AuthorizedInsightsScope = InsightsScopeRef & { courseIds: string[] };

export type InsightsQueryResult = InsightsQueryOutput & {
  generatedAt: string;
  cached: boolean;
  refreshThrottled: boolean;
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
