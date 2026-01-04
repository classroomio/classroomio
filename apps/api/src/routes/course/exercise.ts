import {
  ZExerciseCreate,
  ZExerciseFromTemplate,
  ZExerciseGetParam,
  ZExerciseListQuery,
  ZExerciseSubmissionCreate,
  ZExerciseUpdate
} from '@cio/utils/validation/exercise';
import {
  createExercise,
  createExerciseFromTemplate,
  deleteExerciseService,
  getExercise,
  listExercises,
  updateExerciseService
} from '@api/services/exercise';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { courseMemberMiddleware } from '@api/middlewares/course-member';
import { createSubmissionService } from '@api/services/submission';
import { getGroupMemberIdByCourseAndProfile } from '@cio/db/queries/group';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

export const exerciseRouter = new Hono()
  // Exercise CRUD routes
  .get('/', courseMemberMiddleware, zValidator('query', ZExerciseListQuery), async (c) => {
    try {
      const courseId = c.req.param('courseId')!;
      const { lessonId } = c.req.valid('query');
      const exercises = await listExercises(courseId, lessonId);

      return c.json({ success: true, data: exercises }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to list exercises');
    }
  })
  .get('/:exerciseId', courseMemberMiddleware, zValidator('param', ZExerciseGetParam), async (c) => {
    try {
      const { exerciseId } = c.req.valid('param');
      const exercise = await getExercise(exerciseId);

      return c.json({ success: true, data: exercise }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch exercise');
    }
  })
  .post('/', courseMemberMiddleware, zValidator('json', ZExerciseCreate), async (c) => {
    try {
      const courseId = c.req.param('courseId')!;
      const data = c.req.valid('json');

      const exercise = await createExercise({ ...data, courseId });

      return c.json({ success: true, data: exercise }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to create exercise');
    }
  })
  /**
   * POST /course/:courseId/exercise/from-template
   * Creates an exercise from a template
   * Requires authentication and course membership (admin/tutor role)
   */
  .post('/from-template', courseMemberMiddleware, zValidator('json', ZExerciseFromTemplate), async (c) => {
    try {
      const courseId = c.req.param('courseId')!;
      const { lessonId, template } = c.req.valid('json');

      const exercise = await createExerciseFromTemplate(courseId, lessonId, template);

      return c.json({ success: true, data: exercise }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to create exercise from template');
    }
  })
  .put(
    '/:exerciseId',
    courseMemberMiddleware,
    zValidator('param', ZExerciseGetParam),
    zValidator('json', ZExerciseUpdate),
    async (c) => {
      try {
        const { exerciseId } = c.req.valid('param');
        const data = c.req.valid('json');

        const exercise = await updateExerciseService(exerciseId, data);

        return c.json({ success: true, data: exercise }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update exercise');
      }
    }
  )
  .delete('/:exerciseId', courseMemberMiddleware, zValidator('param', ZExerciseGetParam), async (c) => {
    try {
      const { exerciseId } = c.req.valid('param');
      const exercise = await deleteExerciseService(exerciseId);

      return c.json({ success: true, data: exercise }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to delete exercise');
    }
  })
  // Exercise Submission routes
  .post(
    '/:exerciseId/submission',
    courseMemberMiddleware,
    zValidator('param', ZExerciseGetParam),
    zValidator('json', ZExerciseSubmissionCreate),
    async (c) => {
      try {
        const user = c.get('user')!;
        const courseId = c.req.param('courseId')!;
        const { exerciseId } = c.req.valid('param');
        const { answers } = c.req.valid('json');

        const groupMemberId = await getGroupMemberIdByCourseAndProfile(courseId, user.id);
        if (!groupMemberId) {
          return c.json({ success: false, error: 'User is not a member of this course' }, 403);
        }

        const submission = await createSubmissionService(courseId, exerciseId, groupMemberId, answers);

        return c.json({ success: true, data: submission }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to submit exercise');
      }
    }
  );
