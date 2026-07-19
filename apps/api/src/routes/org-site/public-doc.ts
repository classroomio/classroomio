import { ZPublicDocBySlugParam, ZPublicDocQuery } from '@cio/utils/validation/docs';
import { getPublicDocService } from '@api/services/docs/public-doc';
import { Hono } from '@api/utils/hono';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

export const publicDocRouter = new Hono().get(
  '/:docSlug',
  zValidator('param', ZPublicDocBySlugParam),
  zValidator('query', ZPublicDocQuery),
  async (c) => {
    try {
      const { docSlug } = c.req.valid('param');
      const { siteName } = c.req.valid('query');
      const note = await getPublicDocService(siteName, docSlug);

      if (!note) {
        return c.json(
          {
            success: false as const,
            error: 'Public note not found',
            code: 'DOC_NOT_FOUND'
          },
          404
        );
      }

      return c.json({ success: true as const, data: note });
    } catch (error) {
      return handleError(c, error, 'Failed to load public note');
    }
  }
);
