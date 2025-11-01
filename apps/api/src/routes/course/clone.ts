import { Hono } from 'hono';
import { ZCourseClone, TCourseClone } from '$src/types/course';
import { zValidator } from '@hono/zod-validator';
import { cloneCourse } from '$src/services/course/clone';
import { authMiddleware } from '$src/middlewares/auth';
import type { CloneCourseResponse, CloneCourseErrorResponse } from '$src/types/database';
import type { User } from '@supabase/supabase-js';

type Variables = {
  user: User;
};

export const cloneRouter = new Hono<{ Variables: Variables }>().post(
  '/',
  authMiddleware,
  zValidator('json', ZCourseClone),
  async (c) => {
    try {
      const validatedData = (c.req.valid as (key: 'json') => TCourseClone)('json');
      const { id, title, description, slug, organizationId } = validatedData;

      // Get user from context (set by authMiddleware)
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
  }
);
