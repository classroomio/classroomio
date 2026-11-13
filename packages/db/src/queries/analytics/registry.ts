import type {
  TAnalyticsAgg,
  TAnalyticsFilterOp,
  TAnalyticsScopeType,
  TAnalyticsSource
} from '@cio/utils/constants/analytics';

import type { AnalyticsSourceDefinition, AnalyticsValueType } from './types';
import { assessmentResultSource } from './sources/assessment-result';
import { cohortSummarySource } from './sources/cohort-summary';
import { studentSource } from './sources/student';
import { studentCourseSource } from './sources/student-course';
import { lessonProgressSource } from './sources/lesson-progress';
import { loginDaySource } from './sources/login-day';
import { orgMemberSource } from './sources/org-member';
import { overdueItemSource } from './sources/overdue-item';
import { overdueStudentSource } from './sources/overdue-student';
import { questionResultSource } from './sources/question-result';
import { sectionActivitySource } from './sources/section-activity';

export const ANALYTICS_REGISTRY: Record<TAnalyticsSource, AnalyticsSourceDefinition> = {
  student: studentSource,
  student_course: studentCourseSource,
  assessment_result: assessmentResultSource,
  section_activity: sectionActivitySource,
  question_result: questionResultSource,
  lesson_progress: lessonProgressSource,
  login_day: loginDaySource,
  overdue_item: overdueItemSource,
  org_member: orgMemberSource,
  cohort_summary: cohortSummarySource,
  overdue_student: overdueStudentSource
};

export type AnalyticsRegistryMetricDescription = {
  valueType: AnalyticsValueType;
  aggs: readonly TAnalyticsAgg[];
};

export type AnalyticsRegistryDimensionDescription = {
  valueType: AnalyticsValueType;
  hasLabel: boolean;
  hasRank: boolean;
};

export type AnalyticsRegistryFilterDescription = {
  kind: 'pushdown' | 'predicate';
  valueType: AnalyticsValueType;
  ops: readonly TAnalyticsFilterOp[];
  allowedValues?: readonly string[];
};

export type AnalyticsRegistrySourceDescription = {
  id: TAnalyticsSource;
  scopeTypes: readonly TAnalyticsScopeType[];
  dimensions: Record<string, AnalyticsRegistryDimensionDescription>;
  metrics: Record<string, AnalyticsRegistryMetricDescription>;
  filters: Record<string, AnalyticsRegistryFilterDescription>;
  hasSearch: boolean;
};

export type AnalyticsRegistryDescription = Record<TAnalyticsSource, AnalyticsRegistrySourceDescription>;

/**
 * What each source supports, read from the same definitions the compiler enforces. Catalogs built from it can
 * never drift from the queries the compiler accepts.
 */
export function describeAnalyticsRegistry(): AnalyticsRegistryDescription {
  const description: AnalyticsRegistryDescription = {} as AnalyticsRegistryDescription;

  for (const source of Object.values(ANALYTICS_REGISTRY)) {
    const dimensions: Record<string, AnalyticsRegistryDimensionDescription> = {};
    for (const [id, definition] of Object.entries(source.dimensions)) {
      dimensions[id] = {
        valueType: definition.valueType,
        hasLabel: Boolean(definition.label),
        hasRank: Boolean(definition.rank)
      };
    }

    const metrics: Record<string, AnalyticsRegistryMetricDescription> = {};
    for (const [metric, definition] of Object.entries(source.metrics)) {
      metrics[metric] = { valueType: definition.valueType, aggs: definition.aggs };
    }

    const filters: Record<string, AnalyticsRegistryFilterDescription> = {};
    for (const [field, definition] of Object.entries(source.filters)) {
      if (definition.kind === 'pushdown') {
        filters[field] = { kind: 'pushdown', valueType: 'id', ops: ['eq', 'in'] };
        continue;
      }

      filters[field] = {
        kind: 'predicate',
        valueType: definition.valueType,
        ops: definition.ops,
        ...(definition.allowedValues ? { allowedValues: definition.allowedValues } : {})
      };
    }

    description[source.id] = {
      id: source.id,
      scopeTypes: source.scopeTypes,
      dimensions,
      metrics,
      filters,
      hasSearch: Boolean(source.searchColumns?.length)
    };
  }

  return description;
}
