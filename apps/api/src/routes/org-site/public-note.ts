import { ZPublicNoteBySlugParam, ZPublicNoteQuery } from '@cio/utils/validation/notes';
import { getPublicNoteService } from '@api/services/notes/public-note';
import { Hono } from '@api/utils/hono';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

export const publicNoteRouter = new Hono().get(
  '/:noteSlug',
  zValidator('param', ZPublicNoteBySlugParam),
  zValidator('query', ZPublicNoteQuery),
  async (c) => {
    try {
      const { noteSlug } = c.req.valid('param');
      const { siteName } = c.req.valid('query');
      const note = await getPublicNoteService(siteName, noteSlug);

      if (!note) {
        return c.json(
          {
            success: false as const,
            error: 'Public note not found',
            code: 'NOTE_NOT_FOUND'
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
