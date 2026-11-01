import { ZAssetGetParam } from '@cio/utils/validation/assets';
import { ZOfflineVideoQuery } from '@cio/utils/validation/course';
import { verifyHlsToken } from '@cio/core/services/assets/assets';
import { streamOfflineVideo } from '@api/services/assets/offline-video';

import { Hono } from '@api/utils/hono';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

export const hlsOfflineVideoRouter = new Hono()
  /**
   * GET /hls/:assetId/offline.mp4?t=<token>&rendition=<name>
   * Streams one rendition of an HLS asset as a single fragmented MP4 for offline downloads. Authorized only by the
   * signed `t` token the offline manifest issues, so the token's expiry applies when the download starts.
   */
  .get(
    '/:assetId/offline.mp4',
    zValidator('param', ZAssetGetParam),
    zValidator('query', ZOfflineVideoQuery),
    async (c) => {
      try {
        const { assetId } = c.req.valid('param');
        const { t, rendition } = c.req.valid('query');
        const verified = await verifyHlsToken(t);
        if (verified?.assetId !== assetId) {
          return c.json({ success: false, error: 'Download link expired or invalid' }, 403);
        }

        const stream = await streamOfflineVideo(assetId, rendition);

        return c.body(stream, 200, { 'Content-Type': 'video/mp4', 'Cache-Control': 'private, no-store' });
      } catch (error) {
        return handleError(c, error, 'Failed to prepare offline video');
      }
    }
  );
