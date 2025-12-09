import { Hono } from '@api/utils/hono';
import { ZMock } from '@cio/utils/validation/mocks';
import { authMiddleware } from '@api/middlewares/auth';

import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';
import { handleGetAllTemplatesMetadata, handleGetTemplateById } from '@api/services/mocks';

// NOTE: i'm unsure if you want these requests to be authorized...
export const mocksRouter = new Hono()
  .get('/', authMiddleware, async (c) => {
    try {
      const result = await handleGetAllTemplatesMetadata();

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load template metadata');
    }
  })
  .get('/:id', authMiddleware, zValidator('param', ZMock), async (c) => {
    try {
      const { id } = c.req.valid('param');

      const result = await handleGetTemplateById(id);
      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load template');
    }
  });
