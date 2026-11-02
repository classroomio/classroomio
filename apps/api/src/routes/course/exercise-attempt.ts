import { ZExerciseGetParam } from '@cio/utils/validation/exercise';
import { ContentType } from '@cio/utils/constants';
import { zValidator } from '@hono/zod-validator';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { courseMemberMiddleware } from '@api/middlewares/course-member';
import { assertEnrolledStudentContentAccess } from '@api/services/course/access';
import { listLearnerExerciseAttempts } from '@api/services/submission/learner-attempts';
import { handleError } from '@api/utils/errors';

export const exerciseAttemptRouter = new Hono().get(
  '/:exerciseId/attempts',
  authMiddleware,
  courseMemberMiddleware,
  zValidator('param', ZExerciseGetParam),
  async (c) => {
    try {
      const user = c.get('user')!;
      const courseId = c.req.param('courseId')!;
      const { exerciseId } = c.req.valid('param');

      await assertEnrolledStudentContentAccess({
        courseId,
        profileId: user.id,
        contentId: exerciseId,
        type: ContentType.Exercise
      });

      const data = await listLearnerExerciseAttempts(courseId, exerciseId, user.id);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch exercise attempts');
    }
  }
);
