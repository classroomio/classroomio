import { ZPublicCourseBySlugParam, ZPublicCourseItemParam } from '@cio/utils/validation/course';
import { getPublicCourseItemService, getPublicCourseTreeService } from '@api/services/course/public-course';

import { Hono } from '@api/utils/hono';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

/**
 * Anonymous-safe (no auth middleware) routes that back the `(org-site)/course/[slug]`
 * surface in the dashboard. Every response returns a single typed shape per the
 * repo's single-response-shape rule; the item endpoint uses a `kind` discriminator.
 */
export const publicCourseRouter = new Hono()
  .get('/:courseSlug', zValidator('param', ZPublicCourseBySlugParam), async (c) => {
    try {
      const { courseSlug } = c.req.valid('param');
      const tree = await getPublicCourseTreeService(courseSlug);

      if (!tree) {
        return c.json(
          {
            success: false as const,
            error: 'Public course not found',
            code: 'COURSE_NOT_FOUND'
          },
          404
        );
      }

      return c.json({ success: true as const, data: tree });
    } catch (error) {
      return handleError(c, error, 'Failed to load public course');
    }
  })
  .get('/:courseSlug/item/:itemSlug', zValidator('param', ZPublicCourseItemParam), async (c) => {
    try {
      const { courseSlug, itemSlug } = c.req.valid('param');
      const item = await getPublicCourseItemService(courseSlug, itemSlug);

      if (!item) {
        return c.json(
          {
            success: false as const,
            error: 'Public course item not found',
            code: 'NOT_FOUND'
          },
          404
        );
      }

      return c.json({ success: true as const, data: item });
    } catch (error) {
      return handleError(c, error, 'Failed to load public course item');
    }
  });
