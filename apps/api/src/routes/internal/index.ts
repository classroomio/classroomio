import { Hono } from '@api/utils/hono';
import { internalAccountRouter } from './account';
import { internalAnalyticsRouter } from './analytics';
import { internalComplianceRouter } from './compliance';
import { internalEncoderRouter } from './encoder';
import { internalModerationRouter } from './moderation';
import { internalPluginsRouter } from './plugins';
import { internalPluginReleasesRouter } from './plugin-releases';

export const internalRouter = new Hono()
  .route('/compliance', internalComplianceRouter)
  .route('/analytics', internalAnalyticsRouter)
  .route('/account', internalAccountRouter)
  .route('/moderation', internalModerationRouter)
  .route('/plugins', internalPluginsRouter)
  .route('/plugin-releases', internalPluginReleasesRouter)
  .route('/encoder', internalEncoderRouter);
