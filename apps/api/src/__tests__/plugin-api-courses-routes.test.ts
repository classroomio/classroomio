import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@api/utils/errors';

const mocks = vi.hoisted(() => ({
  verifyPluginApiAccessToken: vi.fn(),
  listCoursesForPlugin: vi.fn(),
  getCourseForPlugin: vi.fn(),
  getCourseStructureForPlugin: vi.fn(),
  listLessonsForPlugin: vi.fn(),
  getCourseProgressForPlugin: vi.fn(),
  listCourseEnrollmentsForPlugin: vi.fn(),
  getCourseEnrollmentForPlugin: vi.fn(),
  listExercisesForPlugin: vi.fn(),
  getAppliedCertificateTemplateForPlugin: vi.fn(),
  applyCertificateTemplate: vi.fn(),
  recordPluginAuditEvent: vi.fn()
}));

vi.mock('@api/services/plugin/access-token', () => ({
  verifyPluginApiAccessToken: mocks.verifyPluginApiAccessToken
}));
vi.mock('@api/services/plugin/content', () => ({
  listCoursesForPlugin: mocks.listCoursesForPlugin,
  getCourseForPlugin: mocks.getCourseForPlugin,
  getCourseStructureForPlugin: mocks.getCourseStructureForPlugin,
  listLessonsForPlugin: mocks.listLessonsForPlugin
}));
vi.mock('@api/services/plugin/enrollments', () => ({
  listCourseEnrollmentsForPlugin: mocks.listCourseEnrollmentsForPlugin,
  getCourseEnrollmentForPlugin: mocks.getCourseEnrollmentForPlugin
}));
vi.mock('@api/services/plugin/exercises', () => ({
  listExercisesForPlugin: mocks.listExercisesForPlugin
}));
vi.mock('@api/services/plugin/progress', () => ({
  getCourseProgressForPlugin: mocks.getCourseProgressForPlugin
}));
vi.mock('@api/services/plugin/templates', () => ({
  getAppliedCertificateTemplateForPlugin: mocks.getAppliedCertificateTemplateForPlugin,
  applyCertificateTemplate: mocks.applyCertificateTemplate
}));
vi.mock('@cio/db/queries', () => ({ recordPluginAuditEvent: mocks.recordPluginAuditEvent }));

import { pluginApiRouter } from '@api/routes/plugin-api';

describe('plugin API courses routes', () => {
  const claims = {
    iss: 'classroomio' as const,
    aud: 'classroomio:plugin-api:v1' as const,
    sub: '2194bd50-7590-41e3-b381-917dc347176f',
    jti: '93567c57-d8a4-4bf6-a9c7-01c65ef42f50',
    iat: 1,
    exp: 4_000_000_000,
    pluginId: 'com.classroomio.certificate-studio',
    versionId: '747b1324-b281-43d3-b468-032727fe5819',
    installationId: '90d329c9-df43-416c-a8b6-1a739d2be966',
    organizationId: 'f993bf31-e76f-4f5b-831c-c05f2f571bd0',
    organizationRole: 'admin' as const,
    contributionTarget: 'certificate.templates' as const,
    resource: { type: 'course' as const, id: 'e69a0319-9404-4b53-a3d5-1f953047a06d' },
    clientAudience: 'https://certificate-studio.services.classroomio.com',
    scopes: [
      'course.metadata:read',
      'course.content:read',
      'course.enrollment:read',
      'exercise.metadata:read',
      'lesson.metadata:read',
      'learner.progress:read',
      'certificate.template:read',
      'certificate.template:write'
    ]
  };

  const sampleCourseProgress = {
    courseId: 'e69a0319-9404-4b53-a3d5-1f953047a06d',
    percentage: 100,
    lessonsCompleted: 5,
    totalLessons: 5,
    isComplete: true,
    certificateEarnedAt: '2026-01-01T00:00:00.000Z'
  };

  const sampleAppliedTemplate = {
    courseId: 'e69a0319-9404-4b53-a3d5-1f953047a06d',
    isDownloadable: true,
    design: { templateId: 'noir', accentColor: '#d4af37' },
    sourceTemplate: {
      pluginId: 'com.classroomio.certificate-studio',
      externalTemplateId: 'tmpl-1',
      version: 1,
      name: 'Executive Noir',
      appliedAt: '2026-01-01T00:00:00.000Z'
    }
  };

  const sampleApplyResult = {
    courseId: 'e69a0319-9404-4b53-a3d5-1f953047a06d',
    appliedAt: '2026-01-01T00:00:00.000Z',
    templateVersion: 1,
    design: { templateId: 'noir', accentColor: '#d4af37' }
  };

  const sampleCourse = {
    id: 'e69a0319-9404-4b53-a3d5-1f953047a06d',
    title: 'Modern TypeScript',
    slug: 'modern-typescript',
    description: 'Learn modern TypeScript',
    imageUrl: 'https://example.com/banner.png',
    status: 'ACTIVE',
    visibility: 'public' as const,
    published: true,
    publishedAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z'
  };

  const sampleLesson = {
    id: 'f1406f0e-3676-4d05-b384-368798bf2df7',
    courseId: sampleCourse.id,
    title: 'Generics deep dive',
    type: 'lesson',
    order: 1,
    published: true,
    wordCount: 120,
    estimatedMinutes: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z'
  };

  const sampleStructure = {
    courseId: sampleCourse.id,
    sections: [
      {
        id: '269a0319-9404-4b53-a3d5-1f953047a06a',
        title: 'Introduction',
        order: 1,
        lessons: [
          {
            id: sampleLesson.id,
            title: sampleLesson.title,
            order: 1,
            type: 'lesson'
          }
        ]
      }
    ]
  };

  const sampleEnrollment = {
    id: '369a0319-9404-4b53-a3d5-1f953047a06b',
    courseId: sampleCourse.id,
    profileId: claims.sub,
    role: 'student' as const,
    status: 'active' as const,
    enrolledAt: '2026-01-01T00:00:00.000Z',
    completedAt: null
  };

  const sampleExercise = {
    id: '469a0319-9404-4b53-a3d5-1f953047a06c',
    courseId: sampleCourse.id,
    lessonId: sampleLesson.id,
    title: 'Quiz 1',
    description: 'Knowledge check',
    order: 1,
    allowMultipleAttempts: true,
    completionPolicy: 'pass_threshold',
    passThreshold: 80,
    questionCount: 5,
    totalPoints: 100,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verifyPluginApiAccessToken.mockResolvedValue(claims);
    mocks.listCoursesForPlugin.mockResolvedValue({ items: [sampleCourse], nextCursor: null });
    mocks.getCourseForPlugin.mockResolvedValue(sampleCourse);
    mocks.getCourseStructureForPlugin.mockResolvedValue(sampleStructure);
    mocks.listLessonsForPlugin.mockResolvedValue({ items: [sampleLesson], nextCursor: null });
    mocks.getCourseProgressForPlugin.mockResolvedValue(sampleCourseProgress);
    mocks.listCourseEnrollmentsForPlugin.mockResolvedValue({ items: [sampleEnrollment], nextCursor: null });
    mocks.getCourseEnrollmentForPlugin.mockResolvedValue(sampleEnrollment);
    mocks.listExercisesForPlugin.mockResolvedValue({ items: [sampleExercise], nextCursor: null });
    mocks.getAppliedCertificateTemplateForPlugin.mockResolvedValue(sampleAppliedTemplate);
    mocks.applyCertificateTemplate.mockResolvedValue(sampleApplyResult);
    mocks.recordPluginAuditEvent.mockResolvedValue({ id: 'audit-1' });
  });

  describe('GET /v1/courses', () => {
    it('returns a paginated list of courses with request ID', async () => {
      const response = await pluginApiRouter.request('/v1/courses?limit=10', {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        success: true,
        data: {
          items: [sampleCourse],
          nextCursor: null
        },
        requestId: expect.any(String)
      });
      expect(mocks.listCoursesForPlugin).toHaveBeenCalledWith(
        claims.installationId,
        claims.organizationId,
        claims.sub,
        expect.objectContaining({ limit: 10 })
      );
      expect(mocks.recordPluginAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'plugin.api.course.list',
          outcome: 'success'
        })
      );
    });

    it('requires course.metadata:read permission', async () => {
      mocks.verifyPluginApiAccessToken.mockResolvedValue({ ...claims, scopes: [] });

      const response = await pluginApiRouter.request('/v1/courses', {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error.code).toBe('permission_denied');
      expect(mocks.listCoursesForPlugin).not.toHaveBeenCalled();
    });
  });

  describe('GET /v1/courses/:courseId', () => {
    it('returns single course metadata', async () => {
      const response = await pluginApiRouter.request(`/v1/courses/${sampleCourse.id}`, {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        success: true,
        data: sampleCourse,
        requestId: expect.any(String)
      });
      expect(mocks.getCourseForPlugin).toHaveBeenCalledWith(
        claims.installationId,
        claims.organizationId,
        claims.sub,
        sampleCourse.id
      );
    });

    it('returns 404 when course is not found in organization', async () => {
      mocks.getCourseForPlugin.mockRejectedValue(new AppError('Course not found', 'COURSE_NOT_FOUND', 404));

      const response = await pluginApiRouter.request(`/v1/courses/${sampleCourse.id}`, {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error.code).toBe('resource_not_found');
      expect(mocks.recordPluginAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'plugin.api.course.get',
          outcome: 'denied'
        })
      );
    });
  });

  describe('GET /v1/courses/:courseId/lessons', () => {
    it('returns list of lessons for the course', async () => {
      const response = await pluginApiRouter.request(`/v1/courses/${sampleCourse.id}/lessons`, {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        success: true,
        data: {
          items: [sampleLesson],
          nextCursor: null
        },
        requestId: expect.any(String)
      });
      expect(mocks.listLessonsForPlugin).toHaveBeenCalledWith(
        claims.installationId,
        claims.organizationId,
        claims.sub,
        sampleCourse.id,
        expect.any(Object)
      );
    });

    it('requires lesson.metadata:read permission', async () => {
      mocks.verifyPluginApiAccessToken.mockResolvedValue({
        ...claims,
        scopes: ['course.metadata:read']
      });

      const response = await pluginApiRouter.request(`/v1/courses/${sampleCourse.id}/lessons`, {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error.code).toBe('permission_denied');
      expect(mocks.listLessonsForPlugin).not.toHaveBeenCalled();
    });
  });

  describe('GET /v1/courses/:courseId/progress', () => {
    it('returns course progress for learner', async () => {
      const response = await pluginApiRouter.request(`/v1/courses/${sampleCourse.id}/progress`, {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        success: true,
        data: sampleCourseProgress,
        requestId: expect.any(String)
      });
      expect(mocks.getCourseProgressForPlugin).toHaveBeenCalledWith(
        claims.installationId,
        claims.organizationId,
        claims.sub,
        sampleCourse.id
      );
      expect(mocks.recordPluginAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'plugin.api.course.progress.read',
          outcome: 'success',
          resource: sampleCourse.id
        })
      );
    });

    it('requires learner.progress:read permission', async () => {
      mocks.verifyPluginApiAccessToken.mockResolvedValue({
        ...claims,
        scopes: ['course.metadata:read']
      });

      const response = await pluginApiRouter.request(`/v1/courses/${sampleCourse.id}/progress`, {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error.code).toBe('permission_denied');
      expect(mocks.getCourseProgressForPlugin).not.toHaveBeenCalled();
    });

    it('returns 404 when course progress is not found', async () => {
      mocks.getCourseProgressForPlugin.mockRejectedValue(new AppError('Course not found', 'COURSE_NOT_FOUND', 404));

      const response = await pluginApiRouter.request(`/v1/courses/${sampleCourse.id}/progress`, {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error.code).toBe('resource_not_found');
      expect(mocks.recordPluginAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'plugin.api.course.progress.read',
          outcome: 'denied',
          resource: sampleCourse.id
        })
      );
    });
  });

  describe('GET /v1/courses/:courseId/certificate-template', () => {
    it('returns applied certificate template for course', async () => {
      const response = await pluginApiRouter.request(`/v1/courses/${sampleCourse.id}/certificate-template`, {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        success: true,
        data: sampleAppliedTemplate,
        requestId: expect.any(String)
      });
      expect(mocks.getAppliedCertificateTemplateForPlugin).toHaveBeenCalledWith(
        claims.installationId,
        claims.organizationId,
        sampleCourse.id,
        claims.sub
      );
      expect(mocks.recordPluginAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'plugin.api.course.certificate.template.get',
          outcome: 'success',
          resource: sampleCourse.id
        })
      );
    });

    it('requires certificate.template:read permission', async () => {
      mocks.verifyPluginApiAccessToken.mockResolvedValue({
        ...claims,
        scopes: ['course.metadata:read']
      });

      const response = await pluginApiRouter.request(`/v1/courses/${sampleCourse.id}/certificate-template`, {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error.code).toBe('permission_denied');
      expect(mocks.getAppliedCertificateTemplateForPlugin).not.toHaveBeenCalled();
    });

    it('rejects a guessed course ID that differs from the host-bound resource', async () => {
      const guessedCourseId = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
      const response = await pluginApiRouter.request(`/v1/courses/${guessedCourseId}/certificate-template`, {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error.code).toBe('permission_denied');
      expect(mocks.getAppliedCertificateTemplateForPlugin).not.toHaveBeenCalled();
    });

    it('returns 404 when course is not found', async () => {
      mocks.getAppliedCertificateTemplateForPlugin.mockRejectedValue(
        new AppError('Course not found', 'COURSE_NOT_FOUND', 404)
      );

      const response = await pluginApiRouter.request(`/v1/courses/${sampleCourse.id}/certificate-template`, {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error.code).toBe('resource_not_found');
      expect(mocks.recordPluginAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'plugin.api.course.certificate.template.get',
          outcome: 'denied',
          resource: sampleCourse.id
        })
      );
    });
  });

  describe('PUT /v1/courses/:courseId/certificate-template', () => {
    it('applies certificate template to course', async () => {
      const response = await pluginApiRouter.request(`/v1/courses/${sampleCourse.id}/certificate-template`, {
        method: 'PUT',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          externalTemplateId: 'tmpl-1',
          externalTemplateVersion: 1,
          name: 'Executive Noir',
          design: { templateId: 'noir', accentColor: '#d4af37' }
        })
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        success: true,
        data: sampleApplyResult,
        requestId: expect.any(String)
      });
      expect(mocks.applyCertificateTemplate).toHaveBeenCalledWith({
        installationId: claims.installationId,
        courseId: sampleCourse.id,
        orgId: claims.organizationId,
        userId: claims.sub,
        externalTemplateId: 'tmpl-1',
        externalTemplateVersion: 1,
        name: 'Executive Noir',
        design: { templateId: 'noir', accentColor: '#d4af37' }
      });
      expect(mocks.recordPluginAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'plugin.api.course.certificate.template.apply',
          outcome: 'success',
          resource: sampleCourse.id
        })
      );
    });

    it('rejects invalid payload', async () => {
      const response = await pluginApiRouter.request(`/v1/courses/${sampleCourse.id}/certificate-template`, {
        method: 'PUT',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          externalTemplateId: 'tmpl-1'
        })
      });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe('validation_failed');
      expect(mocks.applyCertificateTemplate).not.toHaveBeenCalled();
    });

    it('requires certificate.template:write permission', async () => {
      mocks.verifyPluginApiAccessToken.mockResolvedValue({
        ...claims,
        scopes: ['certificate.template:read']
      });

      const response = await pluginApiRouter.request(`/v1/courses/${sampleCourse.id}/certificate-template`, {
        method: 'PUT',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          externalTemplateId: 'tmpl-1',
          externalTemplateVersion: 1,
          name: 'Executive Noir',
          design: { templateId: 'noir', accentColor: '#d4af37' }
        })
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error.code).toBe('permission_denied');
      expect(mocks.applyCertificateTemplate).not.toHaveBeenCalled();
    });
  });

  describe('GET /v1/courses/:courseId/structure', () => {
    it('returns course structure when authorized', async () => {
      const response = await pluginApiRouter.request(`/v1/courses/${sampleCourse.id}/structure`, {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        success: true,
        data: sampleStructure,
        requestId: expect.any(String)
      });
      expect(mocks.getCourseStructureForPlugin).toHaveBeenCalledWith(
        claims.installationId,
        claims.organizationId,
        claims.sub,
        sampleCourse.id
      );
      expect(mocks.recordPluginAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'plugin.api.course.structure',
          outcome: 'success',
          resource: sampleCourse.id
        })
      );
    });

    it('requires course.content:read permission', async () => {
      mocks.verifyPluginApiAccessToken.mockResolvedValue({
        ...claims,
        scopes: ['course.metadata:read']
      });

      const response = await pluginApiRouter.request(`/v1/courses/${sampleCourse.id}/structure`, {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error.code).toBe('permission_denied');
      expect(mocks.getCourseStructureForPlugin).not.toHaveBeenCalled();
    });

    it('returns 404 when course is not found', async () => {
      mocks.getCourseStructureForPlugin.mockRejectedValue(new AppError('Course not found', 'COURSE_NOT_FOUND', 404));

      const response = await pluginApiRouter.request(`/v1/courses/${sampleCourse.id}/structure`, {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error.code).toBe('resource_not_found');
      expect(mocks.recordPluginAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'plugin.api.course.structure',
          outcome: 'denied',
          resource: sampleCourse.id
        })
      );
    });
  });

  describe('GET /v1/courses/:courseId/enrollments', () => {
    it('returns paginated enrollments list when authorized', async () => {
      const response = await pluginApiRouter.request(`/v1/courses/${sampleCourse.id}/enrollments?limit=10`, {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        success: true,
        data: {
          items: [sampleEnrollment],
          nextCursor: null
        },
        requestId: expect.any(String)
      });
      expect(mocks.listCourseEnrollmentsForPlugin).toHaveBeenCalledWith(
        claims.installationId,
        claims.organizationId,
        claims.sub,
        sampleCourse.id,
        expect.objectContaining({ limit: 10 })
      );
      expect(mocks.recordPluginAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'plugin.api.course.enrollment.list',
          outcome: 'success',
          resource: sampleCourse.id
        })
      );
    });

    it('requires course.enrollment:read permission', async () => {
      mocks.verifyPluginApiAccessToken.mockResolvedValue({
        ...claims,
        scopes: ['course.metadata:read']
      });

      const response = await pluginApiRouter.request(`/v1/courses/${sampleCourse.id}/enrollments`, {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error.code).toBe('permission_denied');
      expect(mocks.listCourseEnrollmentsForPlugin).not.toHaveBeenCalled();
    });
  });

  describe('GET /v1/courses/:courseId/enrollments/:enrollmentId', () => {
    it('returns single enrollment when authorized', async () => {
      const response = await pluginApiRouter.request(
        `/v1/courses/${sampleCourse.id}/enrollments/${sampleEnrollment.id}`,
        {
          headers: { authorization: 'Bearer valid-token' }
        }
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        success: true,
        data: sampleEnrollment,
        requestId: expect.any(String)
      });
      expect(mocks.getCourseEnrollmentForPlugin).toHaveBeenCalledWith(
        claims.installationId,
        claims.organizationId,
        claims.sub,
        sampleCourse.id,
        sampleEnrollment.id
      );
      expect(mocks.recordPluginAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'plugin.api.course.enrollment.get',
          outcome: 'success',
          resource: sampleEnrollment.id
        })
      );
    });

    it('returns 404 when enrollment is not found', async () => {
      mocks.getCourseEnrollmentForPlugin.mockRejectedValue(
        new AppError('Enrollment not found', 'ENROLLMENT_NOT_FOUND', 404)
      );

      const response = await pluginApiRouter.request(
        `/v1/courses/${sampleCourse.id}/enrollments/${sampleEnrollment.id}`,
        {
          headers: { authorization: 'Bearer valid-token' }
        }
      );
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error.code).toBe('resource_not_found');
      expect(mocks.recordPluginAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'plugin.api.course.enrollment.get',
          outcome: 'denied',
          resource: sampleEnrollment.id
        })
      );
    });
  });

  describe('GET /v1/courses/:courseId/exercises', () => {
    it('returns exercises list when authorized', async () => {
      const response = await pluginApiRouter.request(`/v1/courses/${sampleCourse.id}/exercises?limit=5`, {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        success: true,
        data: {
          items: [sampleExercise],
          nextCursor: null
        },
        requestId: expect.any(String)
      });
      expect(mocks.listExercisesForPlugin).toHaveBeenCalledWith(
        claims.installationId,
        claims.organizationId,
        claims.sub,
        sampleCourse.id,
        expect.objectContaining({ limit: 5 })
      );
      expect(mocks.recordPluginAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'plugin.api.exercise.list',
          outcome: 'success',
          resource: sampleCourse.id
        })
      );
    });

    it('requires exercise.metadata:read permission', async () => {
      mocks.verifyPluginApiAccessToken.mockResolvedValue({
        ...claims,
        scopes: ['course.metadata:read']
      });

      const response = await pluginApiRouter.request(`/v1/courses/${sampleCourse.id}/exercises`, {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error.code).toBe('permission_denied');
      expect(mocks.listExercisesForPlugin).not.toHaveBeenCalled();
    });
  });
});
