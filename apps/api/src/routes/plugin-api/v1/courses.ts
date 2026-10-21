import { Hono } from '@api/utils/hono';
import {
  getCourseForPlugin,
  getCourseStructureForPlugin,
  listCoursesForPlugin,
  listLessonsForPlugin
} from '@api/services/plugin/content';
import { getCourseEnrollmentForPlugin, listCourseEnrollmentsForPlugin } from '@api/services/plugin/enrollments';
import { listExercisesForPlugin } from '@api/services/plugin/exercises';
import { getCourseProgressForPlugin } from '@api/services/plugin/progress';
import { applyCertificateTemplate, getAppliedCertificateTemplateForPlugin } from '@api/services/plugin/templates';
import { recordPluginAuditEvent } from '@cio/db/queries';
import { handlePluginApiError } from '../errors';
import { AppError } from '@api/utils/errors';
import { describePluginApiRoute } from '../openapi';
import {
  ZPluginApiAppliedCertificateTemplate,
  ZPluginApiApplyCertificateTemplate,
  ZPluginApiApplyCertificateTemplateResult,
  ZPluginApiCourseEnrollment,
  ZPluginApiCourseMetadata,
  ZPluginApiCourseProgress,
  ZPluginApiCourseStructure,
  ZPluginApiCursorPage,
  ZPluginApiExerciseMetadata,
  ZPluginApiLessonMetadata,
  ZPluginApiListQuery
} from '@cio/utils/validation/plugin';
import { z } from 'zod';

const ZCourseExercisesQuery = ZPluginApiListQuery.extend({
  lessonId: z.string().uuid().optional()
});

export const pluginApiCoursesRouter = new Hono()
  .get(
    '/',
    describePluginApiRoute({
      operationId: 'pluginCoursesList',
      summary: 'List courses visible to the current actor',
      scope: 'course.metadata:read'
    }),
    async (c) => {
      const claims = c.get('pluginApiClaims')!;
      const requestId = c.get('pluginApiRequestId') as string;

      if (!claims.scopes.includes('course.metadata:read')) {
        return handlePluginApiError(
          c,
          new AppError('Permission course.metadata:read is required', 'FORBIDDEN', 403),
          'Permission denied'
        );
      }

      try {
        const queryResult = ZPluginApiListQuery.safeParse(c.req.query());
        if (!queryResult.success) {
          throw new AppError('Invalid query parameters', 'VALIDATION_ERROR', 400);
        }

        const listResult = await listCoursesForPlugin(
          claims.installationId,
          claims.organizationId,
          claims.sub,
          queryResult.data
        );
        const data = ZPluginApiCursorPage(ZPluginApiCourseMetadata).parse(listResult);

        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.course.list',
          resource: claims.organizationId,
          outcome: 'success',
          metadata: { requestId, tokenId: claims.jti }
        });

        return c.json({ success: true as const, data, requestId }, 200);
      } catch (error) {
        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.course.list',
          resource: claims.organizationId,
          outcome: 'denied',
          metadata: { requestId, tokenId: claims.jti }
        });

        return handlePluginApiError(c, error, 'Failed to list courses');
      }
    }
  )
  .get(
    '/:courseId',
    describePluginApiRoute({
      operationId: 'pluginCoursesGet',
      summary: 'Get course metadata',
      scope: 'course.metadata:read'
    }),
    async (c) => {
      const claims = c.get('pluginApiClaims')!;
      const requestId = c.get('pluginApiRequestId') as string;
      const courseId = c.req.param('courseId');

      if (!claims.scopes.includes('course.metadata:read')) {
        return handlePluginApiError(
          c,
          new AppError('Permission course.metadata:read is required', 'FORBIDDEN', 403),
          'Permission denied'
        );
      }

      try {
        const course = await getCourseForPlugin(claims.installationId, claims.organizationId, claims.sub, courseId);
        const data = ZPluginApiCourseMetadata.parse(course);

        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.course.get',
          resource: courseId,
          outcome: 'success',
          metadata: { requestId, tokenId: claims.jti }
        });

        return c.json({ success: true as const, data, requestId }, 200);
      } catch (error) {
        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.course.get',
          resource: courseId,
          outcome: 'denied',
          metadata: { requestId, tokenId: claims.jti }
        });

        return handlePluginApiError(c, error, 'Failed to read course');
      }
    }
  )
  .get(
    '/:courseId/structure',
    describePluginApiRoute({
      operationId: 'pluginCourseGetStructure',
      summary: 'Get ordered course section and lesson structure',
      scope: 'course.content:read'
    }),
    async (c) => {
      const claims = c.get('pluginApiClaims')!;
      const requestId = c.get('pluginApiRequestId') as string;
      const courseId = c.req.param('courseId');

      if (!claims.scopes.includes('course.content:read')) {
        return handlePluginApiError(
          c,
          new AppError('Permission course.content:read is required', 'FORBIDDEN', 403),
          'Permission denied'
        );
      }

      try {
        const raw = await getCourseStructureForPlugin(
          claims.installationId,
          claims.organizationId,
          claims.sub,
          courseId
        );
        const data = ZPluginApiCourseStructure.parse(raw);

        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.course.structure',
          resource: courseId,
          outcome: 'success',
          metadata: { requestId, tokenId: claims.jti }
        });

        return c.json({ success: true as const, data, requestId }, 200);
      } catch (error) {
        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.course.structure',
          resource: courseId,
          outcome: 'denied',
          metadata: { requestId, tokenId: claims.jti }
        });

        return handlePluginApiError(c, error, 'Failed to read course structure');
      }
    }
  )
  .get(
    '/:courseId/lessons',
    describePluginApiRoute({
      operationId: 'pluginCourseLessonsList',
      summary: 'List lessons in an accessible course',
      scope: 'lesson.metadata:read'
    }),
    async (c) => {
      const claims = c.get('pluginApiClaims')!;
      const requestId = c.get('pluginApiRequestId') as string;
      const courseId = c.req.param('courseId');

      if (!claims.scopes.includes('lesson.metadata:read')) {
        return handlePluginApiError(
          c,
          new AppError('Permission lesson.metadata:read is required', 'FORBIDDEN', 403),
          'Permission denied'
        );
      }

      try {
        const queryResult = ZPluginApiListQuery.safeParse(c.req.query());
        if (!queryResult.success) {
          throw new AppError('Invalid query parameters', 'VALIDATION_ERROR', 400);
        }

        const listResult = await listLessonsForPlugin(
          claims.installationId,
          claims.organizationId,
          claims.sub,
          courseId,
          queryResult.data
        );
        const data = ZPluginApiCursorPage(ZPluginApiLessonMetadata).parse(listResult);

        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.lesson.list',
          resource: courseId,
          outcome: 'success',
          metadata: { requestId, tokenId: claims.jti }
        });

        return c.json({ success: true as const, data, requestId }, 200);
      } catch (error) {
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
    '/:courseId/progress',
    describePluginApiRoute({
      operationId: 'pluginCourseProgressGet',
      summary: 'Get progress for the current actor and host-bound course',
      scope: 'learner.progress:read'
    }),
    async (c) => {
      const claims = c.get('pluginApiClaims')!;
      const requestId = c.get('pluginApiRequestId') as string;
      const courseId = c.req.param('courseId');

      if (!claims.scopes.includes('learner.progress:read')) {
        return handlePluginApiError(
          c,
          new AppError('Permission learner.progress:read is required', 'FORBIDDEN', 403),
          'Permission denied'
        );
      }

      try {
        const progress = await getCourseProgressForPlugin(
          claims.installationId,
          claims.organizationId,
          claims.sub,
          courseId
        );
        const data = ZPluginApiCourseProgress.parse(progress);

        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.course.progress.read',
          resource: courseId,
          outcome: 'success',
          metadata: { requestId, tokenId: claims.jti }
        });

        return c.json({ success: true as const, data, requestId }, 200);
      } catch (error) {
        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.course.progress.read',
          resource: courseId,
          outcome: 'denied',
          metadata: { requestId, tokenId: claims.jti }
        });

        return handlePluginApiError(c, error, 'Failed to read course progress');
      }
    }
  )
  .get(
    '/:courseId/certificate-template',
    describePluginApiRoute({
      operationId: 'pluginCertificateTemplateGetApplied',
      summary: 'Get the template applied to the host-bound course',
      scope: 'certificate.template:read'
    }),
    async (c) => {
      const claims = c.get('pluginApiClaims')!;
      const requestId = c.get('pluginApiRequestId') as string;
      const courseId = c.req.param('courseId');

      if (!claims.scopes.includes('certificate.template:read')) {
        return handlePluginApiError(
          c,
          new AppError('Permission certificate.template:read is required', 'FORBIDDEN', 403),
          'Permission denied'
        );
      }

      try {
        const template = await getAppliedCertificateTemplateForPlugin(
          claims.installationId,
          claims.organizationId,
          courseId,
          claims.sub
        );
        const data = ZPluginApiAppliedCertificateTemplate.parse(template);

        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.course.certificate.template.get',
          resource: courseId,
          outcome: 'success',
          metadata: { requestId, tokenId: claims.jti }
        });

        return c.json({ success: true as const, data, requestId }, 200);
      } catch (error) {
        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.course.certificate.template.get',
          resource: courseId,
          outcome: 'denied',
          metadata: { requestId, tokenId: claims.jti }
        });

        return handlePluginApiError(c, error, 'Failed to read course certificate template');
      }
    }
  )
  .put(
    '/:courseId/certificate-template',
    describePluginApiRoute({
      operationId: 'pluginCertificateTemplateApply',
      summary: 'Apply a template to the host-bound course',
      scope: 'certificate.template:write'
    }),
    async (c) => {
      const claims = c.get('pluginApiClaims')!;
      const requestId = c.get('pluginApiRequestId') as string;
      const courseId = c.req.param('courseId');

      if (!claims.scopes.includes('certificate.template:write')) {
        return handlePluginApiError(
          c,
          new AppError('Permission certificate.template:write is required', 'FORBIDDEN', 403),
          'Permission denied'
        );
      }

      try {
        const bodyResult = ZPluginApiApplyCertificateTemplate.safeParse(await c.req.json());
        if (!bodyResult.success) {
          throw new AppError('Invalid certificate template payload', 'VALIDATION_ERROR', 400);
        }

        const result = await applyCertificateTemplate({
          installationId: claims.installationId,
          courseId,
          orgId: claims.organizationId,
          userId: claims.sub,
          externalTemplateId: bodyResult.data.externalTemplateId,
          externalTemplateVersion: bodyResult.data.externalTemplateVersion,
          name: bodyResult.data.name,
          design: bodyResult.data.design
        });
        const data = ZPluginApiApplyCertificateTemplateResult.parse(result);

        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.course.certificate.template.apply',
          resource: courseId,
          outcome: 'success',
          metadata: {
            requestId,
            tokenId: claims.jti,
            externalTemplateId: bodyResult.data.externalTemplateId,
            externalTemplateVersion: bodyResult.data.externalTemplateVersion
          }
        });

        return c.json({ success: true as const, data, requestId }, 200);
      } catch (error) {
        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.course.certificate.template.apply',
          resource: courseId,
          outcome: 'denied',
          metadata: { requestId, tokenId: claims.jti }
        });

        return handlePluginApiError(c, error, 'Failed to apply certificate template to course');
      }
    }
  )
  .get(
    '/:courseId/enrollments',
    describePluginApiRoute({
      operationId: 'pluginCourseEnrollmentsList',
      summary: 'List enrollments in an accessible course',
      scope: 'course.enrollment:read'
    }),
    async (c) => {
      const claims = c.get('pluginApiClaims')!;
      const requestId = c.get('pluginApiRequestId') as string;
      const courseId = c.req.param('courseId');

      if (!claims.scopes.includes('course.enrollment:read')) {
        return handlePluginApiError(
          c,
          new AppError('Permission course.enrollment:read is required', 'FORBIDDEN', 403),
          'Permission denied'
        );
      }

      try {
        const queryResult = ZPluginApiListQuery.safeParse(c.req.query());
        if (!queryResult.success) {
          throw new AppError('Invalid query parameters', 'VALIDATION_ERROR', 400);
        }

        const listResult = await listCourseEnrollmentsForPlugin(
          claims.installationId,
          claims.organizationId,
          claims.sub,
          courseId,
          queryResult.data
        );
        const data = ZPluginApiCursorPage(ZPluginApiCourseEnrollment).parse(listResult);

        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.course.enrollment.list',
          resource: courseId,
          outcome: 'success',
          metadata: { requestId, tokenId: claims.jti }
        });

        return c.json({ success: true as const, data, requestId }, 200);
      } catch (error) {
        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.course.enrollment.list',
          resource: courseId,
          outcome: 'denied',
          metadata: { requestId, tokenId: claims.jti }
        });

        return handlePluginApiError(c, error, 'Failed to list course enrollments');
      }
    }
  )
  .get(
    '/:courseId/enrollments/:enrollmentId',
    describePluginApiRoute({
      operationId: 'pluginCourseEnrollmentsGet',
      summary: 'Get enrollment in an accessible course',
      scope: 'course.enrollment:read'
    }),
    async (c) => {
      const claims = c.get('pluginApiClaims')!;
      const requestId = c.get('pluginApiRequestId') as string;
      const courseId = c.req.param('courseId');
      const enrollmentId = c.req.param('enrollmentId');

      if (!claims.scopes.includes('course.enrollment:read')) {
        return handlePluginApiError(
          c,
          new AppError('Permission course.enrollment:read is required', 'FORBIDDEN', 403),
          'Permission denied'
        );
      }

      try {
        const enrollment = await getCourseEnrollmentForPlugin(
          claims.installationId,
          claims.organizationId,
          claims.sub,
          courseId,
          enrollmentId
        );
        const data = ZPluginApiCourseEnrollment.parse(enrollment);

        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.course.enrollment.get',
          resource: enrollmentId,
          outcome: 'success',
          metadata: { requestId, tokenId: claims.jti }
        });

        return c.json({ success: true as const, data, requestId }, 200);
      } catch (error) {
        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.course.enrollment.get',
          resource: enrollmentId,
          outcome: 'denied',
          metadata: { requestId, tokenId: claims.jti }
        });

        return handlePluginApiError(c, error, 'Failed to read course enrollment');
      }
    }
  )
  .get(
    '/:courseId/exercises',
    describePluginApiRoute({
      operationId: 'pluginCourseExercisesList',
      summary: 'List exercises in an accessible course',
      scope: 'exercise.metadata:read'
    }),
    async (c) => {
      const claims = c.get('pluginApiClaims')!;
      const requestId = c.get('pluginApiRequestId') as string;
      const courseId = c.req.param('courseId');

      if (!claims.scopes.includes('exercise.metadata:read')) {
        return handlePluginApiError(
          c,
          new AppError('Permission exercise.metadata:read is required', 'FORBIDDEN', 403),
          'Permission denied'
        );
      }

      try {
        const queryResult = ZCourseExercisesQuery.safeParse(c.req.query());
        if (!queryResult.success) {
          throw new AppError('Invalid query parameters', 'VALIDATION_ERROR', 400);
        }

        const listResult = await listExercisesForPlugin(
          claims.installationId,
          claims.organizationId,
          claims.sub,
          courseId,
          queryResult.data
        );
        const data = ZPluginApiCursorPage(ZPluginApiExerciseMetadata).parse(listResult);

        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.exercise.list',
          resource: courseId,
          outcome: 'success',
          metadata: { requestId, tokenId: claims.jti }
        });

        return c.json({ success: true as const, data, requestId }, 200);
      } catch (error) {
        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.exercise.list',
          resource: courseId,
          outcome: 'denied',
          metadata: { requestId, tokenId: claims.jti }
        });

        return handlePluginApiError(c, error, 'Failed to list course exercises');
      }
    }
  );
