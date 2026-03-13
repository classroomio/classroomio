import {
  ZCourseImportDraftCreate,
  ZCourseImportDraftGetParam,
  ZCourseImportDraftPublish,
  ZCourseImportDraftUpdate
} from '@cio/utils/validation/course-import';
import {
  createCourseImportDraftService,
  getCourseImportDraftService,
  publishCourseImportDraftService,
  updateCourseImportDraftService
} from '@api/services/course-import/course-import';

import { Hono } from '@api/utils/hono';
import { authOrAutomationKeyMiddleware } from '@api/middlewares/auth-or-automation-key';
import { handleError } from '@api/utils/errors';
import { orgAdminOrAutomationKeyMiddleware } from '@api/middlewares/org-admin-or-automation-key';
import { zValidator } from '@hono/zod-validator';

export const courseImportRouter = new Hono()
  .post(
    '/drafts',
    authOrAutomationKeyMiddleware,
    orgAdminOrAutomationKeyMiddleware(['course_import:draft:create']),
    zValidator('json', ZCourseImportDraftCreate),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId')!;
        const payload = c.req.valid('json');

        const draft = await createCourseImportDraftService(orgId, actorId, payload);

        return c.json({ success: true, data: draft }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to create course import draft');
      }
    }
  )
  .get(
    '/drafts/:draftId',
    authOrAutomationKeyMiddleware,
    orgAdminOrAutomationKeyMiddleware(['course_import:draft:read']),
    zValidator('param', ZCourseImportDraftGetParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const { draftId } = c.req.valid('param');

        const draft = await getCourseImportDraftService(orgId, draftId);

        return c.json({ success: true, data: draft }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to fetch course import draft');
      }
    }
  )
  .put(
    '/drafts/:draftId',
    authOrAutomationKeyMiddleware,
    orgAdminOrAutomationKeyMiddleware(['course_import:draft:update']),
    zValidator('param', ZCourseImportDraftGetParam),
    zValidator('json', ZCourseImportDraftUpdate),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const { draftId } = c.req.valid('param');
        const payload = c.req.valid('json');

        const draft = await updateCourseImportDraftService(orgId, draftId, payload);

        return c.json({ success: true, data: draft }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update course import draft');
      }
    }
  )
  .post(
    '/drafts/:draftId/publish',
    authOrAutomationKeyMiddleware,
    orgAdminOrAutomationKeyMiddleware(['course_import:draft:publish']),
    zValidator('param', ZCourseImportDraftGetParam),
    zValidator('json', ZCourseImportDraftPublish),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId')!;
        const { draftId } = c.req.valid('param');
        const payload = c.req.valid('json');

        const result = await publishCourseImportDraftService(orgId, actorId, draftId, payload);

        return c.json({ success: true, data: result }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to publish course import draft');
      }
    }
  );
