import { Context, Hono } from 'hono';
import { validateUUIDs } from '../middleware/auth';
import {
  getCourse,
  getCourses,
  updateCourse,
  grantCourseAccess,
  getLessons,
  createLesson
} from '../service/course-service';
import { ZCourseUpdate, ZLessonCreate } from '$src/public/utils/validations';
import { getPaginationFromQuery, calculatePagination } from '$src/public/utils/pagination';

const coursesRouter = new Hono();

// Course Collection Routes
coursesRouter.get('/', async (c: Context) => {
  try {
    const organization = c.get('organization');
    const pagination = getPaginationFromQuery(c.req.query());

    const { data: courses, total } = await getCourses(organization.id, pagination);
    const paginationMeta = calculatePagination(pagination, total);

    return c.json({
      success: true,
      data: courses,
      meta: {
        version: 'v1',
        timestamp: new Date().toISOString(),
        pagination: paginationMeta
      }
    });
  } catch (error) {
    console.error('Error in GET /courses:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to fetch courses',
        meta: {
          version: 'v1',
          timestamp: new Date().toISOString()
        }
      },
      500
    );
  }
});

// Single Course Routes
coursesRouter.get('/:courseId', validateUUIDs(['courseId']), async (c: Context) => {
  try {
    const { courseId } = c.req.valid('param' as unknown as never) as { courseId: string };
    const organization = c.get('organization');

    const course = await getCourse(courseId, organization.id);
    if (!course) {
      return c.json(
        {
          success: false,
          error: 'Course not found',
          meta: {
            version: 'v1',
            timestamp: new Date().toISOString()
          }
        },
        404
      );
    }

    return c.json({
      success: true,
      data: course,
      meta: {
        version: 'v1',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in GET /courses/:courseId:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to fetch course',
        meta: {
          version: 'v1',
          timestamp: new Date().toISOString()
        }
      },
      500
    );
  }
});

coursesRouter.patch('/:courseId', validateUUIDs(['courseId']), async (c: Context) => {
  try {
    const { courseId } = c.req.valid('param' as unknown as never) as { courseId: string };
    const organization = c.get('organization');
    const updates = await c.req.json();

    // Validate updates with Zod schema
    const validatedUpdates = ZCourseUpdate.parse(updates);

    const course = await updateCourse(courseId, organization.id, validatedUpdates);
    if (!course) {
      return c.json(
        {
          success: false,
          error: 'Course not found',
          meta: {
            version: 'v1',
            timestamp: new Date().toISOString()
          }
        },
        404
      );
    }

    return c.json({
      success: true,
      data: course,
      meta: {
        version: 'v1',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      return c.json(
        {
          success: false,
          error: error.message,
          meta: {
            version: 'v1',
            timestamp: new Date().toISOString()
          }
        },
        400
      );
    }
    console.error('Error in PATCH /courses/:courseId:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to update course',
        meta: {
          version: 'v1',
          timestamp: new Date().toISOString()
        }
      },
      500
    );
  }
});

// Course Enrollments
coursesRouter.post('/:courseId/enrollments', validateUUIDs(['courseId']), async (c: Context) => {
  try {
    const { courseId } = c.req.valid('param' as unknown as never) as { courseId: string };
    const organization = c.get('organization');
    const { userId } = await c.req.json();

    if (!userId) {
      return c.json(
        {
          success: false,
          error: 'User ID is required',
          meta: {
            version: 'v1',
            timestamp: new Date().toISOString()
          }
        },
        400
      );
    }

    const success = await grantCourseAccess(courseId, userId, organization.id);
    if (!success) {
      return c.json(
        {
          success: false,
          error: 'Failed to enroll in course',
          meta: {
            version: 'v1',
            timestamp: new Date().toISOString()
          }
        },
        400
      );
    }

    return c.json({
      success: true,
      message: 'Successfully enrolled in course',
      meta: {
        version: 'v1',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      return c.json(
        {
          success: false,
          error: error.message,
          meta: {
            version: 'v1',
            timestamp: new Date().toISOString()
          }
        },
        400
      );
    }
    console.error('Error in POST /courses/:courseId/enrollments:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to process enrollment request',
        meta: {
          version: 'v1',
          timestamp: new Date().toISOString()
        }
      },
      500
    );
  }
});

// Course Lessons
coursesRouter.get('/:courseId/lessons', validateUUIDs(['courseId']), async (c: Context) => {
  try {
    const { courseId } = c.req.valid('param' as unknown as never) as { courseId: string };
    const organization = c.get('organization');
    const pagination = getPaginationFromQuery(c.req.query());

    const { data: lessons, total } = await getLessons(courseId, organization.id, pagination);
    const paginationMeta = calculatePagination(pagination, total);

    return c.json({
      success: true,
      data: lessons,
      meta: {
        version: 'v1',
        timestamp: new Date().toISOString(),
        pagination: paginationMeta
      }
    });
  } catch (error) {
    console.error('Error in GET /courses/:courseId/lessons:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to fetch lessons',
        meta: {
          version: 'v1',
          timestamp: new Date().toISOString()
        }
      },
      500
    );
  }
});

coursesRouter.post('/:courseId/lessons', validateUUIDs(['courseId']), async (c: Context) => {
  try {
    const { courseId } = c.req.valid('param' as unknown as never) as { courseId: string };
    const organization = c.get('organization');
    const lessonData = await c.req.json();

    // Validate lesson data
    const validatedData = ZLessonCreate.parse(lessonData);

    const lesson = await createLesson(courseId, organization.id, validatedData);
    if (!lesson) {
      return c.json(
        {
          success: false,
          error: 'Failed to create lesson',
          meta: {
            version: 'v1',
            timestamp: new Date().toISOString()
          }
        },
        400
      );
    }

    return c.json({
      success: true,
      data: lesson,
      meta: {
        version: 'v1',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      return c.json(
        {
          success: false,
          error: error.message,
          meta: {
            version: 'v1',
            timestamp: new Date().toISOString()
          }
        },
        400
      );
    }
    console.error('Error in POST /courses/:courseId/lessons:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to create lesson',
        meta: {
          version: 'v1',
          timestamp: new Date().toISOString()
        }
      },
      500
    );
  }
});

export default coursesRouter;
