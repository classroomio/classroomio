import {
  ZCourseTemplateParam,
  ZCreateCourseFromTemplate,
  ZPullTemplateUpdates,
  ZSaveCourseTemplate,
  ZTemplateListQuery,
  ZTemplatePreviewParam,
  ZTemplatePreviewQuery
} from '@cio/utils/validation/course';
import { ROLE } from '@cio/utils/constants';

import { Hono } from '@api/utils/hono';
import { AppError, ErrorCodes, handleError } from '@api/utils/errors';
import { authMiddleware } from '@api/middlewares/auth';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import {
  convertCourseToTemplate,
  createCourseFromTemplate,
  duplicateCourseTemplate,
  getCourseTemplatePreview,
  listCourseTemplates,
  saveCourseAsTemplate
} from '@api/services/course/course-template';
import { getCourseTemplateUpdates, pullCourseTemplateUpdates } from '@api/services/course/template-sync';
import { zValidator } from '@hono/zod-validator';

function orgIdFromHeader(header: string | undefined) {
  if (!header) {
    throw new AppError('Organization ID is required', ErrorCodes.NO_ORG_ID_PROVIDED, 400);
  }

  return header;
}

function assertTeacher(orgRoles: Record<string, number> | undefined, orgId: string) {
  const roleId = orgRoles?.[orgId];
  if (roleId !== ROLE.ADMIN && roleId !== ROLE.TUTOR) {
    throw new AppError('Only teachers can view templates', ErrorCodes.ORG_TEAM_NOT_AUTHORIZED, 403);
  }
}

export const courseTemplateRouter = new Hono()
  .get('/', authMiddleware, orgMemberMiddleware, zValidator('query', ZTemplateListQuery), async (c) => {
    try {
      const orgId = orgIdFromHeader(c.req.header('cio-org-id'));
      assertTeacher(c.get('orgRoles') as Record<string, number> | undefined, orgId);
      const { organizationId } = c.req.valid('query');
      if (organizationId !== orgId) {
        throw new AppError('Organization ID is required', ErrorCodes.NO_ORG_ID_PROVIDED, 400);
      }

      const data = await listCourseTemplates(orgId);
      return c.json({ success: true, data });
    } catch (error) {
      return handleError(c, error, 'Failed to list templates');
    }
  })
  .get(
    '/:templateId/preview',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZTemplatePreviewParam),
    zValidator('query', ZTemplatePreviewQuery),
    async (c) => {
      try {
        const orgId = orgIdFromHeader(c.req.header('cio-org-id'));
        assertTeacher(c.get('orgRoles') as Record<string, number> | undefined, orgId);
        const { templateId } = c.req.valid('param');
        const { organizationId } = c.req.valid('query');
        if (organizationId !== orgId) {
          throw new AppError('Organization ID is required', ErrorCodes.NO_ORG_ID_PROVIDED, 400);
        }

        const data = await getCourseTemplatePreview(templateId, orgId);
        return c.json({ success: true, data });
      } catch (error) {
        return handleError(c, error, 'Failed to preview template');
      }
    }
  )
  .post(
    '/:templateId/course',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('param', ZTemplatePreviewParam),
    zValidator('json', ZCreateCourseFromTemplate),
    async (c) => {
      try {
        const orgId = orgIdFromHeader(c.req.header('cio-org-id'));
        const user = c.get('user')!;
        const { templateId } = c.req.valid('param');
        const { title, organizationId } = c.req.valid('json');
        if (organizationId !== orgId) {
          throw new AppError('Organization ID is required', ErrorCodes.NO_ORG_ID_PROVIDED, 400);
        }

        const data = await createCourseFromTemplate(templateId, orgId, user.id, title);
        return c.json({ success: true, data }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to create course from template');
      }
    }
  )
  .post(
    '/:templateId/duplicate',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('param', ZTemplatePreviewParam),
    async (c) => {
      try {
        const orgId = orgIdFromHeader(c.req.header('cio-org-id'));
        const user = c.get('user')!;
        const { templateId } = c.req.valid('param');
        const data = await duplicateCourseTemplate(templateId, orgId, user.id);
        return c.json({ success: true, data }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to duplicate template');
      }
    }
  );

export const courseTemplateActionsRouter = new Hono()
  .post(
    '/',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('param', ZCourseTemplateParam),
    zValidator('json', ZSaveCourseTemplate),
    async (c) => {
      try {
        const orgId = orgIdFromHeader(c.req.header('cio-org-id'));
        const user = c.get('user')!;
        const { courseId } = c.req.valid('param');
        const { title } = c.req.valid('json');
        const data = await saveCourseAsTemplate(courseId, orgId, user.id, title);
        return c.json({ success: true, data }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to save template');
      }
    }
  )
  .post('/convert', authMiddleware, orgAdminMiddleware, zValidator('param', ZCourseTemplateParam), async (c) => {
    try {
      const orgId = orgIdFromHeader(c.req.header('cio-org-id'));
      const { courseId } = c.req.valid('param');
      const data = await convertCourseToTemplate(courseId, orgId);
      return c.json({ success: true, data });
    } catch (error) {
      return handleError(c, error, 'Failed to convert course');
    }
  });

export const courseTemplateUpdatesRouter = new Hono()
  .get('/', authMiddleware, orgAdminMiddleware, zValidator('param', ZCourseTemplateParam), async (c) => {
    try {
      const orgId = orgIdFromHeader(c.req.header('cio-org-id'));
      const { courseId } = c.req.valid('param');
      const data = await getCourseTemplateUpdates(courseId, orgId);
      return c.json({ success: true, data });
    } catch (error) {
      return handleError(c, error, 'Failed to load template updates');
    }
  })
  .post(
    '/pull',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('param', ZCourseTemplateParam),
    zValidator('json', ZPullTemplateUpdates),
    async (c) => {
      try {
        const orgId = orgIdFromHeader(c.req.header('cio-org-id'));
        const user = c.get('user')!;
        const { courseId } = c.req.valid('param');
        const { unitIds, settingKeys } = c.req.valid('json');
        const data = await pullCourseTemplateUpdates(courseId, orgId, user.id, unitIds, settingKeys);
        return c.json({ success: true, data });
      } catch (error) {
        return handleError(c, error, 'Failed to pull template updates');
      }
    }
  );
