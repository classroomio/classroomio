import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { zValidator } from '@hono/zod-validator';
import { ZAssetJobsParam, ZJobBatchQuery, ZJobIdParam } from '@cio/utils/validation/jobs';
import {
  cancelMediaJob,
  getMediaJobEnvelope,
  getMediaJobSteps,
  listMediaJobEnvelopes,
  listMediaJobsForAssetEnvelopes,
  startTranscriptionOnlyMediaJob
} from '@api/services/jobs';

import type { JobEnvelope } from '@cio/jobs/status';

/**
 * Generic + media-flavoured job status routes.
 *
 *   GET  /jobs/media/:jobId            -> single envelope (ETag/304 supported)
 *   GET  /jobs/media?ids=a,b,c         -> map keyed by job id
 *   GET  /jobs/media/asset/:assetId    -> all runs for an asset (lesson editor badges)
 *   POST /jobs/media/:jobId/cancel     -> request cancellation
 *   GET  /jobs/media/:jobId/steps      -> ledger entries (admin / debug)
 *
 *   POST /jobs/media/asset/:assetId/transcribe -> enqueue extract + whisper only (202)
 *
 * Domain-specific surfaces (e.g. /media/jobs) can re-export the same handlers
 * once additional domains adopt the envelope. Returning a single shape per
 * route keeps the RPC types unambiguous.
 */
function envelopeETag(envelope: JobEnvelope): string {
  return `W/"${envelope.job.id}-${envelope.job.updatedAt}"`;
}

export const jobsRouter = new Hono()
  .get(
    '/media/:jobId',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZJobIdParam.extend({ jobId: ZJobIdParam.shape.jobId }).pick({ jobId: true })),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const { jobId } = c.req.valid('param');
        const envelope = await getMediaJobEnvelope(jobId, orgId);

        const etag = envelopeETag(envelope);
        const ifNoneMatch = c.req.header('if-none-match');
        if (ifNoneMatch === etag) {
          c.header('ETag', etag);
          return c.body(null, 304);
        }

        c.header('ETag', etag);
        c.header('Last-Modified', new Date(envelope.job.updatedAt).toUTCString());
        return c.json({ success: true, data: envelope }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to fetch media job');
      }
    }
  )
  .get('/media', authMiddleware, orgMemberMiddleware, zValidator('query', ZJobBatchQuery), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const { ids } = c.req.valid('query');
      const envelopes = await listMediaJobEnvelopes(ids, orgId);
      return c.json({ success: true, data: envelopes }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch media jobs');
    }
  })
  .get(
    '/media/asset/:assetId',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZAssetJobsParam),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const { assetId } = c.req.valid('param');
        const envelopes = await listMediaJobsForAssetEnvelopes(assetId, orgId);
        return c.json({ success: true, data: envelopes }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to fetch media jobs for asset');
      }
    }
  )
  .post(
    '/media/asset/:assetId/transcribe',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZAssetJobsParam),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const user = c.get('user')!;
        const { assetId } = c.req.valid('param');
        const job = await startTranscriptionOnlyMediaJob({
          organizationId: orgId,
          assetId,
          triggeredByProfileId: user?.id ?? null
        });
        return c.json({ success: true, data: job }, 202);
      } catch (error) {
        return handleError(c, error, 'Failed to start transcription');
      }
    }
  )
  .post(
    '/media/:jobId/cancel',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZJobIdParam.pick({ jobId: true })),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const { jobId } = c.req.valid('param');
        const envelope = await cancelMediaJob(jobId, orgId);
        return c.json({ success: true, data: envelope }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to cancel media job');
      }
    }
  )
  .get(
    '/media/:jobId/steps',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZJobIdParam.pick({ jobId: true })),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const { jobId } = c.req.valid('param');
        const steps = await getMediaJobSteps(jobId, orgId);
        return c.json({ success: true, data: steps }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to fetch media job steps');
      }
    }
  );
