import {
  ZSubmissionAnswerUpdate,
  ZSubmissionGetParam,
  ZSubmissionGradesUpdate,
  ZSubmissionUpdate
} from '@cio/utils/validation/submission';
import {
  deleteSubmissionService,
  listSubmissionsForGrading,
  updateSubmissionAnswer,
  updateSubmissionGradesBatch,
  updateSubmissionService
} from '@api/services/submission';

import { Hono } from '@api/utils/hono';
import { courseTeamMemberMiddleware } from '@api/middlewares/course-team-member';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

export const submissionRouter = new Hono()
  .get('/for-grading', courseTeamMemberMiddleware, async (c) => {
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
    courseTeamMemberMiddleware,
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
  .delete('/:submissionId', courseTeamMemberMiddleware, zValidator('param', ZSubmissionGetParam), async (c) => {
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
    courseTeamMemberMiddleware,
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
  )
  .put(
    '/:submissionId/grades',
    courseTeamMemberMiddleware,
    zValidator('param', ZSubmissionGetParam),
    zValidator('json', ZSubmissionGradesUpdate),
    async (c) => {
      try {
        const { submissionId } = c.req.valid('param');
        const data = c.req.valid('json');

        const submission = await updateSubmissionGradesBatch(submissionId, data);

        return c.json({ success: true, data: submission }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update submission grades');
      }
    }
  );
