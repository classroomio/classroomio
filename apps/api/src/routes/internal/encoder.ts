import { ZEncoderFail, ZEncoderFinalize, ZEncoderPresignOutputs, ZEncoderProgress } from '@cio/utils/validation/assets';

import { Hono } from '@api/utils/hono';
import { encoderJobMiddleware } from '@api/middlewares/encoder-job';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';
import {
  failEncoderJobService,
  finalizeEncoderOutputService,
  presignEncoderOutputsService,
  recordEncoderProgressService
} from '@api/services/internal/encoder';

/**
 * Callback surface for the HLS encoder. The encoder holds no database, Redis or
 * storage credentials — it reaches everything through these four routes, using a
 * job token that names one asset. Nothing here takes an asset id from the
 * request; it always comes from the verified token.
 */
export const internalEncoderRouter = new Hono()
  .use('*', encoderJobMiddleware)
  .post('/outputs/presign', zValidator('json', ZEncoderPresignOutputs), async (c) => {
    try {
      const assetId = c.get('encoderAssetId')!;
      const orgId = c.get('orgId')!;
      const urls = await presignEncoderOutputsService(assetId, orgId, c.req.valid('json'));

      return c.json({ success: true, data: { urls } });
    } catch (error) {
      return handleError(c, error, 'Failed to presign encoder outputs');
    }
  })
  .post('/progress', zValidator('json', ZEncoderProgress), async (c) => {
    try {
      const assetId = c.get('encoderAssetId')!;
      const orgId = c.get('orgId')!;
      await recordEncoderProgressService(assetId, orgId, c.req.valid('json'));

      return c.json({ success: true });
    } catch (error) {
      return handleError(c, error, 'Failed to record encoder progress');
    }
  })
  .post('/finalize', zValidator('json', ZEncoderFinalize), async (c) => {
    try {
      const assetId = c.get('encoderAssetId')!;
      const orgId = c.get('orgId')!;
      await finalizeEncoderOutputService(assetId, orgId, c.req.valid('json'));

      return c.json({ success: true });
    } catch (error) {
      return handleError(c, error, 'Failed to finalize encoder output');
    }
  })
  .post('/fail', zValidator('json', ZEncoderFail), async (c) => {
    try {
      const assetId = c.get('encoderAssetId')!;
      const orgId = c.get('orgId')!;
      await failEncoderJobService(assetId, orgId, c.req.valid('json'));

      return c.json({ success: true });
    } catch (error) {
      return handleError(c, error, 'Failed to record encoder failure');
    }
  });
