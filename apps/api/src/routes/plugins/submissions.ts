import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { pluginPublisherAuthMiddleware } from '@api/middlewares/plugin-publisher-auth';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';
import { ZCreateSubmissionIntent, ZListSubmissionsQuery, ZReviewSubmission } from '@cio/utils/validation/plugin';
import {
  assertPlatformPluginReviewer,
  completeSubmission,
  createSubmissionIntent,
  getSubmissionDetails,
  getSubmissionReviewUrl,
  listSubmissions,
  reviewSubmission
} from '@api/services/plugin';

export const pluginSubmissionsRouter = new Hono()
  .post('/intent', pluginPublisherAuthMiddleware, zValidator('json', ZCreateSubmissionIntent), async (c) => {
    try {
      const profileId = c.get('actorId')!;
      const payload = c.req.valid('json');
      const releaseLane = payload.pluginId.startsWith('com.classroomio.') ? 'first-party' : 'community';
      if (releaseLane === 'first-party') {
        await assertPlatformPluginReviewer(profileId);
      }

      const result = await createSubmissionIntent({
        ...payload,
        releaseLane,
        profileId
      });

      return c.json({ success: true, data: result }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to create submission intent');
    }
  })
  .post('/:submissionId/complete', pluginPublisherAuthMiddleware, async (c) => {
    try {
      const submissionId = c.req.param('submissionId');
      const submission = await getSubmissionDetails(submissionId);
      if (submission.submittedByProfileId !== c.get('actorId')) {
        return c.json({ success: false, message: 'Submission does not belong to this publisher' }, 403);
      }

      const result = await completeSubmission(submissionId);

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to finalize submission');
    }
  })
  .post('/:submissionId/review', authMiddleware, zValidator('json', ZReviewSubmission), async (c) => {
    try {
      const user = c.get('user')!;
      await assertPlatformPluginReviewer(user.id);

      const submissionId = c.req.param('submissionId');
      const { action, reviewNotes } = c.req.valid('json');

      const submission = await reviewSubmission(submissionId, action, reviewNotes);

      return c.json({ success: true, data: submission }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to review submission');
    }
  })
  .get('/:submissionId/review-url', authMiddleware, async (c) => {
    try {
      const user = c.get('user')!;
      await assertPlatformPluginReviewer(user.id);

      const submission = await getSubmissionDetails(c.req.param('submissionId'));
      return c.json({ success: true, data: { url: getSubmissionReviewUrl(submission) } }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to create reviewer preview URL');
    }
  })
  .get('/:submissionId', pluginPublisherAuthMiddleware, async (c) => {
    try {
      const submissionId = c.req.param('submissionId');
      const submission = await getSubmissionDetails(submissionId);
      if (submission.submittedByProfileId !== c.get('actorId')) {
        await assertPlatformPluginReviewer(c.get('actorId')!);
      }

      return c.json({ success: true, data: submission }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch submission details');
    }
  })
  .get('/', authMiddleware, zValidator('query', ZListSubmissionsQuery), async (c) => {
    try {
      const user = c.get('user')!;
      await assertPlatformPluginReviewer(user.id);

      const query = c.req.valid('query');
      const submissions = await listSubmissions(query);

      return c.json({ success: true, data: submissions }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to list submissions');
    }
  });
