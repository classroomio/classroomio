import {
  ZCertificateDownload,
  ZCourseClone,
  ZCourseCloneParam,
  ZCourseDownloadContent,
  ZCourseDownloadParam,
  ZCourseGetParam
} from '@cio/utils/validation/course';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { cloneCourse } from '@api/services/course/clone';
import { courseMemberMiddleware } from '@api/middlewares/course-member';
import { generateCertificate } from '@api/utils/certificate';
import { generateCoursePdf } from '@api/utils/course';
import { getCourse } from '@api/services/course/course';
import { handleError } from '@api/utils/errors';
import { katexRouter } from '@api/routes/course/katex';
import { lessonRouter } from '@api/routes/course/lesson';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { presignRouter } from '@api/routes/course/presign';
import { zValidator } from '@hono/zod-validator';

export const courseRouter = new Hono()
  /**
   * GET /course/:courseId
   * Gets a course by ID with all related data (group, members, lessons, sections, attendance)
   * Requires authentication and course membership
   */
  .get('/:courseId', authMiddleware, courseMemberMiddleware, zValidator('param', ZCourseGetParam), async (c) => {
    try {
      const { courseId } = c.req.valid('param');
      const course = await getCourse(courseId);

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
  })
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

        const user = c.get('user');

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
  .route('/:courseId/lesson', lessonRouter)
  .route('/presign', presignRouter);
