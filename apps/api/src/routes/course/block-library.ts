import * as z from 'zod';

import { ZBlockLibraryQuery } from '@cio/utils/validation/block';
import { getBlockUsageList, listBlockLibrary } from '@cio/core/services/block/block';
import { getCourseOrganizationId } from '@cio/db/queries/tag';

import { Hono } from '@api/utils/hono';
import { AppError, ErrorCodes, handleError } from '@api/utils/errors';
import { authMiddleware } from '@api/middlewares/auth';
import { courseTeamMemberMiddleware } from '@api/middlewares/course-team-member';
import { zValidator } from '@hono/zod-validator';

const ZLibraryBlockParam = z.object({ blockId: z.uuid() });

async function resolveCourseOrganizationId(courseId: string): Promise<string> {
  const organizationId = await getCourseOrganizationId(courseId);
  if (!organizationId) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  return organizationId;
}

export const blockLibraryRouter = new Hono()
  .get('/', authMiddleware, courseTeamMemberMiddleware, zValidator('query', ZBlockLibraryQuery), async (c) => {
    try {
      const organizationId = await resolveCourseOrganizationId(c.req.param('courseId')!);
      const query = c.req.valid('query');

      const library = await listBlockLibrary(organizationId, query);

      return c.json({ success: true, data: library }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to list blocks');
    }
  })
  .get(
    '/:blockId/usages',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZLibraryBlockParam),
    async (c) => {
      try {
        const organizationId = await resolveCourseOrganizationId(c.req.param('courseId')!);
        const { blockId } = c.req.valid('param');

        const usages = await getBlockUsageList(organizationId, blockId);

        return c.json({ success: true, data: usages }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to list block usages');
      }
    }
  );
