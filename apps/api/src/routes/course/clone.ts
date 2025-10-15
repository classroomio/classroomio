import { Hono } from 'hono';
import { ZCourseClone } from '$src/types/course';
import { zValidator } from '@hono/zod-validator';
import { cloneCourse } from '$src/services/course-clone';
import { validateUser } from '$src/utils/auth/validate-user';
import type { CloneCourseResponse, CloneCourseErrorResponse } from '$src/types/database';
import type { User } from '@supabase/supabase-js';
import type { TCourseClone } from '$src/types/course';

export const cloneRouter = new Hono().post(
  '/',
  zValidator('json', ZCourseClone),
  async (c) => {
    try {
      
      const validatedData = (c.req.valid as (key: 'json') => TCourseClone)('json');
      const { courseId, newTitle, newDescription, newSlug, organizationId } = validatedData;

      // Get the authorization header
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        const errorResponse: CloneCourseErrorResponse = { error: 'Unauthorized' };
        return c.json(errorResponse, 401);
      }

      // Extract the token
      const token = authHeader.replace('Bearer ', '');

      // Validate user and get their ID
      let user: User;
      try {
        user = await validateUser(token);
      } catch (err) {
        const errorResponse: CloneCourseErrorResponse = { 
          error: 'Invalid authentication token',
          details: err instanceof Error ? err.message : 'Unknown error'
        };
        return c.json(errorResponse, 401);
      }

      if (!user || !user.id) {
        const errorResponse: CloneCourseErrorResponse = { error: 'User not found' };
        return c.json(errorResponse, 401);
      }

      // Clone the course
      const newCourse = await cloneCourse(
        courseId,
        newTitle,
        user.id,
        newDescription,
        newSlug,
        organizationId
      );

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
