import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { orgTeamMemberMiddleware } from '@api/middlewares/org-team-member';
import {
  ZCreateWidget,
  ZPreviewWidget,
  ZRollbackWidget,
  ZUpdateWidget,
  ZWidgetIdParams
} from '@cio/utils/validation/widget';
import {
  createOrganizationWidget,
  deleteOrganizationWidget,
  getOrganizationWidgetDetail,
  listOrganizationWidgets,
  previewOrganizationWidget,
  publishOrganizationWidget,
  rollbackOrganizationWidget,
  updateOrganizationWidget
} from '@api/services/widget';
import { zValidator } from '@hono/zod-validator';

export const widgetsRouter = new Hono()
  .get('/', authMiddleware, orgTeamMemberMiddleware, async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const widgets = await listOrganizationWidgets(orgId);
      return c.json({ success: true, data: widgets });
    } catch (error) {
      return handleError(c, error, 'Failed to fetch widgets');
    }
  })
  .post('/', authMiddleware, orgTeamMemberMiddleware, zValidator('json', ZCreateWidget), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const user = c.get('user')!;
      const data = c.req.valid('json');
      const widget = await createOrganizationWidget(orgId, user.id, data);

      return c.json({ success: true, data: widget }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to create widget');
    }
  })
  .get('/:widgetId', authMiddleware, orgTeamMemberMiddleware, zValidator('param', ZWidgetIdParams), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const { widgetId } = c.req.valid('param');
      const widgetDetail = await getOrganizationWidgetDetail(orgId, widgetId);

      return c.json({ success: true, data: widgetDetail });
    } catch (error) {
      return handleError(c, error, 'Failed to fetch widget');
    }
  })
  .put(
    '/:widgetId',
    authMiddleware,
    orgTeamMemberMiddleware,
    zValidator('param', ZWidgetIdParams),
    zValidator('json', ZUpdateWidget),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const user = c.get('user')!;
        const { widgetId } = c.req.valid('param');
        const data = c.req.valid('json');
        const widget = await updateOrganizationWidget(orgId, widgetId, user.id, data);

        return c.json({ success: true, data: widget });
      } catch (error) {
        return handleError(c, error, 'Failed to update widget');
      }
    }
  )
  .delete('/:widgetId', authMiddleware, orgAdminMiddleware, zValidator('param', ZWidgetIdParams), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const user = c.get('user')!;
      const { widgetId } = c.req.valid('param');
      const widget = await deleteOrganizationWidget(orgId, widgetId, user.id);

      return c.json({ success: true, data: widget });
    } catch (error) {
      return handleError(c, error, 'Failed to delete widget');
    }
  })
  .post(
    '/:widgetId/preview',
    authMiddleware,
    orgTeamMemberMiddleware,
    zValidator('param', ZWidgetIdParams),
    zValidator('json', ZPreviewWidget),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const { widgetId } = c.req.valid('param');
        const data = c.req.valid('json');
        const payload = await previewOrganizationWidget(orgId, widgetId, data);

        return c.json({ success: true, data: payload });
      } catch (error) {
        return handleError(c, error, 'Failed to build widget preview');
      }
    }
  )
  .post('/:widgetId/publish', authMiddleware, orgAdminMiddleware, zValidator('param', ZWidgetIdParams), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const user = c.get('user')!;
      const { widgetId } = c.req.valid('param');
      const result = await publishOrganizationWidget(orgId, widgetId, user.id);

      return c.json({ success: true, data: result });
    } catch (error) {
      return handleError(c, error, 'Failed to publish widget');
    }
  })
  .post(
    '/:widgetId/rollback',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('param', ZWidgetIdParams),
    zValidator('json', ZRollbackWidget),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const user = c.get('user')!;
        const { widgetId } = c.req.valid('param');
        const data = c.req.valid('json');
        const result = await rollbackOrganizationWidget(orgId, widgetId, user.id, data);

        return c.json({ success: true, data: result });
      } catch (error) {
        return handleError(c, error, 'Failed to rollback widget');
      }
    }
  );
