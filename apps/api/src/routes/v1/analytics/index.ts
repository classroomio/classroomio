import { Hono } from '@api/utils/hono';
import { v1OrgAnalyticsRouter } from './analytics';

export const v1AnalyticsRouter = new Hono().route('/', v1OrgAnalyticsRouter);
