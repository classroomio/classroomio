import {
  ZSubmissionAnswerUpdate,
  ZSubmissionGetParam,
  ZSubmissionListQuery,
  ZSubmissionUpdate
} from '@cio/utils/validation/submission';
import {
  deleteSubmissionService,
  getSubmission,
  listSubmissions,
  listSubmissionsForGrading,
  updateSubmissionAnswer,
  updateSubmissionService
} from '@api/services/submission';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { courseMemberMiddleware } from '@api/middlewares/course-member';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

export const submissionRouter = new Hono()
  .get('/', courseMemberMiddleware, zValidator('query', ZSubmissionListQuery), async (c) => {
    try {
      const courseId = c.req.param('courseId')!;
      const { exerciseId, submittedBy } = c.req.valid('query');
      const submissions = await listSubmissions(courseId, exerciseId, submittedBy);

      return c.json({ success: true, data: submissions }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to list submissions');
    }
  })
  .get('/for-grading', courseMemberMiddleware, async (c) => {
    try {
      const courseId = c.req.param('courseId')!;
      const data = await listSubmissionsForGrading(courseId);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to list submissions for grading');
    }
  })
  .put(
    '/:submissionId',
    courseMemberMiddleware,
    zValidator('param', ZSubmissionGetParam),
    zValidator('json', ZSubmissionUpdate),
    async (c) => {
      try {
        const { submissionId } = c.req.valid('param');
        const data = c.req.valid('json');

        const submission = await updateSubmissionService(submissionId, data);

        return c.json({ success: true, data: submission }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update submission');
      }
    }
  )
  .delete('/:submissionId', courseMemberMiddleware, zValidator('param', ZSubmissionGetParam), async (c) => {
    try {
      const { submissionId } = c.req.valid('param');
      const submission = await deleteSubmissionService(submissionId);

      return c.json({ success: true, data: submission }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to delete submission');
    }
  })
  .put(
    '/:submissionId/answer',
    courseMemberMiddleware,
    zValidator('param', ZSubmissionGetParam),
    zValidator('json', ZSubmissionAnswerUpdate),
    async (c) => {
      try {
        const { submissionId } = c.req.valid('param');
        const { questionId, ...data } = c.req.valid('json');

        const answer = await updateSubmissionAnswer(submissionId, questionId, { questionId, ...data });

        return c.json({ success: true, data: answer }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update submission answer');
      }
    }
  );
