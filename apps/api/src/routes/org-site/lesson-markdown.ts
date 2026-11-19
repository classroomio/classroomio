import { ZPublicCourseItemParam } from '@cio/utils/validation/course';
import { getPublicLessonMarkdownService } from '@api/services/course/public-course';

import { Hono } from '@api/utils/hono';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';
import * as z from 'zod';

const ZPublicLessonMarkdownParam = z.preprocess((value) => {
  if (typeof value !== 'object' || value === null) return value;

  const params = value as Record<string, unknown>;
  const rawItemSlug = params.itemSlug ?? params['itemSlug.md'];

  return {
    ...params,
    itemSlug: typeof rawItemSlug === 'string' ? rawItemSlug.replace(/\.md$/, '') : rawItemSlug
  };
}, ZPublicCourseItemParam);

/**
 * Anonymous-safe Markdown export for public lessons.
 * Mounted on the org-site public course router so the bookmarkable
 * `/course/:slug/lesson/:itemSlug.md` dashboard proxy can fetch it
 * without a session.
 */
export const lessonMarkdownRouter = new Hono().get(
  '/:courseSlug/item/:itemSlug{[a-z0-9-]+\\.md}',
  zValidator('param', ZPublicLessonMarkdownParam),
  async (c) => {
    try {
      const { courseSlug, itemSlug } = c.req.valid('param');
      const markdown = await getPublicLessonMarkdownService(courseSlug, itemSlug);

      if (markdown == null) {
        return c.json(
          {
            success: false as const,
            error: 'Markdown export is not available for this lesson',
            code: 'NOT_FOUND'
          },
          404
        );
      }

      return c.body(markdown, 200, {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'private, no-store'
      });
    } catch (error) {
      return handleError(c, error, 'Failed to export lesson markdown');
    }
  }
);
