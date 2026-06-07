import {
  ZAssetAttach,
  ZAssetCreateUpload,
  ZAssetDetach,
  ZAssetExportQuery,
  ZAssetGetParam,
  ZAssetListQuery,
  ZAssetStorageQuery,
  ZAssetThumbnailSelect,
  ZAssetUpdate,
  ZAssetUsageParams,
  ZBatchPresignHls,
  ZBatchPresignHls1080,
  ZFinalizeHls1080,
  ZFinalizeHlsAsset,
  ZInitHlsAsset,
  ZYouTubeMetadataQuery
} from '@cio/utils/validation/assets';
import { ZUpdateTranscript } from '@cio/utils/validation/media';
import {
  abortHlsAssetService,
  attachAssetService,
  batchPresignHlsService,
  batchPresignHls1080Service,
  createAssetFromUploadService,
  deleteAssetService,
  detachAssetService,
  exportOrganizationAssetsService,
  finalizeHls1080Service,
  finalizeHlsAssetService,
  getAssetService,
  getAssetUsageGraphService,
  getOrganizationAssetStorageService,
  getTranscriptForOrganizationAssetService,
  getYouTubeMetadataService,
  initHlsAssetService,
  issueHlsCookieService,
  listOrganizationAssetsService,
  selectAssetThumbnailService,
  updateAssetService,
  updateTranscriptForOrganizationAssetService
} from '@api/services/assets';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { zValidator } from '@hono/zod-validator';
import { setCookie } from 'hono/cookie';

export const assetsRouter = new Hono()
  /**
   * GET /organization/assets
   * List organization assets
   */
  .get('/', authMiddleware, orgMemberMiddleware, zValidator('query', ZAssetListQuery), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const query = c.req.valid('query');
      const result = await listOrganizationAssetsService(orgId, query);

      return c.json(
        {
          success: true,
          data: result.items,
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages
          }
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to list assets');
    }
  })
  /**
   * POST /organization/assets
   * Create or reuse an organization asset
   */
  .post('/', authMiddleware, orgMemberMiddleware, zValidator('json', ZAssetCreateUpload), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const user = c.get('user')!;
      const data = c.req.valid('json');
      const asset = await createAssetFromUploadService(orgId, user.id, data);

      return c.json(
        {
          success: true,
          data: asset
        },
        201
      );
    } catch (error) {
      return handleError(c, error, 'Failed to create asset');
    }
  })
  /**
   * POST /organization/assets/hls/init
   * Reserve an assetId for an HLS upload. Returns the asset id and the
   * key prefix the browser encoder should write segments under.
   */
  .post('/hls/init', authMiddleware, orgMemberMiddleware, zValidator('json', ZInitHlsAsset), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const user = c.get('user')!;
      const data = c.req.valid('json');
      const result = await initHlsAssetService(orgId, user.id, data);

      return c.json({ success: true, data: result }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to init HLS asset');
    }
  })
  /**
   * POST /organization/assets/:assetId/hls/presign
   * Batch-presign PUT URLs for segment/playlist/audio/thumbnail uploads.
   */
  .post(
    '/:assetId/hls/presign',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZAssetGetParam),
    zValidator('json', ZBatchPresignHls),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const { assetId } = c.req.valid('param');
        const data = c.req.valid('json');
        const result = await batchPresignHlsService(orgId, assetId, data);

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to presign HLS uploads');
      }
    }
  )
  /**
   * POST /organization/assets/:assetId/hls/finalize
   * Flip an HLS asset from `processing` to `active` once the browser
   * encoder has written everything and persist its metadata.
   */
  .post(
    '/:assetId/hls/finalize',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZAssetGetParam),
    zValidator('json', ZFinalizeHlsAsset),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const user = c.get('user')!;
        const { assetId } = c.req.valid('param');
        const data = c.req.valid('json');
        const result = await finalizeHlsAssetService(orgId, assetId, user.id, data);

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to finalize HLS asset');
      }
    }
  )
  /**
   * POST /organization/assets/:assetId/hls/1080/presign
   * Batch-presign PUT URLs for a manual p1080 rendition on an active HLS asset.
   */
  .post(
    '/:assetId/hls/1080/presign',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZAssetGetParam),
    zValidator('json', ZBatchPresignHls1080),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const { assetId } = c.req.valid('param');
        const data = c.req.valid('json');
        const result = await batchPresignHls1080Service(orgId, assetId, data);

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to presign 1080p HLS uploads');
      }
    }
  )
  /**
   * POST /organization/assets/:assetId/hls/1080/finalize
   * Persist p1080 rendition metadata after the browser encoder updates the manifest.
   */
  .post(
    '/:assetId/hls/1080/finalize',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZAssetGetParam),
    zValidator('json', ZFinalizeHls1080),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const { assetId } = c.req.valid('param');
        const data = c.req.valid('json');
        const result = await finalizeHls1080Service(orgId, assetId, data);

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to finalize 1080p HLS rendition');
      }
    }
  )
  /**
   * DELETE /organization/assets/:assetId/hls
   * Abort a `processing` HLS asset: best-effort delete R2 objects under
   * `videos/{assetId}/` and remove the asset row. Called by the encoder
   * when it errors or is aborted mid-upload, so we don't leak stale
   * `processing` rows + partial segment trees.
   */
  .delete('/:assetId/hls', authMiddleware, orgMemberMiddleware, zValidator('param', ZAssetGetParam), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const { assetId } = c.req.valid('param');
      const deleted = await abortHlsAssetService(orgId, assetId);

      return c.json({ success: true, data: deleted }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to abort HLS asset');
    }
  })
  /**
   * POST /organization/assets/:assetId/hls/cookie
   * After entitlement check, set a 15-minute HMAC-signed cookie scoped to
   * this asset id. The tenant-router Worker verifies the cookie locally
   * on every /hls/{assetId}/* segment request — no round-trip back to Render.
   */
  .post('/:assetId/hls/cookie', authMiddleware, orgMemberMiddleware, zValidator('param', ZAssetGetParam), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const { assetId } = c.req.valid('param');
      const { token, expiresAt, cookieName, maxAgeSeconds } = await issueHlsCookieService(orgId, assetId);

      setCookie(c, cookieName, token, {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
        maxAge: maxAgeSeconds
      });

      return c.json({ success: true, data: { expiresAt } }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to issue HLS cookie');
    }
  })
  /**
   * GET /organization/assets/export
   * Export organization assets with usage graph
   */
  .get('/export', authMiddleware, orgAdminMiddleware, zValidator('query', ZAssetExportQuery), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const query = c.req.valid('query');
      const result = await exportOrganizationAssetsService(orgId, query);

      return c.json(
        {
          success: true,
          data: result
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to export assets');
    }
  })
  /**
   * GET /organization/assets/storage
   * Return storage metrics for the current organization
   */
  .get('/storage', authMiddleware, orgMemberMiddleware, zValidator('query', ZAssetStorageQuery), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const query = c.req.valid('query');
      const summary = await getOrganizationAssetStorageService(orgId, query);

      return c.json(
        {
          success: true,
          data: summary
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to fetch asset storage summary');
    }
  })
  /**
   * GET /organization/assets/youtube-metadata
   * Resolve YouTube metadata (title, duration, thumbnail) for a URL
   */
  .get(
    '/youtube-metadata',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('query', ZYouTubeMetadataQuery),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const query = c.req.valid('query');
        const metadata = await getYouTubeMetadataService(orgId, query);

        return c.json(
          {
            success: true,
            data: metadata
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to resolve YouTube metadata');
      }
    }
  )
  /**
   * GET /organization/assets/:assetId/transcript
   * Whisper transcript + presigned VTT URL for captions (or null if none).
   */
  .get('/:assetId/transcript', authMiddleware, orgMemberMiddleware, zValidator('param', ZAssetGetParam), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const { assetId } = c.req.valid('param');
      const data = await getTranscriptForOrganizationAssetService(orgId, assetId);

      return c.json(
        {
          success: true,
          data
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to fetch transcript');
    }
  })
  /**
   * PUT /organization/assets/:assetId/transcript
   * Update transcript segment text (org admins only). Captions re-render from
   * these segments — no R2 write.
   */
  .put(
    '/:assetId/transcript',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('param', ZAssetGetParam),
    zValidator('json', ZUpdateTranscript),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const { assetId } = c.req.valid('param');
        const { segments } = c.req.valid('json');
        const data = await updateTranscriptForOrganizationAssetService(orgId, assetId, segments);

        return c.json(
          {
            success: true,
            data
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to update transcript');
      }
    }
  )
  /**
   * GET /organization/assets/:assetId
   * Get a single asset by id
   */
  .get('/:assetId', authMiddleware, orgMemberMiddleware, zValidator('param', ZAssetGetParam), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const { assetId } = c.req.valid('param');
      const asset = await getAssetService(orgId, assetId);

      return c.json(
        {
          success: true,
          data: asset
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to fetch asset');
    }
  })
  /**
   * PUT /organization/assets/:assetId
   * Update asset metadata
   */
  .put(
    '/:assetId',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZAssetGetParam),
    zValidator('json', ZAssetUpdate),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const { assetId } = c.req.valid('param');
        const data = c.req.valid('json');
        const updated = await updateAssetService(orgId, assetId, data);

        return c.json(
          {
            success: true,
            data: updated
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to update asset');
      }
    }
  )
  /**
   * PUT /organization/assets/:assetId/thumbnail
   * Choose a thumbnail for an asset (from generated candidates or a fresh upload).
   */
  .put(
    '/:assetId/thumbnail',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZAssetGetParam),
    zValidator('json', ZAssetThumbnailSelect),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const { assetId } = c.req.valid('param');
        const { thumbnailUrl } = c.req.valid('json');
        const updated = await selectAssetThumbnailService(orgId, assetId, thumbnailUrl);

        return c.json(
          {
            success: true,
            data: updated
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to update asset thumbnail');
      }
    }
  )
  /**
   * DELETE /organization/assets/:assetId
   * Delete an unused asset
   */
  .delete('/:assetId', authMiddleware, orgAdminMiddleware, zValidator('param', ZAssetGetParam), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const { assetId } = c.req.valid('param');
      const deleted = await deleteAssetService(orgId, assetId);

      return c.json(
        {
          success: true,
          data: deleted
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to delete asset');
    }
  })
  /**
   * GET /organization/assets/:assetId/usage
   * Get usage graph for an asset
   */
  .get('/:assetId/usage', authMiddleware, orgMemberMiddleware, zValidator('param', ZAssetUsageParams), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const { assetId } = c.req.valid('param');
      const usage = await getAssetUsageGraphService(orgId, assetId);

      return c.json(
        {
          success: true,
          data: usage
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to fetch asset usage');
    }
  })
  /**
   * POST /organization/assets/:assetId/attach
   * Attach asset to a target location
   */
  .post(
    '/:assetId/attach',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZAssetUsageParams),
    zValidator('json', ZAssetAttach),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const user = c.get('user')!;
        const { assetId } = c.req.valid('param');
        const data = c.req.valid('json');
        const usage = await attachAssetService(orgId, assetId, user.id, data);

        return c.json(
          {
            success: true,
            data: usage
          },
          201
        );
      } catch (error) {
        return handleError(c, error, 'Failed to attach asset');
      }
    }
  )
  /**
   * POST /organization/assets/:assetId/detach
   * Remove an asset usage link
   */
  .post(
    '/:assetId/detach',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZAssetUsageParams),
    zValidator('json', ZAssetDetach),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const { assetId } = c.req.valid('param');
        const data = c.req.valid('json');
        const usage = await detachAssetService(orgId, assetId, data);

        return c.json(
          {
            success: true,
            data: usage
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to detach asset');
      }
    }
  );
