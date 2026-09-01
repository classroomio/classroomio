import { ZContentReportIdParam, ZListContentReportsQuery, ZUpdateContentReport } from '@cio/utils/validation/report';
import { getModerationReport, listModerationReports, updateModerationReport } from '@api/services/report';

import { Hono } from '@api/utils/hono';
import { apiKeyMiddleware } from '@api/middlewares/api-key';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

export const internalModerationRouter = new Hono()
  .get('/reports', apiKeyMiddleware, zValidator('query', ZListContentReportsQuery), async (c) => {
    try {
      const query = c.req.valid('query');
      const data = await listModerationReports(query);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to list content reports');
    }
  })
  .get('/reports/:id', apiKeyMiddleware, zValidator('param', ZContentReportIdParam), async (c) => {
    try {
      const { id } = c.req.valid('param');
      const data = await getModerationReport(id);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load content report');
    }
  })
  .patch(
    '/reports/:id',
    apiKeyMiddleware,
    zValidator('param', ZContentReportIdParam),
    zValidator('json', ZUpdateContentReport),
    async (c) => {
      try {
        const { id } = c.req.valid('param');
        const payload = c.req.valid('json');
        const data = await updateModerationReport(id, payload);

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update content report');
      }
    }
  );
