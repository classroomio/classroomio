import {
  ZAssetAttach,
  ZAssetCreateUpload,
  ZAssetDetach,
  ZAssetExportQuery,
  ZAssetGetParam,
  ZAssetListQuery,
  ZAssetStorageQuery,
  ZAssetUpdate,
  ZAssetUsageParams,
  ZYouTubeMetadataQuery
} from '@cio/utils/validation/assets';
import {
  attachAssetService,
  createAssetFromUploadService,
  deleteAssetService,
  detachAssetService,
  exportOrganizationAssetsService,
  getAssetService,
  getAssetUsageGraphService,
  getOrganizationAssetStorageService,
  getYouTubeMetadataService,
  listOrganizationAssetsService,
  updateAssetService
} from '@api/services/assets';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { zValidator } from '@hono/zod-validator';

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
