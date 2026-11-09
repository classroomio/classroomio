import { Context, Next } from 'hono';

import { ErrorCodes } from '@api/utils/errors';
import { getLessonRowById } from '@cio/db/queries/lesson';

/**
 * Rejects requests whose `:lessonId` does not belong to the route's `:courseId`.
 * Apply after the course role middleware: that one authorizes the course in the URL,
 * and this one keeps the request inside that course.
 */
export const lessonInCourseMiddleware = async (c: Context, next: Next) => {
  try {
    const courseId = c.req.param('courseId');
    const lessonId = c.req.param('lessonId');
    const lesson = lessonId ? await getLessonRowById(lessonId) : null;

    if (lesson && courseId && lesson.courseId === courseId) {
      return next();
    }

    return c.json({ success: false, error: 'Lesson not found', code: ErrorCodes.LESSON_NOT_FOUND }, 404);
  } catch (error) {
    console.error('Error in lessonInCourseMiddleware:', error);
    return c.json({ success: false, error: 'Failed to verify lesson', code: ErrorCodes.INTERNAL_ERROR }, 500);
  }
};
