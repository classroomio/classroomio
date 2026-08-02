import { ZAutomationDraftTagAssignment, ZAutomationDraftTagParam } from '@cio/utils/validation/tag';
import {
  ZCourseImportCourseParam,
  ZCourseImportDraftCreate,
  ZCourseImportDraftCreateFromCourse,
  ZCourseImportDraftGetParam,
  ZCourseImportDraftPublish,
  ZCourseImportDraftPublishToCourse,
  ZCourseImportDraftUpdate
} from '@cio/utils/validation/course-import';
import {
  createCourseImportDraftFromCourseService,
  createCourseImportDraftService,
  getCourseImportDraftService,
  getCourseImportStructureService,
  publishCourseImportDraftService,
  publishCourseImportDraftToExistingCourseService,
  updateCourseImportDraftTagsService,
  updateCourseImportDraftService
} from '@api/services/course-import/course-import';
import { withMcpAutomationUsage } from '@api/services/organization/automation-usage';

import { Hono } from '@api/utils/hono';
import { authOrAutomationKeyMiddleware } from '@api/middlewares/auth-or-automation-key';
import { handleError } from '@api/utils/errors';
import { orgAdminOrAutomationKeyMiddleware } from '@api/middlewares/org-admin-or-automation-key';
import { zValidator } from '@hono/zod-validator';

export const courseImportRouter = new Hono()
  .get(
    '/courses/:courseId/structure',
    authOrAutomationKeyMiddleware,
    orgAdminOrAutomationKeyMiddleware(['course_import:draft:read']),
    zValidator('param', ZCourseImportCourseParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const automationKey = c.get('automationKey');
        const { courseId } = c.req.valid('param');

        const structure = await withMcpAutomationUsage(
          automationKey,
          'get_course_structure',
          () => getCourseImportStructureService(orgId, courseId),
          () => ({ courseId })
        );

        return c.json({ success: true, data: structure }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to fetch course structure');
      }
    }
  )
  .post(
    '/drafts',
    authOrAutomationKeyMiddleware,
    orgAdminOrAutomationKeyMiddleware(['course_import:draft:create']),
    zValidator('json', ZCourseImportDraftCreate),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId')!;
        const automationKey = c.get('automationKey');
        const payload = c.req.valid('json');

        const draft = await withMcpAutomationUsage(
          automationKey,
          'create_course_draft',
          () => createCourseImportDraftService(orgId, actorId, payload),
          (draft) => ({ draftId: draft.id })
        );

        return c.json({ success: true, data: draft }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to create course import draft');
      }
    }
  )
  .post(
    '/drafts/from-course',
    authOrAutomationKeyMiddleware,
    orgAdminOrAutomationKeyMiddleware(['course_import:draft:create']),
    zValidator('json', ZCourseImportDraftCreateFromCourse),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId')!;
        const automationKey = c.get('automationKey');
        const payload = c.req.valid('json');

        const draft = await withMcpAutomationUsage(
          automationKey,
          'create_course_draft_from_course',
          () => createCourseImportDraftFromCourseService(orgId, actorId, payload),
          (draft) => ({
            draftId: draft.id,
            courseId: payload.courseId
          })
        );

        return c.json({ success: true, data: draft }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to create course draft from existing course');
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
        const automationKey = c.get('automationKey');
        const { draftId } = c.req.valid('param');

        const draft = await withMcpAutomationUsage(
          automationKey,
          'get_course_draft',
          () => getCourseImportDraftService(orgId, draftId),
          () => ({ draftId })
        );

        return c.json({ success: true, data: draft }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to fetch course import draft');
      }
    }
  )
  .put(
    '/drafts/:draftId/tags',
    authOrAutomationKeyMiddleware,
    orgAdminOrAutomationKeyMiddleware(['course_import:draft:update']),
    zValidator('param', ZAutomationDraftTagParam),
    zValidator('json', ZAutomationDraftTagAssignment),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const automationKey = c.get('automationKey');
        const { draftId } = c.req.valid('param');
        const payload = c.req.valid('json');

        const draft = await withMcpAutomationUsage(
          automationKey,
          'tag_course_draft',
          () => updateCourseImportDraftTagsService(orgId, draftId, payload.tagNames, payload.mode),
          () => ({ draftId })
        );

        return c.json({ success: true, data: draft }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update course draft tags');
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
        const automationKey = c.get('automationKey');
        const { draftId } = c.req.valid('param');
        const payload = c.req.valid('json');

        const draft = await withMcpAutomationUsage(
          automationKey,
          'update_course_draft',
          () => updateCourseImportDraftService(orgId, draftId, payload),
          () => ({ draftId })
        );

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
        const automationKey = c.get('automationKey');
        const { draftId } = c.req.valid('param');
        const payload = c.req.valid('json');

        const result = await withMcpAutomationUsage(
          automationKey,
          'publish_course_draft',
          () => publishCourseImportDraftService(orgId, actorId, draftId, payload),
          (result) => ({
            draftId,
            courseId: result.courseId
          })
        );

        return c.json({ success: true, data: result }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to publish course import draft');
      }
    }
  )
  .post(
    '/drafts/:draftId/publish-existing-course',
    authOrAutomationKeyMiddleware,
    orgAdminOrAutomationKeyMiddleware(['course_import:draft:publish']),
    zValidator('param', ZCourseImportDraftGetParam),
    zValidator('json', ZCourseImportDraftPublishToCourse),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const automationKey = c.get('automationKey');
        const { draftId } = c.req.valid('param');
        const payload = c.req.valid('json');

        const result = await withMcpAutomationUsage(
          automationKey,
          'publish_course_draft_to_existing_course',
          () => publishCourseImportDraftToExistingCourseService(orgId, draftId, payload),
          () => ({
            draftId,
            courseId: payload.courseId
          })
        );

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to publish course draft to existing course');
      }
    }
  );
