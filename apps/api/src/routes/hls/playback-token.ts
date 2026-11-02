import { ZAssetGetParam } from '@cio/utils/validation/assets';
import { issueHlsPlaybackTokenService } from '@api/services/assets';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { zValidator } from '@hono/zod-validator';

export const hlsPlaybackTokenRouter = new Hono()
  /**
   * GET /hls/:assetId/playback-token
   * Returns a master playlist URL carrying a signed `t` query parameter for players that
   * cannot send the per-asset HLS cookie (iOS AVPlayer, Android ExoPlayer).
   * Requires authentication and membership of the organization that owns the asset.
   */
  .get(
    '/:assetId/playback-token',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZAssetGetParam),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const { assetId } = c.req.valid('param');
        const data = await issueHlsPlaybackTokenService(orgId, assetId);

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to issue HLS playback token');
      }
    }
  );
