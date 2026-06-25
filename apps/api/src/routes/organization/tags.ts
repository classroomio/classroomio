import {
  ZAutomationCourseTagAssignment,
  ZTagCreate,
  ZTagGroupCreate,
  ZTagGroupParam,
  ZTagGroupUpdate,
  ZTagParam,
  ZTagUpdate
} from '@cio/utils/validation/tag';
import {
  assignTagsToCoursesByName,
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
import { authOrAutomationKeyMiddleware } from '@api/middlewares/auth-or-automation-key';
import { handleError } from '@api/utils/errors';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { orgAdminOrAutomationKeyMiddleware } from '@api/middlewares/org-admin-or-automation-key';
import { assertMcpAutomationUsageAllowed, recordMcpAutomationUsage } from '@api/services/organization/automation-usage';
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
  .get('/', authMiddleware, orgMemberMiddleware, async (c) => {
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
    '/courses/assign',
    authOrAutomationKeyMiddleware,
    orgAdminOrAutomationKeyMiddleware(['course:tag:write']),
    zValidator('json', ZAutomationCourseTagAssignment),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const automationKey = c.get('automationKey');
        const data = c.req.valid('json');

        if (automationKey?.type === 'mcp') {
          await assertMcpAutomationUsageAllowed(automationKey, 'tag_courses');
        }

        const result = await assignTagsToCoursesByName(orgId, data);

        if (automationKey?.type === 'mcp') {
          await recordMcpAutomationUsage(automationKey, 'tag_courses', { courseIds: data.courseIds });
        }

        return c.json(
          {
            success: true,
            data: result
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to assign course tags');
      }
    }
  )
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
