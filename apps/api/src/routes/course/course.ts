import {
  ZCertificateDownload,
  ZCourseClone,
  ZCourseCloneParam,
  ZCourseCreate,
  ZCourseDeleteParam,
  ZCourseDownloadContent,
  ZCourseDownloadParam,
  ZCourseGetBySlugParam,
  ZCourseGetParam,
  ZCourseGetQuery,
  ZCourseProgressParam,
  ZCourseProgressQuery,
  ZCourseUpdate,
  ZCourseUpdateParam
} from '@cio/utils/validation/course';
import {
  createCourse,
  deleteCourse,
  getCourse,
  getCourseAnalytics,
  getCourseProgress,
  updateCourse
} from '@api/services/course/course';

import { Hono } from '@api/utils/hono';
import { attendanceRouter } from '@api/routes/course/attendance';
import { authMiddleware } from '@api/middlewares/auth';
import { cloneCourse } from '@api/services/course/clone';
import { courseMemberMiddleware } from '@api/middlewares/course-member';
import { contentRouter } from '@api/routes/course/content';
import { exerciseRouter } from '@api/routes/course/exercise';
import { generateCertificate } from '@api/utils/certificate';
import { generateCoursePdf } from '@api/utils/course';
import { handleError } from '@api/utils/errors';
import { katexRouter } from '@api/routes/course/katex';
import { lessonRouter } from '@api/routes/course/lesson';
import { markRouter } from '@api/routes/course/mark';
import { sectionRouter } from '@api/routes/course/section';
import { membersRouter } from '@api/routes/course/people';
import { invitesRouter } from '@api/routes/course/invite';
import { newsfeedRouter } from '@api/routes/course/newsfeed';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { paymentRequestRouter } from '@api/routes/course/payment-request';
import { presignRouter } from '@api/routes/course/presign';
import { submissionRouter } from '@api/routes/course/submission';
import { zValidator } from '@hono/zod-validator';

export const courseRouter = new Hono()
  /**
   * GET /course/slug/:slug
   * Gets a course by slug (public route, no authentication required)
   * Used for public course landing pages
   */
  .get('/slug/:slug', zValidator('param', ZCourseGetBySlugParam), async (c) => {
    try {
      const { slug } = c.req.valid('param');
      const course = await getCourse(undefined, slug);

      return c.json(
        {
          success: true,
          data: course
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to fetch course by slug');
    }
  })
  /**
   * POST /course
   * Creates a new course with group, group member, and default newsfeed
   * Requires authentication and organization membership
   */
  .post('/', authMiddleware, orgAdminMiddleware, zValidator('json', ZCourseCreate), async (c) => {
    try {
      const user = c.get('user')!;
      const validatedData = c.req.valid('json');

      const result = await createCourse(user.id, validatedData);

      return c.json(
        {
          success: true,
          data: result
        },
        201
      );
    } catch (error) {
      return handleError(c, error, 'Failed to create course');
    }
  })
  /**
   * GET /course/:courseId
   * Gets a course by ID or slug with all related data (group, members, lessons, sections, attendance)
   * Query param: slug (optional) - if provided, courseId is ignored and course is fetched by slug
   * Requires authentication and course membership
   */
  .get(
    '/:courseId',
    courseMemberMiddleware,
    zValidator('param', ZCourseGetParam),
    zValidator('query', ZCourseGetQuery),
    async (c) => {
      try {
        const { courseId } = c.req.valid('param');
        const { slug } = c.req.valid('query');
        const user = c.get('user')!;
        const course = await getCourse(slug ? undefined : courseId, slug, user.id);

        return c.json(
          {
            success: true,
            data: course
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to fetch course');
      }
    }
  )
  /**
   * PUT /course/:courseId
   * Updates a course
   * Requires authentication and course membership (admin/tutor role)
   */
  .put(
    '/:courseId',
    authMiddleware,
    courseMemberMiddleware,
    zValidator('param', ZCourseUpdateParam),
    zValidator('json', ZCourseUpdate),
    async (c) => {
      try {
        const { courseId } = c.req.valid('param');
        const validatedData = c.req.valid('json');

        const result = await updateCourse(courseId, validatedData);

        return c.json(
          {
            success: true,
            data: result
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to update course');
      }
    }
  )
  /**
   * DELETE /course/:courseId
   * Soft deletes a course by setting status to 'DELETED'
   * Requires authentication and course membership (admin/tutor role)
   */
  .delete('/:courseId', authMiddleware, courseMemberMiddleware, zValidator('param', ZCourseDeleteParam), async (c) => {
    try {
      const { courseId } = c.req.valid('param');
      const result = await deleteCourse(courseId);

      return c.json(
        {
          success: true,
          data: result
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to delete course');
    }
  })
  /**
   * GET /course/:courseId/progress
   * Gets course progress for a profile
   * Query param: profileId (required)
   * Requires authentication and course membership
   */
  .get(
    '/:courseId/progress',
    authMiddleware,
    courseMemberMiddleware,
    zValidator('param', ZCourseProgressParam),
    zValidator('query', ZCourseProgressQuery),
    async (c) => {
      try {
        const { courseId } = c.req.valid('param');
        const { profileId } = c.req.valid('query');
        const progress = await getCourseProgress(courseId, profileId);

        return c.json(
          {
            success: true,
            data: progress
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to fetch course progress');
      }
    }
  )
  /**
   * GET /course/:courseId/analytics
   * Gets course analytics including student progress, completion rates, and grades
   * Requires authentication and course membership (admin/tutor role)
   */
  .get(
    '/:courseId/analytics',
    authMiddleware,
    courseMemberMiddleware,
    zValidator('param', ZCourseProgressParam),
    async (c) => {
      try {
        const { courseId } = c.req.valid('param');
        const analytics = await getCourseAnalytics(courseId);

        return c.json(
          {
            success: true,
            data: analytics
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to fetch course analytics');
      }
    }
  )
  .post(
    '/:courseId/download/certificate',
    authMiddleware,
    courseMemberMiddleware,
    zValidator('param', ZCourseDownloadParam),
    zValidator('json', ZCertificateDownload),
    async (c) => {
      const validatedData = c.req.valid('json');

      const result = await generateCertificate(validatedData);

      c.header('Content-Type', 'application/pdf');
      c.header('Content-Disposition', `attachment; filename="certificate-${validatedData.courseName}.pdf"`);

      return c.body(
        new ReadableStream({
          start(controller) {
            controller.enqueue(result);
            controller.close();
          }
        })
      );
    }
  )
  .post(
    '/:courseId/download/content',
    authMiddleware,
    courseMemberMiddleware,
    zValidator('param', ZCourseDownloadParam),
    zValidator('json', ZCourseDownloadContent),
    async (c) => {
      const validatedData = c.req.valid('json');

      const pdfBuffer = await generateCoursePdf(validatedData);

      c.header('Content-Type', 'application/pdf');

      return c.body(
        new ReadableStream({
          start(controller) {
            controller.enqueue(pdfBuffer);
            controller.close();
          }
        })
      );
    }
  )
  .post(
    '/:courseId/clone',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZCourseCloneParam),
    zValidator('json', ZCourseClone),
    async (c) => {
      try {
        const { courseId } = c.req.valid('param');
        const validatedData = c.req.valid('json');
        const { title, description, slug, organizationId } = validatedData;

        const user = c.get('user')!;

        // Clone the course
        const newCourse = await cloneCourse(courseId, title, user.id, description, slug, organizationId);

        return c.json(
          {
            success: true,
            course: newCourse
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to clone course');
      }
    }
  )
  .route('/katex', katexRouter)
  .route('/:courseId/payment-request', paymentRequestRouter)
  .route('/:courseId/content', contentRouter)
  .route('/:courseId/section', sectionRouter)
  .route('/:courseId/lesson', lessonRouter)
  .route('/:courseId/exercise', exerciseRouter)
  .route('/:courseId/submission', submissionRouter)
  .route('/:courseId/attendance', attendanceRouter)
  .route('/:courseId/mark', markRouter)
  .route('/:courseId/newsfeed', newsfeedRouter)
  .route('/:courseId/members', membersRouter)
  .route('/:courseId/invites', invitesRouter)
  .route('/presign', presignRouter);
