import { Hono } from '@api/utils/hono';
import { publicApiKeyMiddleware } from '@api/middlewares/public-api-key';
import { zValidator } from '@hono/zod-validator';
import { handleError } from '@api/utils/errors';
import {
  ZListCoursesPublic,
  ZCreateCoursePublic,
  ZUpdateCoursePublic,
  ZCourseIdParam
} from '@cio/utils/validation/public-api-key';
import { getCourse, createCourse, updateCourse, deleteCourse } from '@api/services/course/course';
import { getCoursesByOrgId } from '@api/services/organization';
import { listCourseMembers } from '@api/services/course/people';
import { AppError, ErrorCodes } from '@api/utils/errors';
import * as z from 'zod';
import { ROLE } from '@cio/utils/constants';

async function validateCourseOwnership(courseId: string, orgId: string) {
  const orgCourses = await getCoursesByOrgId(orgId);
  const course = orgCourses.find((c) => c.id === courseId);
  if (!course) {
    throw new AppError('Course not found or does not belong to your organization', ErrorCodes.COURSE_NOT_FOUND, 404);
  }
  return course;
}

export const coursesRouter = new Hono()
  .get('/', publicApiKeyMiddleware, zValidator('query', ZListCoursesPublic), async (c) => {
    const orgId = c.get('orgId')!;
    const { page, limit } = c.req.valid('query');

    try {
      const courses = await getCoursesByOrgId(orgId);
      const total = courses.length;
      const totalPages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      const paginatedCourses = courses.slice(start, start + limit);

      return c.json(
        {
          success: true,
          data: paginatedCourses.map((course) => ({
            id: course.id,
            title: course.title,
            slug: course.slug,
            description: course.description || '',
            courseType: course.type || 'SELF_PACED',
            isPublished: course.isPublished || false,
            createdAt: course.createdAt
          })),
          pagination: {
            page,
            limit,
            total,
            totalPages
          }
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to list courses');
    }
  })
  .post('/', publicApiKeyMiddleware, zValidator('json', ZCreateCoursePublic), async (c) => {
    const orgId = c.get('orgId')!;
    const data = c.req.valid('json');
    const createdByProfileId = c.get('createdByProfileId')!;

    try {
      const result = await createCourse(createdByProfileId, {
        title: data.title,
        description: data.description || '',
        type: data.courseType || 'SELF_PACED',
        organizationId: orgId
      });

      return c.json(
        {
          success: true,
          data: {
            id: result.course.id,
            title: result.course.title,
            slug: result.course.slug,
            description: result.course.description || '',
            courseType: result.course.type || 'SELF_PACED',
            isPublished: result.course.isPublished || false,
            createdAt: result.course.createdAt
          }
        },
        201
      );
    } catch (error) {
      return handleError(c, error, 'Failed to create course');
    }
  })
  .get('/:courseId', publicApiKeyMiddleware, zValidator('param', ZCourseIdParam), async (c) => {
    const orgId = c.get('orgId')!;
    const { courseId } = c.req.valid('param');

    try {
      const course = await validateCourseOwnership(courseId, orgId);

      return c.json(
        {
          success: true,
          data: {
            id: course.id,
            title: course.title,
            slug: course.slug,
            description: course.description || '',
            courseType: course.type || 'SELF_PACED',
            isPublished: course.isPublished || false,
            createdAt: course.createdAt
          }
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to fetch course');
    }
  })
  .put(
    '/:courseId',
    publicApiKeyMiddleware,
    zValidator('param', ZCourseIdParam),
    zValidator('json', ZUpdateCoursePublic),
    async (c) => {
      const orgId = c.get('orgId')!;
      const { courseId } = c.req.valid('param');
      const data = c.req.valid('json');

      try {
        await validateCourseOwnership(courseId, orgId);

        const updated = await updateCourse(courseId, {
          title: data.title,
          slug: data.slug,
          description: data.description,
          type: data.courseType
        });

        return c.json(
          {
            success: true,
            data: {
              id: updated.id,
              title: updated.title,
              slug: updated.slug,
              description: updated.description || '',
              courseType: updated.type || 'SELF_PACED',
              isPublished: updated.isPublished || false,
              updatedAt: updated.updatedAt
            }
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to update course');
      }
    }
  )
  .delete('/:courseId', publicApiKeyMiddleware, zValidator('param', ZCourseIdParam), async (c) => {
    const orgId = c.get('orgId')!;
    const { courseId } = c.req.valid('param');

    try {
      await validateCourseOwnership(courseId, orgId);
      await deleteCourse(courseId);

      return c.json(
        {
          success: true,
          message: 'Course deleted successfully'
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to delete course');
    }
  })
  .get('/:courseId/export', publicApiKeyMiddleware, zValidator('param', ZCourseIdParam), async (c) => {
    const orgId = c.get('orgId')!;
    const { courseId } = c.req.valid('param');

    try {
      // Verify ownership first
      await validateCourseOwnership(courseId, orgId);
      
      // Then get full course with content
      const course = await getCourse(courseId);
      if (!course) {
        throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
      }

      return c.json(
        {
          success: true,
          data: {
            id: course.id,
            title: course.title,
            slug: course.slug,
            description: course.description || '',
            courseType: course.type || 'SELF_PACED',
            overview: course.overview || '',
            content: course.content,
            metadata: course.metadata,
            createdAt: course.createdAt,
            updatedAt: course.updatedAt
          }
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to export course');
    }
  })
  .get('/:courseId/students', publicApiKeyMiddleware, zValidator('param', ZCourseIdParam), zValidator('query', z.object({ page: z.coerce.number().default(1), limit: z.coerce.number().default(20) })), async (c) => {
    const orgId = c.get('orgId')!;
    const { courseId } = c.req.valid('param');
    const { page = 1, limit = 20 } = c.req.valid('query');

    try {
      await validateCourseOwnership(courseId, orgId);

      const members = await listCourseMembers(courseId);
      const studentMembers = members.filter((m) => m.roleId === ROLE.STUDENT);
      const total = studentMembers.length;
      const totalPages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      const paginatedMembers = studentMembers.slice(start, start + limit);

      return c.json(
        {
          success: true,
          data: paginatedMembers.map((member) => ({
            id: member.id,
            email: member.profile?.email,
            fullname: member.profile?.fullname,
            username: member.profile?.username,
            joinedAt: member.createdAt
          })),
          pagination: {
            page,
            limit,
            total,
            totalPages
          }
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to list course students');
    }
  });

