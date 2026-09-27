import { Context, Next } from 'hono';

import { ErrorCodes } from '@api/utils/errors';
import { verifyEncoderJobToken } from '@cio/core/services/assets/encoder-token';

/**
 * Authenticates the HLS encoder for one job. The token names the asset and its
 * organization, so the handlers never take either from the request — an encoder
 * cannot reach an asset its token was not minted for.
 */
export const encoderJobMiddleware = async (c: Context, next: Next) => {
  const header = c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized', code: ErrorCodes.UNAUTHORIZED }, 401);
  }

  const verified = verifyEncoderJobToken(header.slice('Bearer '.length));
  if (!verified) {
    return c.json({ success: false, error: 'Invalid or expired job token', code: ErrorCodes.UNAUTHORIZED }, 401);
  }

  c.set('orgId', verified.organizationId);
  c.set('encoderAssetId', verified.assetId);

  return next();
};
