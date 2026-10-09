import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { courseTeamMemberMiddleware } from '@api/middlewares/course-team-member';
import { AppError, ErrorCodes, handleError } from '@api/utils/errors';
import { getCourseSectionById, getCourseSectionsByCourseId } from '@cio/db/queries/course';
import {
  createCourseSection,
  deleteCourseSectionService,
  promoteUngroupedSection,
  reorderCourseSections,
  updateCourseSectionService
} from '@cio/core/services/course/section';
import {
  ZCourseSectionCreate,
  ZCourseSectionGetParam,
  ZCourseSectionPromoteUngrouped,
  ZCourseSectionReorder,
  ZCourseSectionUpdate
} from '@cio/utils/validation/course/section';
import { zValidator } from '@hono/zod-validator';

export const sectionRouter = new Hono()
  .post('/', authMiddleware, courseTeamMemberMiddleware, zValidator('json', ZCourseSectionCreate), async (c) => {
    try {
      const courseId = c.req.param('courseId')!;
      const data = c.req.valid('json');

      const section = await createCourseSection(courseId, { ...data, courseId });

      return c.json({ success: true, data: section }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to create course section');
    }
  })
  .post(
    '/promote-ungrouped',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('json', ZCourseSectionPromoteUngrouped),
    async (c) => {
      try {
        const courseId = c.req.param('courseId')!;
        const data = c.req.valid('json');

        const result = await promoteUngroupedSection(courseId, data);

        return c.json({ success: true, data: result }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to promote ungrouped section');
      }
    }
  )
  .put(
    '/:sectionId',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZCourseSectionGetParam),
    zValidator('json', ZCourseSectionUpdate),
    async (c) => {
      try {
        const courseId = c.req.param('courseId')!;
        const { sectionId } = c.req.valid('param');
        const data = c.req.valid('json');

        const existing = await getCourseSectionById(sectionId);
        if (!existing || existing.courseId !== courseId) {
          throw new AppError('Course section not found', ErrorCodes.COURSE_SECTION_NOT_FOUND, 404);
        }

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
    courseTeamMemberMiddleware,
    zValidator('param', ZCourseSectionGetParam),
    async (c) => {
      try {
        const courseId = c.req.param('courseId')!;
        const { sectionId } = c.req.valid('param');

        const existing = await getCourseSectionById(sectionId);
        if (!existing || existing.courseId !== courseId) {
          throw new AppError('Course section not found', ErrorCodes.COURSE_SECTION_NOT_FOUND, 404);
        }

        const section = await deleteCourseSectionService(sectionId);

        return c.json({ success: true, data: section }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to delete course section');
      }
    }
  )
  .post(
    '/reorder',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('json', ZCourseSectionReorder),
    async (c) => {
      try {
        const courseId = c.req.param('courseId')!;
        const { sections } = c.req.valid('json');

        const courseSections = await getCourseSectionsByCourseId(courseId);
        const courseSectionIds = new Set(courseSections.map((section) => section.id));
        const ownsEverySection = sections.every((section) => courseSectionIds.has(section.id));
        if (!ownsEverySection) {
          throw new AppError('Course section not found', ErrorCodes.COURSE_SECTION_NOT_FOUND, 404);
        }

        const updated = await reorderCourseSections(sections);

        return c.json({ success: true, data: updated }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to reorder course sections');
      }
    }
  );
