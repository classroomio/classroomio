import { Hono } from '@api/utils/hono';
import { v1LearnerAnalyticsRouter } from './learners';
import { v1OrgAnalyticsRouter } from './analytics';

export const v1AnalyticsRouter = new Hono()
  .route('/learners', v1LearnerAnalyticsRouter)
  .route('/', v1OrgAnalyticsRouter);
