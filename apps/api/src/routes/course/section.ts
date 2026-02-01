import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { courseMemberMiddleware } from '@api/middlewares/course-member';
import { handleError } from '@api/utils/errors';
import {
  createCourseSection,
  deleteCourseSectionService,
  reorderCourseSections,
  updateCourseSectionService
} from '@api/services/course/section';
import {
  ZCourseSectionCreate,
  ZCourseSectionGetParam,
  ZCourseSectionReorder,
  ZCourseSectionUpdate
} from '@cio/utils/validation/course/section';
import { zValidator } from '@hono/zod-validator';

export const sectionRouter = new Hono()
  .post('/', authMiddleware, courseMemberMiddleware, zValidator('json', ZCourseSectionCreate), async (c) => {
    try {
      const courseId = c.req.param('courseId')!;
      const data = c.req.valid('json');

      const section = await createCourseSection(courseId, { ...data, courseId });

      return c.json({ success: true, data: section }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to create course section');
    }
  })
  .put(
    '/:sectionId',
    authMiddleware,
    courseMemberMiddleware,
    zValidator('param', ZCourseSectionGetParam),
    zValidator('json', ZCourseSectionUpdate),
    async (c) => {
      try {
        const { sectionId } = c.req.valid('param');
        const data = c.req.valid('json');

        const section = await updateCourseSectionService(sectionId, data);

        return c.json({ success: true, data: section }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update course section');
      }
    }
  )
  .delete(
    '/:sectionId',
    authMiddleware,
    courseMemberMiddleware,
    zValidator('param', ZCourseSectionGetParam),
    async (c) => {
      try {
        const { sectionId } = c.req.valid('param');
        const section = await deleteCourseSectionService(sectionId);

        return c.json({ success: true, data: section }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to delete course section');
      }
    }
  )
  .post('/reorder', authMiddleware, courseMemberMiddleware, zValidator('json', ZCourseSectionReorder), async (c) => {
    try {
      const { sections } = c.req.valid('json');

      const updated = await reorderCourseSections(sections);

      return c.json({ success: true, data: updated }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to reorder course sections');
    }
  });
