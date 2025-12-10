import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { ZTemplateById, ZTemplateByTag } from '@cio/utils/validation/mocks';

import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';
import { handleGetAllTemplatesMetadata, handleGetTemplateById, handleGetTemplateByTag } from '@api/services/template';

export const templateRouter = new Hono()
  .get('/', authMiddleware, async (c) => {
    try {
      const result = await handleGetAllTemplatesMetadata();

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load template metadata');
    }
  })
  .get('/:id', authMiddleware, zValidator('param', ZTemplateById), async (c) => {
    try {
      const { id } = c.req.valid('param');

      const result = await handleGetTemplateById(id);
      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load template');
    }
  })
  .get('/tag/:tag', authMiddleware, zValidator('param', ZTemplateByTag), async (c) => {
    try {
      const { tag } = c.req.valid('param');

      const result = await handleGetTemplateByTag(tag);
      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load template');
    }
  });
