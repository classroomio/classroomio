import type {
  TInsightsAgg,
  TInsightsFilterOp,
  TInsightsScopeType,
  TInsightsSource
} from '@cio/utils/constants/insights';

import type { InsightsSourceDefinition, InsightsValueType } from './types';
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

export const INSIGHTS_REGISTRY: Record<TInsightsSource, InsightsSourceDefinition> = {
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

export type InsightsRegistryMetricDescription = {
  valueType: InsightsValueType;
  aggs: readonly TInsightsAgg[];
};

export type InsightsRegistryDimensionDescription = {
  valueType: InsightsValueType;
  hasLabel: boolean;
  hasRank: boolean;
};

export type InsightsRegistryFilterDescription = {
  kind: 'pushdown' | 'predicate';
  valueType: InsightsValueType;
  ops: readonly TInsightsFilterOp[];
  allowedValues?: readonly string[];
};

export type InsightsRegistrySourceDescription = {
  id: TInsightsSource;
  scopeTypes: readonly TInsightsScopeType[];
  dimensions: Record<string, InsightsRegistryDimensionDescription>;
  metrics: Record<string, InsightsRegistryMetricDescription>;
  filters: Record<string, InsightsRegistryFilterDescription>;
  hasSearch: boolean;
};

export type InsightsRegistryDescription = Record<TInsightsSource, InsightsRegistrySourceDescription>;

/**
 * What each source supports, read from the same definitions the compiler enforces. Catalogs built from it can
 * never drift from the queries the compiler accepts.
 */
export function describeInsightsRegistry(): InsightsRegistryDescription {
  const description: InsightsRegistryDescription = {} as InsightsRegistryDescription;

  for (const source of Object.values(INSIGHTS_REGISTRY)) {
    const dimensions: Record<string, InsightsRegistryDimensionDescription> = {};
    for (const [id, definition] of Object.entries(source.dimensions)) {
      dimensions[id] = {
        valueType: definition.valueType,
        hasLabel: Boolean(definition.label),
        hasRank: Boolean(definition.rank)
      };
    }

    const metrics: Record<string, InsightsRegistryMetricDescription> = {};
    for (const [metric, definition] of Object.entries(source.metrics)) {
      metrics[metric] = { valueType: definition.valueType, aggs: definition.aggs };
    }

    const filters: Record<string, InsightsRegistryFilterDescription> = {};
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
