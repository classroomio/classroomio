import type { TInsightsSource } from '@cio/utils/constants/insights';

import type { InsightsSourceDefinition } from './types';
import { assessmentResultSource } from './sources/assessment-result';
import { cohortSummarySource } from './sources/cohort-summary';
import { learnerSource } from './sources/learner';
import { learnerCourseSource } from './sources/learner-course';
import { lessonProgressSource } from './sources/lesson-progress';
import { loginDaySource } from './sources/login-day';
import { orgMemberSource } from './sources/org-member';
import { overdueItemSource } from './sources/overdue-item';
import { overdueLearnerSource } from './sources/overdue-learner';
import { questionResultSource } from './sources/question-result';
import { sectionActivitySource } from './sources/section-activity';

export const INSIGHTS_REGISTRY: Record<TInsightsSource, InsightsSourceDefinition> = {
  learner: learnerSource,
  learner_course: learnerCourseSource,
  assessment_result: assessmentResultSource,
  section_activity: sectionActivitySource,
  question_result: questionResultSource,
  lesson_progress: lessonProgressSource,
  login_day: loginDaySource,
  overdue_item: overdueItemSource,
  org_member: orgMemberSource,
  cohort_summary: cohortSummarySource,
  overdue_learner: overdueLearnerSource
};
