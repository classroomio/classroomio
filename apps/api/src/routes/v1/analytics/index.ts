import { Hono } from '@api/utils/hono';
import { ORG_ANALYTICS_PAGE } from '@cio/utils/constants/analytics-pages';
import { v1ComplianceRouter } from './compliance';
import { v1MarketingRouter } from './marketing';
import { v1OrgAnalyticsPageRouter } from './org-analytics-page';

export const v1AnalyticsRouter = new Hono()
  .route(`/${ORG_ANALYTICS_PAGE.slug}`, v1OrgAnalyticsPageRouter)
  .route('/marketing', v1MarketingRouter)
  .route('/compliance', v1ComplianceRouter);
