import { Context, Hono } from 'hono';
import { validateUUIDs } from '../middleware/auth';
import { getLesson, updateLesson, toggleLessonLock } from '../service/course-service';
import { ZLessonUpdate } from '$src/public/utils/validations';

const lessonsRouter = new Hono();

// TODO: For all lessons, figure out a way to verify that the lesson belongs to a course in the organization
// On a first look, I think we can solve it by using the course_id in the lesson table,but i am trying to prevent a courseId in the params
// need to think about it
// the OrganizationId is already in the context and thus we can use that to verify the lesson belongs to a course in the organization

// Get a specific lesson
lessonsRouter.get('/:lessonId', validateUUIDs(['lessonId']), async (c: Context) => {
  try {
    const { lessonId } = c.req.valid('param' as unknown as never) as { lessonId: string };
    const organization = c.get('organization');
    const lesson = await getLesson(lessonId, organization.id);
    if (!lesson) {
      return c.json(
        {
          success: false,
          error: 'Lesson not found',
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
      data: lesson,
      meta: {
        version: 'v1',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in GET /lessons/:lessonId:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to fetch lesson',
        meta: {
          version: 'v1',
          timestamp: new Date().toISOString()
        }
      },
      500
    );
  }
});

// Update a lesson
lessonsRouter.patch('/:lessonId', validateUUIDs(['lessonId']), async (c: Context) => {
  try {
    const { lessonId } = c.req.valid('param' as unknown as never) as { lessonId: string };
    const updates = await c.req.json();
    const organization = c.get('organization');
    const validatedUpdates = ZLessonUpdate.parse(updates);

    const lesson = await updateLesson(lessonId, organization.id, validatedUpdates);
    if (!lesson) {
      return c.json(
        {
          success: false,
          error: 'Lesson not found',
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
    console.error('Error in PATCH /lessons/:lessonId:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to update lesson',
        meta: {
          version: 'v1',
          timestamp: new Date().toISOString()
        }
      },
      500
    );
  }
});

// Toggle lesson lock status
lessonsRouter.patch('/:lessonId/lock', validateUUIDs(['lessonId']), async (c: Context) => {
  try {
    const { lessonId } = c.req.valid('param' as unknown as never) as { lessonId: string };
    const { locked } = await c.req.json();
    const organization = c.get('organization');
    if (typeof locked !== 'boolean') {
      return c.json(
        {
          success: false,
          error: 'Locked status must be a boolean',
          meta: {
            version: 'v1',
            timestamp: new Date().toISOString()
          }
        },
        400
      );
    }

    const success = await toggleLessonLock(lessonId, organization.id, locked);
    if (!success) {
      return c.json(
        {
          success: false,
          error: 'Lesson not found',
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
      message: locked ? 'Lesson locked successfully' : 'Lesson unlocked successfully',
      meta: {
        version: 'v1',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in PATCH /lessons/:lessonId/lock:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to update lesson lock status',
        meta: {
          version: 'v1',
          timestamp: new Date().toISOString()
        }
      },
      500
    );
  }
});

export default lessonsRouter;
