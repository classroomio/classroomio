import type { TInsightsSource } from '@cio/utils/constants/insights';

import type { InsightsSourceDefinition } from './types';
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
