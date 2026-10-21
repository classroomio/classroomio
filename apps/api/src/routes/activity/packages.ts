import {
  ZPackageCreate,
  ZPackageMakeCurrent,
  ZPackageParam,
  ZPackageVersionCreate,
  ZPackageVersionParam
} from '@cio/utils/validation/activity/package';
import {
  createScormPackage,
  createScormPackageVersion,
  getScormPackage,
  getScormPackageDownloadUrl,
  makeScormPackageVersionCurrent,
  processScormPackageVersion
} from '@cio/core/services/activity/packages';
import { assertActivityKindAllowed } from '@api/services/activity/plan';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';
import { orgTeamMemberMiddleware } from '@api/middlewares/org-team-member';
import { zValidator } from '@hono/zod-validator';

export const packagesRouter = new Hono()
  .post('/', authMiddleware, orgTeamMemberMiddleware, zValidator('json', ZPackageCreate), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const user = c.get('user')!;
      const data = c.req.valid('json');
      await assertActivityKindAllowed(orgId, 'scorm');
      const result = await createScormPackage(orgId, user.id, data);

      return c.json({ success: true, data: result }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to create package');
    }
  })
  .post(
    '/:assetId/versions',
    authMiddleware,
    orgTeamMemberMiddleware,
    zValidator('param', ZPackageParam),
    zValidator('json', ZPackageVersionCreate),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const user = c.get('user')!;
        const { assetId } = c.req.valid('param');
        const data = c.req.valid('json');
        await assertActivityKindAllowed(orgId, 'scorm');
        const result = await createScormPackageVersion(orgId, assetId, user.id, data);
        const status = result.unchanged ? 200 : 201;

        return c.json({ success: true, data: result }, status);
      } catch (error) {
        return handleError(c, error, 'Failed to create package version');
      }
    }
  )
  .post(
    '/:assetId/versions/:versionId/process',
    authMiddleware,
    orgTeamMemberMiddleware,
    zValidator('param', ZPackageVersionParam),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const user = c.get('user')!;
        const { assetId, versionId } = c.req.valid('param');
        await assertActivityKindAllowed(orgId, 'scorm');
        const result = await processScormPackageVersion(orgId, assetId, versionId, user.id);

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to process package');
      }
    }
  )
  .post(
    '/:assetId/versions/:versionId/current',
    authMiddleware,
    orgTeamMemberMiddleware,
    zValidator('param', ZPackageVersionParam),
    zValidator('json', ZPackageMakeCurrent),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const { assetId, versionId } = c.req.valid('param');
        const data = c.req.valid('json');
        await assertActivityKindAllowed(orgId, 'scorm');
        const result = await makeScormPackageVersionCurrent(orgId, assetId, versionId, data);

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to make package version current');
      }
    }
  )
  .get('/:assetId/download', authMiddleware, orgTeamMemberMiddleware, zValidator('param', ZPackageParam), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const { assetId } = c.req.valid('param');
      const result = await getScormPackageDownloadUrl(orgId, assetId);

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to build package download');
    }
  })
  .get('/:assetId', authMiddleware, orgTeamMemberMiddleware, zValidator('param', ZPackageParam), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const { assetId } = c.req.valid('param');
      const result = await getScormPackage(orgId, assetId);

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch package');
    }
  });
