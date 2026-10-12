import { Hono } from '@api/utils/hono';
import { createComplianceStudentsRouter, v1OrgAnalyticsRouter } from './analytics';
import { v1CourseAnalyticsRouter } from './courses';
import { createStudentAnalyticsRouter } from './students';

export const v1AnalyticsRouter = new Hono()
  .route('/', v1OrgAnalyticsRouter)
  .route('/compliance/students', createComplianceStudentsRouter())
  .route('/courses/:courseId', v1CourseAnalyticsRouter)
  .route('/students', createStudentAnalyticsRouter())
  .route('/compliance/learners', createComplianceStudentsRouter({ isDeprecatedAlias: true }))
  .route('/learners', createStudentAnalyticsRouter({ isDeprecatedAlias: true }));
