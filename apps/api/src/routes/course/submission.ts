import {
  ZSubmissionAnswerUpdate,
  ZSubmissionGetParam,
  ZSubmissionGradesUpdate,
  ZSubmissionUpdate
} from '@cio/utils/validation/submission';
import {
  ZAiReviewBulkAcceptBody,
  ZAiReviewDecisionBody,
  ZAiReviewRequestBody,
  ZAnswerClustersParam,
  ZClusterOverrideBody,
  ZClusterResetBody,
  ZExerciseResultsQuery
} from '@cio/utils/validation/math';
import * as z from 'zod';
import {
  bulkAcceptAiReviews,
  deleteSubmissionService,
  getAnswerClusters,
  getExerciseResultsGrid,
  listSubmissionsForGrading,
  resetClusterOverride,
  setClusterOverride,
  recordAiReviewDecision,
  requestAiReview,
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
  .get(
    '/results/:exerciseId',
    courseGraderMiddleware,
    zValidator('param', z.object({ exerciseId: z.string().uuid() })),
    zValidator('query', ZExerciseResultsQuery),
    async (c) => {
      try {
        const { exerciseId } = c.req.valid('param');
        const query = c.req.valid('query');
        const courseId = c.req.param('courseId')!;
        const data = await getExerciseResultsGrid(courseId, exerciseId, query);

        return c.json({ success: true as const, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to load exercise results');
      }
    }
  )
  .get(
    '/clusters/:exerciseId/:questionId',
    courseGraderMiddleware,
    zValidator('param', ZAnswerClustersParam),
    async (c) => {
      try {
        const { exerciseId, questionId } = c.req.valid('param');
        const courseId = c.req.param('courseId')!;
        const data = await getAnswerClusters(courseId, exerciseId, questionId);

        return c.json({ success: true as const, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to group the answers');
      }
    }
  )
  .put(
    '/clusters/:exerciseId/:questionId',
    courseGraderMiddleware,
    zValidator('param', ZAnswerClustersParam),
    zValidator('json', ZClusterOverrideBody),
    async (c) => {
      try {
        const { exerciseId, questionId } = c.req.valid('param');
        const body = c.req.valid('json');
        const courseId = c.req.param('courseId')!;
        const data = await setClusterOverride({
          courseId,
          exerciseId,
          questionId,
          body,
          actorProfileId: c.get('user')!.id
        });

        return c.json({ success: true as const, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to apply the decision to the answer group');
      }
    }
  )
  .post(
    '/clusters/:exerciseId/:questionId/reset',
    courseGraderMiddleware,
    zValidator('param', ZAnswerClustersParam),
    zValidator('json', ZClusterResetBody),
    async (c) => {
      try {
        const { exerciseId, questionId } = c.req.valid('param');
        const { key } = c.req.valid('json');
        const courseId = c.req.param('courseId')!;
        const data = await resetClusterOverride({ courseId, exerciseId, questionId, key });

        return c.json({ success: true as const, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to undo the decision');
      }
    }
  )
  .post(
    '/ai-review/accept/:exerciseId',
    courseGraderMiddleware,
    zValidator('param', z.object({ exerciseId: z.string().uuid() })),
    zValidator('json', ZAiReviewBulkAcceptBody),
    async (c) => {
      try {
        const { exerciseId } = c.req.valid('param');
        const { minConfidence } = c.req.valid('json');
        const courseId = c.req.param('courseId')!;

        const result = await bulkAcceptAiReviews({
          courseId,
          exerciseId,
          minConfidence,
          actorProfileId: c.get('user')!.id
        });

        return c.json({ success: true as const, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to accept AI suggestions');
      }
    }
  )
  .post(
    '/:submissionId/ai-review',
    courseGraderMiddleware,
    zValidator('param', ZSubmissionGetParam),
    zValidator('json', ZAiReviewRequestBody),
    async (c) => {
      try {
        const { submissionId } = c.req.valid('param');
        const { questionId } = c.req.valid('json');
        const courseId = c.req.param('courseId')!;

        const review = await requestAiReview({ courseId, submissionId, questionId, userId: c.get('user')!.id });

        return c.json({ success: true as const, data: review }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to review the working');
      }
    }
  )
  .put(
    '/:submissionId/ai-review/decision',
    courseGraderMiddleware,
    zValidator('param', ZSubmissionGetParam),
    zValidator('json', ZAiReviewDecisionBody),
    async (c) => {
      try {
        const { submissionId } = c.req.valid('param');
        const decision = c.req.valid('json');
        const courseId = c.req.param('courseId')!;

        const review = await recordAiReviewDecision({
          courseId,
          submissionId,
          actorProfileId: c.get('user')!.id,
          decision
        });

        return c.json({ success: true as const, data: review }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to record the decision');
      }
    }
  )
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

        const submission = await updateSubmissionService(submissionId, courseId, data, {
          actorProfileId: c.get('user')?.id ?? null
        });

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

        const submission = await updateSubmissionGradesBatch(submissionId, courseId, data, {
          actorProfileId: c.get('user')?.id ?? null
        });

        return c.json({ success: true, data: submission }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update submission grades');
      }
    }
  );
