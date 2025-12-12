import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { ZTemplateById, ZTemplateByTag } from '@cio/utils/validation/mocks';

import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';
import { fetchAllTemplatesMetadata, fetchTemplateById, fetchTemplatesByTag } from '@api/services/template';

export const exerciseRouter = new Hono()
  .get('/template', authMiddleware, async (c) => {
    try {
      const result = await fetchAllTemplatesMetadata();

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load template metadata');
    }
  })
  .get('/template/:id', authMiddleware, zValidator('param', ZTemplateById), async (c) => {
    try {
      const { id } = c.req.valid('param');

      const result = await fetchTemplateById(id);
      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load template');
    }
  })
  .get('/template/tag/:tag', authMiddleware, zValidator('param', ZTemplateByTag), async (c) => {
    try {
      const { tag } = c.req.valid('param');

      const result = await fetchTemplatesByTag(tag);
      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load template');
    }
  });
