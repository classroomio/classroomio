import { Hono } from '@api/utils/hono';
import { getLessonContentForPlugin, getLessonForPlugin, listLessonsForPlugin } from '@api/services/plugin/content';
import {
  getLessonCompletionForPlugin,
  resetLessonCompletionForPlugin,
  setLessonCompletionForPlugin
} from '@api/services/plugin/progress';
import { recordPluginAuditEvent } from '@cio/db/queries';
import { handlePluginApiError } from '../errors';
import { AppError } from '@api/utils/errors';
import { describePluginApiRoute } from '../openapi';
import {
  ZPluginApiCursorPage,
  ZPluginApiLessonContent,
  ZPluginApiLessonListQuery,
  ZPluginApiLessonMetadata,
  ZPluginApiLessonProgress,
  ZPluginApiLessonProgressUpdate
} from '@cio/utils/validation/plugin';

export const pluginApiLessonsRouter = new Hono()
  .get(
    '/',
    describePluginApiRoute({
      operationId: 'pluginLessonsList',
      summary: 'List lessons in an accessible course',
      scope: 'lesson.metadata:read'
    }),
    async (c) => {
      const claims = c.get('pluginApiClaims')!;
      const requestId = c.get('pluginApiRequestId') as string;

      if (!claims.scopes.includes('lesson.metadata:read')) {
        return handlePluginApiError(
          c,
          new AppError('Permission lesson.metadata:read is required', 'FORBIDDEN', 403),
          'Permission denied'
        );
      }

      try {
        const queryResult = ZPluginApiLessonListQuery.safeParse(c.req.query());
        if (!queryResult.success || !queryResult.data.courseId) {
          throw new AppError('Query parameter courseId is required', 'VALIDATION_ERROR', 400);
        }

        const listResult = await listLessonsForPlugin(
          claims.installationId,
          claims.organizationId,
          claims.sub,
          queryResult.data.courseId,
          queryResult.data
        );
        const data = ZPluginApiCursorPage(ZPluginApiLessonMetadata).parse(listResult);

        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.lesson.list',
          resource: queryResult.data.courseId,
          outcome: 'success',
          metadata: { requestId, tokenId: claims.jti }
        });

        return c.json({ success: true as const, data, requestId }, 200);
      } catch (error) {
        const courseId = c.req.query('courseId') ?? claims.organizationId;
        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.lesson.list',
          resource: courseId,
          outcome: 'denied',
          metadata: { requestId, tokenId: claims.jti }
        });

        return handlePluginApiError(c, error, 'Failed to list lessons');
      }
    }
  )
  .get(
    '/:lessonId',
    describePluginApiRoute({
      operationId: 'pluginLessonsGet',
      summary: 'Get lesson metadata',
      scope: 'lesson.metadata:read'
    }),
    async (c) => {
      const claims = c.get('pluginApiClaims')!;
      const requestId = c.get('pluginApiRequestId') as string;
      const lessonId = c.req.param('lessonId');

      if (!claims.scopes.includes('lesson.metadata:read')) {
        return handlePluginApiError(
          c,
          new AppError('Permission lesson.metadata:read is required', 'FORBIDDEN', 403),
          'Permission denied'
        );
      }

      try {
        const lesson = await getLessonForPlugin(claims.installationId, claims.organizationId, claims.sub, lessonId);
        const data = ZPluginApiLessonMetadata.parse(lesson);

        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.lesson.get',
          resource: lessonId,
          outcome: 'success',
          metadata: { requestId, tokenId: claims.jti }
        });

        return c.json({ success: true as const, data, requestId }, 200);
      } catch (error) {
        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.lesson.get',
          resource: lessonId,
          outcome: 'denied',
          metadata: { requestId, tokenId: claims.jti }
        });

        return handlePluginApiError(c, error, 'Failed to read lesson');
      }
    }
  )
  .get(
    '/:lessonId/content',
    describePluginApiRoute({
      operationId: 'pluginLessonGetContent',
      summary: 'Get sanitized lesson content and attachments',
      scope: 'lesson.content:read'
    }),
    async (c) => {
      const claims = c.get('pluginApiClaims')!;
      const requestId = c.get('pluginApiRequestId') as string;
      const lessonId = c.req.param('lessonId');

      if (!claims.scopes.includes('lesson.content:read')) {
        return handlePluginApiError(
          c,
          new AppError('Permission lesson.content:read is required', 'FORBIDDEN', 403),
          'Permission denied'
        );
      }

      try {
        const lessonContent = await getLessonContentForPlugin(
          claims.installationId,
          claims.organizationId,
          claims.sub,
          lessonId
        );
        const data = ZPluginApiLessonContent.parse(lessonContent);

        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.lesson.content',
          resource: lessonId,
          outcome: 'success',
          metadata: { requestId, tokenId: claims.jti }
        });

        return c.json({ success: true as const, data, requestId }, 200);
      } catch (error) {
        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.lesson.content',
          resource: lessonId,
          outcome: 'denied',
          metadata: { requestId, tokenId: claims.jti }
        });

        return handlePluginApiError(c, error, 'Failed to read lesson content');
      }
    }
  )
  .get(
    '/:lessonId/progress',
    describePluginApiRoute({
      operationId: 'pluginLessonProgressGet',
      summary: 'Get completion for the current actor and host-bound lesson',
      scope: 'learner.progress:read'
    }),
    async (c) => {
      const claims = c.get('pluginApiClaims')!;
      const requestId = c.get('pluginApiRequestId') as string;
      const lessonId = c.req.param('lessonId');

      if (!claims.scopes.includes('learner.progress:read')) {
        return handlePluginApiError(
          c,
          new AppError('Permission learner.progress:read is required', 'FORBIDDEN', 403),
          'Permission denied'
        );
      }

      try {
        const completion = await getLessonCompletionForPlugin(
          claims.installationId,
          claims.organizationId,
          claims.sub,
          lessonId
        );
        const data = ZPluginApiLessonProgress.parse(completion);

        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.lesson.progress.read',
          resource: lessonId,
          outcome: 'success',
          metadata: { requestId, tokenId: claims.jti }
        });

        return c.json({ success: true as const, data, requestId }, 200);
      } catch (error) {
        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.lesson.progress.read',
          resource: lessonId,
          outcome: 'denied',
          metadata: { requestId, tokenId: claims.jti }
        });

        return handlePluginApiError(c, error, 'Failed to read lesson progress');
      }
    }
  )
  .put(
    '/:lessonId/progress',
    describePluginApiRoute({
      operationId: 'pluginLessonProgressSet',
      summary: 'Set completion for the current actor and host-bound lesson',
      scope: 'learner.progress:write'
    }),
    async (c) => {
      const claims = c.get('pluginApiClaims')!;
      const requestId = c.get('pluginApiRequestId') as string;
      const lessonId = c.req.param('lessonId');

      if (!claims.scopes.includes('learner.progress:write')) {
        return handlePluginApiError(
          c,
          new AppError('Permission learner.progress:write is required', 'FORBIDDEN', 403),
          'Permission denied'
        );
      }

      try {
        const bodyResult = ZPluginApiLessonProgressUpdate.safeParse(await c.req.json());
        if (!bodyResult.success) {
          throw new AppError('Invalid progress update payload', 'VALIDATION_ERROR', 400);
        }

        const completion = await setLessonCompletionForPlugin(
          claims.installationId,
          claims.organizationId,
          claims.sub,
          lessonId,
          bodyResult.data.isComplete
        );
        const data = ZPluginApiLessonProgress.parse(completion);

        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.lesson.progress.write',
          resource: lessonId,
          outcome: 'success',
          metadata: { requestId, tokenId: claims.jti }
        });

        return c.json({ success: true as const, data, requestId }, 200);
      } catch (error) {
        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.lesson.progress.write',
          resource: lessonId,
          outcome: 'denied',
          metadata: { requestId, tokenId: claims.jti }
        });

        return handlePluginApiError(c, error, 'Failed to update lesson progress');
      }
    }
  )
  .delete(
    '/:lessonId/progress',
    describePluginApiRoute({
      operationId: 'pluginLessonProgressReset',
      summary: 'Reset completion for the current actor and host-bound lesson',
      scope: 'learner.progress:write'
    }),
    async (c) => {
      const claims = c.get('pluginApiClaims')!;
      const requestId = c.get('pluginApiRequestId') as string;
      const lessonId = c.req.param('lessonId');

      if (!claims.scopes.includes('learner.progress:write')) {
        return handlePluginApiError(
          c,
          new AppError('Permission learner.progress:write is required', 'FORBIDDEN', 403),
          'Permission denied'
        );
      }

      try {
        const completion = await resetLessonCompletionForPlugin(
          claims.installationId,
          claims.organizationId,
          claims.sub,
          lessonId
        );
        const data = ZPluginApiLessonProgress.parse(completion);

        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.lesson.progress.write',
          resource: lessonId,
          outcome: 'success',
          metadata: { requestId, tokenId: claims.jti }
        });

        return c.json({ success: true as const, data, requestId }, 200);
      } catch (error) {
        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.lesson.progress.write',
          resource: lessonId,
          outcome: 'denied',
          metadata: { requestId, tokenId: claims.jti }
        });

        return handlePluginApiError(c, error, 'Failed to reset lesson progress');
      }
    }
  );
