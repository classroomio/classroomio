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
import { courseGraderMiddleware } from '@api/middlewares/course-grader';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

export const submissionRouter = new Hono()
  .get('/for-grading', courseGraderMiddleware, async (c) => {
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
    courseGraderMiddleware,
    zValidator('param', ZSubmissionGetParam),
    zValidator('json', ZSubmissionUpdate),
    async (c) => {
      try {
        const { submissionId } = c.req.valid('param');
        const courseId = c.req.param('courseId')!;
        const data = c.req.valid('json');

        const submission = await updateSubmissionService(submissionId, courseId, data);

        return c.json({ success: true, data: submission }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update submission');
      }
    }
  )
  .delete('/:submissionId', courseGraderMiddleware, zValidator('param', ZSubmissionGetParam), async (c) => {
    try {
      const { submissionId } = c.req.valid('param');
      const courseId = c.req.param('courseId')!;
      const submission = await deleteSubmissionService(submissionId, courseId);

      return c.json({ success: true, data: submission }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to delete submission');
    }
  })
  .put(
    '/:submissionId/answer',
    courseGraderMiddleware,
    zValidator('param', ZSubmissionGetParam),
    zValidator('json', ZSubmissionAnswerUpdate),
    async (c) => {
      try {
        const { submissionId } = c.req.valid('param');
        const courseId = c.req.param('courseId')!;
        const { questionId, ...data } = c.req.valid('json');

        const answer = await updateSubmissionAnswer(submissionId, courseId, questionId, { questionId, ...data });

        return c.json({ success: true, data: answer }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update submission answer');
      }
    }
  )
  .put(
    '/:submissionId/grades',
    courseGraderMiddleware,
    zValidator('param', ZSubmissionGetParam),
    zValidator('json', ZSubmissionGradesUpdate),
    async (c) => {
      try {
        const { submissionId } = c.req.valid('param');
        const courseId = c.req.param('courseId')!;
        const data = c.req.valid('json');

        const submission = await updateSubmissionGradesBatch(submissionId, courseId, data);

        return c.json({ success: true, data: submission }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update submission grades');
      }
    }
  );
