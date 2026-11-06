import { Hono } from '@api/utils/hono';
import { v1LearnerAnalyticsRouter } from './learners';
import { v1OrgAnalyticsRouter } from './analytics';
import { v1AnalyticsInsightsRouter } from './insights';

export const v1AnalyticsRouter = new Hono()
  .route('/insights', v1AnalyticsInsightsRouter)
  .route('/learners', v1LearnerAnalyticsRouter)
  .route('/', v1OrgAnalyticsRouter);
