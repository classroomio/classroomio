import type { CloneCourseErrorResponse, CloneCourseResponse } from '@api/types/database';

import { Hono } from '@api/utils/hono';
import { ZCourseClone } from '@cio/utils/validation/course';
import { authMiddleware } from '@api/middlewares/auth';
import { cloneCourse } from '@api/services/course/clone';
import { zValidator } from '@hono/zod-validator';

export const cloneRouter = new Hono().post('/', authMiddleware, zValidator('json', ZCourseClone), async (c) => {
  try {
    const validatedData = c.req.valid('json');
    const { id, title, description, slug, organizationId } = validatedData;

    const user = c.get('user');

    // Clone the course
    const newCourse = await cloneCourse(id, title, user.id, description, slug, organizationId);

    const successResponse: CloneCourseResponse = {
      success: true,
      course: newCourse
    };
    return c.json(successResponse, 200);
  } catch (error) {
    console.error('Error cloning course:', error);
    const errorResponse: CloneCourseErrorResponse = {
      error: 'Failed to clone course',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
    return c.json(errorResponse, 500);
  }
});
