import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { authOrApiKeyMiddleware } from '@api/middlewares/auth-or-api-key';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';
import { ZCreateSubmissionIntent, ZListSubmissionsQuery, ZReviewSubmission } from '@cio/utils/validation/plugin';
import {
  completeSubmission,
  createSubmissionIntent,
  getSubmissionDetails,
  listSubmissions,
  reviewSubmission,
  storeQuarantineUpload
} from '@api/services/plugin';

export const pluginSubmissionsRouter = new Hono()
  .post('/intent', authOrApiKeyMiddleware, zValidator('json', ZCreateSubmissionIntent), async (c) => {
    try {
      const user = c.get('user');
      const profileId = user?.id ?? '00000000-0000-0000-0000-000000000000';
      const payload = c.req.valid('json');

      const result = await createSubmissionIntent({
        ...payload,
        profileId
      });

      return c.json({ success: true, data: result }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to create submission intent');
    }
  })
  .put('/:submissionId/upload', async (c) => {
    try {
      const submissionId = c.req.param('submissionId');
      const arrayBuffer = await c.req.arrayBuffer();
      const archiveBuffer = Buffer.from(arrayBuffer);

      const submission = await storeQuarantineUpload(submissionId, archiveBuffer);

      return c.json({ success: true, data: submission }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to store quarantine upload');
    }
  })
  .post('/:submissionId/complete', authOrApiKeyMiddleware, async (c) => {
    try {
      const submissionId = c.req.param('submissionId');
      const result = await completeSubmission(submissionId);

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to finalize submission');
    }
  })
  .post('/:submissionId/review', authMiddleware, zValidator('json', ZReviewSubmission), async (c) => {
    try {
      const submissionId = c.req.param('submissionId');
      const { action, reviewNotes } = c.req.valid('json');

      const submission = await reviewSubmission(submissionId, action, reviewNotes);

      return c.json({ success: true, data: submission }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to review submission');
    }
  })
  .get('/:submissionId', authOrApiKeyMiddleware, async (c) => {
    try {
      const submissionId = c.req.param('submissionId');
      const submission = await getSubmissionDetails(submissionId);

      return c.json({ success: true, data: submission }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch submission details');
    }
  })
  .get('/', authMiddleware, zValidator('query', ZListSubmissionsQuery), async (c) => {
    try {
      const query = c.req.valid('query');
      const submissions = await listSubmissions(query);

      return c.json({ success: true, data: submissions }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to list submissions');
    }
  });
