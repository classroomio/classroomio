import {
  ZTagCreate,
  ZTagGroupCreate,
  ZTagGroupParam,
  ZTagGroupUpdate,
  ZTagParam,
  ZTagUpdate
} from '@cio/utils/validation/tag';
import {
  createOrganizationTag,
  createOrganizationTagGroup,
  getPublicOrganizationTagGroups,
  getOrganizationTagGroups,
  updateOrganizationTag,
  updateOrganizationTagGroup
} from '@api/services/tag';
import { ZGetCoursesBySiteName } from '@cio/utils/validation/organization';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { zValidator } from '@hono/zod-validator';

export const tagsRouter = new Hono()
  .get('/public', zValidator('query', ZGetCoursesBySiteName), async (c) => {
    try {
      const { siteName } = c.req.valid('query');
      const groups = await getPublicOrganizationTagGroups(siteName);

      return c.json(
        {
          success: true,
          data: groups
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to fetch public tags');
    }
  })
  .get('/', authMiddleware, orgAdminMiddleware, async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const groups = await getOrganizationTagGroups(orgId);

      return c.json(
        {
          success: true,
          data: groups
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to fetch tags');
    }
  })
  .post('/groups', authMiddleware, orgAdminMiddleware, zValidator('json', ZTagGroupCreate), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const data = c.req.valid('json');
      const group = await createOrganizationTagGroup(orgId, data);

      return c.json(
        {
          success: true,
          data: group
        },
        201
      );
    } catch (error) {
      return handleError(c, error, 'Failed to create tag group');
    }
  })
  .put(
    '/groups/:groupId',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('param', ZTagGroupParam),
    zValidator('json', ZTagGroupUpdate),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const { groupId } = c.req.valid('param');
        const data = c.req.valid('json');
        const group = await updateOrganizationTagGroup(orgId, groupId, data);

        return c.json(
          {
            success: true,
            data: group
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to update tag group');
      }
    }
  )
  .post('/', authMiddleware, orgAdminMiddleware, zValidator('json', ZTagCreate), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const data = c.req.valid('json');
      const tag = await createOrganizationTag(orgId, data);

      return c.json(
        {
          success: true,
          data: tag
        },
        201
      );
    } catch (error) {
      return handleError(c, error, 'Failed to create tag');
    }
  })
  .put(
    '/:tagId',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('param', ZTagParam),
    zValidator('json', ZTagUpdate),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const { tagId } = c.req.valid('param');
        const data = c.req.valid('json');
        const tag = await updateOrganizationTag(orgId, tagId, data);

        return c.json(
          {
            success: true,
            data: tag
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to update tag');
      }
    }
  );
