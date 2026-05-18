import { Hono } from '@api/utils/hono';
import { apiKeyMiddleware } from '@api/middlewares/api-key';
import { handleError } from '@api/utils/errors';
import { runAnalyticsRollupDaily } from '@cio/analytics';

export const internalAnalyticsRouter = new Hono().post('/rollup-daily', apiKeyMiddleware, async (c) => {
  try {
    const daysAgoHeader = c.req.query('daysAgo');
    const daysAgo = daysAgoHeader ? Number(daysAgoHeader) : 1;
    const result = await runAnalyticsRollupDaily({
      daysAgo: Number.isFinite(daysAgo) && daysAgo > 0 ? daysAgo : 1
    });

    return c.json({ success: true, data: result }, 200);
  } catch (error) {
    return handleError(c, error, 'Failed to run analytics rollup');
  }
});
