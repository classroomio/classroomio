import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@api/utils/errors';

const mocks = vi.hoisted(() => ({
  verifyPluginApiAccessToken: vi.fn(),
  listLessonsForPlugin: vi.fn(),
  getLessonForPlugin: vi.fn(),
  getLessonContentForPlugin: vi.fn(),
  getLessonCompletionForPlugin: vi.fn(),
  setLessonCompletionForPlugin: vi.fn(),
  resetLessonCompletionForPlugin: vi.fn(),
  recordPluginAuditEvent: vi.fn()
}));

vi.mock('@api/services/plugin/access-token', () => ({
  verifyPluginApiAccessToken: mocks.verifyPluginApiAccessToken
}));
vi.mock('@api/services/plugin/content', () => ({
  listLessonsForPlugin: mocks.listLessonsForPlugin,
  getLessonForPlugin: mocks.getLessonForPlugin,
  getLessonContentForPlugin: mocks.getLessonContentForPlugin
}));
vi.mock('@api/services/plugin/progress', () => ({
  getLessonCompletionForPlugin: mocks.getLessonCompletionForPlugin,
  setLessonCompletionForPlugin: mocks.setLessonCompletionForPlugin,
  resetLessonCompletionForPlugin: mocks.resetLessonCompletionForPlugin
}));
vi.mock('@cio/db/queries', () => ({ recordPluginAuditEvent: mocks.recordPluginAuditEvent }));

import { pluginApiRouter } from '@api/routes/plugin-api';

describe('plugin API lessons routes', () => {
  const claims = {
    iss: 'classroomio' as const,
    aud: 'classroomio:plugin-api:v1' as const,
    sub: '2194bd50-7590-41e3-b381-917dc347176f',
    jti: '93567c57-d8a4-4bf6-a9c7-01c65ef42f50',
    iat: 1,
    exp: 4_000_000_000,
    pluginId: 'com.classroomio.reading-time',
    versionId: '747b1324-b281-43d3-b468-032727fe5819',
    installationId: '90d329c9-df43-416c-a8b6-1a739d2be966',
    organizationId: 'f993bf31-e76f-4f5b-831c-c05f2f571bd0',
    organizationRole: 'student' as const,
    contributionTarget: 'plugin.page' as const,
    resource: { type: 'lesson' as const, id: 'f1406f0e-3676-4d05-b384-368798bf2df7' },
    clientAudience: 'https://plugins.classroomio.com',
    scopes: ['lesson.metadata:read', 'lesson.content:read', 'learner.progress:read', 'learner.progress:write']
  };

  const sampleLessonProgress = {
    isComplete: true
  };

  const sampleLesson = {
    id: 'f1406f0e-3676-4d05-b384-368798bf2df7',
    courseId: 'e69a0319-9404-4b53-a3d5-1f953047a06d',
    title: 'Variables and Scopes',
    type: 'lesson',
    order: 1,
    published: true,
    wordCount: 250,
    estimatedMinutes: 2,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z'
  };

  const sampleLessonContent = {
    id: sampleLesson.id,
    courseId: sampleLesson.courseId,
    title: sampleLesson.title,
    type: 'lesson',
    order: 1,
    content: '<p>Sanitized content</p>',
    attachments: [
      { name: 'cheatsheet.pdf', url: 'https://cdn.classroomio.com/cheatsheet.pdf', type: 'application/pdf' }
    ],
    wordCount: 2,
    estimatedMinutes: 1,
    updatedAt: '2026-01-02T00:00:00.000Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verifyPluginApiAccessToken.mockResolvedValue(claims);
    mocks.listLessonsForPlugin.mockResolvedValue({ items: [sampleLesson], nextCursor: null });
    mocks.getLessonForPlugin.mockResolvedValue(sampleLesson);
    mocks.getLessonContentForPlugin.mockResolvedValue(sampleLessonContent);
    mocks.getLessonCompletionForPlugin.mockResolvedValue(sampleLessonProgress);
    mocks.setLessonCompletionForPlugin.mockResolvedValue(sampleLessonProgress);
    mocks.resetLessonCompletionForPlugin.mockResolvedValue({ isComplete: false });
    mocks.recordPluginAuditEvent.mockResolvedValue({ id: 'audit-1' });
  });

  describe('GET /v1/lessons/:lessonId', () => {
    it('returns single lesson metadata with request ID', async () => {
      const response = await pluginApiRouter.request(`/v1/lessons/${sampleLesson.id}`, {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        success: true,
        data: sampleLesson,
        requestId: expect.any(String)
      });
      expect(mocks.getLessonForPlugin).toHaveBeenCalledWith(
        claims.installationId,
        claims.organizationId,
        claims.sub,
        sampleLesson.id
      );
      expect(mocks.recordPluginAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'plugin.api.lesson.get',
          outcome: 'success',
          resource: sampleLesson.id
        })
      );
    });

    it('returns 404 when lesson is not found', async () => {
      mocks.getLessonForPlugin.mockRejectedValue(new AppError('Lesson not found', 'LESSON_NOT_FOUND', 404));

      const response = await pluginApiRouter.request(`/v1/lessons/${sampleLesson.id}`, {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error.code).toBe('resource_not_found');
      expect(mocks.recordPluginAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'plugin.api.lesson.get',
          outcome: 'denied',
          resource: sampleLesson.id
        })
      );
    });

    it('rejects request when lesson.metadata:read is missing', async () => {
      mocks.verifyPluginApiAccessToken.mockResolvedValue({ ...claims, scopes: [] });

      const response = await pluginApiRouter.request(`/v1/lessons/${sampleLesson.id}`, {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error.code).toBe('permission_denied');
      expect(mocks.getLessonForPlugin).not.toHaveBeenCalled();
    });
  });

  describe('GET /v1/lessons/:lessonId/content', () => {
    it('returns sanitized lesson content and attachments when authorized', async () => {
      const response = await pluginApiRouter.request(`/v1/lessons/${sampleLesson.id}/content`, {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        success: true,
        data: sampleLessonContent,
        requestId: expect.any(String)
      });
      expect(mocks.getLessonContentForPlugin).toHaveBeenCalledWith(
        claims.installationId,
        claims.organizationId,
        claims.sub,
        sampleLesson.id
      );
      expect(mocks.recordPluginAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'plugin.api.lesson.content',
          outcome: 'success',
          resource: sampleLesson.id
        })
      );
    });

    it('requires lesson.content:read permission', async () => {
      mocks.verifyPluginApiAccessToken.mockResolvedValue({
        ...claims,
        scopes: ['lesson.metadata:read']
      });

      const response = await pluginApiRouter.request(`/v1/lessons/${sampleLesson.id}/content`, {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error.code).toBe('permission_denied');
      expect(mocks.getLessonContentForPlugin).not.toHaveBeenCalled();
    });

    it('returns 404 when lesson is not found', async () => {
      mocks.getLessonContentForPlugin.mockRejectedValue(new AppError('Lesson not found', 'LESSON_NOT_FOUND', 404));

      const response = await pluginApiRouter.request(`/v1/lessons/${sampleLesson.id}/content`, {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error.code).toBe('resource_not_found');
      expect(mocks.recordPluginAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'plugin.api.lesson.content',
          outcome: 'denied',
          resource: sampleLesson.id
        })
      );
    });
  });

  describe('GET /v1/lessons', () => {
    it('returns lessons when valid courseId query is provided', async () => {
      const response = await pluginApiRouter.request(`/v1/lessons?courseId=${sampleLesson.courseId}`, {
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
        sampleLesson.courseId,
        expect.any(Object)
      );
    });

    it('rejects request without courseId query param', async () => {
      const response = await pluginApiRouter.request('/v1/lessons', {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe('validation_failed');
    });
  });

  describe('GET /v1/lessons/:lessonId/progress', () => {
    it('returns lesson completion progress for authenticated learner', async () => {
      const response = await pluginApiRouter.request(`/v1/lessons/${sampleLesson.id}/progress`, {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        success: true,
        data: sampleLessonProgress,
        requestId: expect.any(String)
      });
      expect(mocks.getLessonCompletionForPlugin).toHaveBeenCalledWith(
        claims.installationId,
        claims.organizationId,
        claims.sub,
        sampleLesson.id
      );
      expect(mocks.recordPluginAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'plugin.api.lesson.progress.read',
          outcome: 'success',
          resource: sampleLesson.id
        })
      );
    });

    it('requires learner.progress:read permission', async () => {
      mocks.verifyPluginApiAccessToken.mockResolvedValue({
        ...claims,
        scopes: ['lesson.metadata:read']
      });

      const response = await pluginApiRouter.request(`/v1/lessons/${sampleLesson.id}/progress`, {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error.code).toBe('permission_denied');
      expect(mocks.getLessonCompletionForPlugin).not.toHaveBeenCalled();
    });

    it('returns 404 when lesson is not found', async () => {
      mocks.getLessonCompletionForPlugin.mockRejectedValue(new AppError('Lesson not found', 'LESSON_NOT_FOUND', 404));

      const response = await pluginApiRouter.request(`/v1/lessons/${sampleLesson.id}/progress`, {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error.code).toBe('resource_not_found');
      expect(mocks.recordPluginAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'plugin.api.lesson.progress.read',
          outcome: 'denied',
          resource: sampleLesson.id
        })
      );
    });
  });

  describe('PUT /v1/lessons/:lessonId/progress', () => {
    it('updates lesson completion progress', async () => {
      const response = await pluginApiRouter.request(`/v1/lessons/${sampleLesson.id}/progress`, {
        method: 'PUT',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ isComplete: true })
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        success: true,
        data: sampleLessonProgress,
        requestId: expect.any(String)
      });
      expect(mocks.setLessonCompletionForPlugin).toHaveBeenCalledWith(
        claims.installationId,
        claims.organizationId,
        claims.sub,
        sampleLesson.id,
        true
      );
      expect(mocks.recordPluginAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'plugin.api.lesson.progress.write',
          outcome: 'success',
          resource: sampleLesson.id
        })
      );
    });

    it('rejects invalid payload', async () => {
      const response = await pluginApiRouter.request(`/v1/lessons/${sampleLesson.id}/progress`, {
        method: 'PUT',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ isComplete: 'yes' })
      });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe('validation_failed');
      expect(mocks.setLessonCompletionForPlugin).not.toHaveBeenCalled();
    });

    it('requires learner.progress:write permission', async () => {
      mocks.verifyPluginApiAccessToken.mockResolvedValue({
        ...claims,
        scopes: ['learner.progress:read']
      });

      const response = await pluginApiRouter.request(`/v1/lessons/${sampleLesson.id}/progress`, {
        method: 'PUT',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ isComplete: true })
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error.code).toBe('permission_denied');
      expect(mocks.setLessonCompletionForPlugin).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /v1/lessons/:lessonId/progress', () => {
    it('resets lesson completion progress', async () => {
      const response = await pluginApiRouter.request(`/v1/lessons/${sampleLesson.id}/progress`, {
        method: 'DELETE',
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        success: true,
        data: { isComplete: false },
        requestId: expect.any(String)
      });
      expect(mocks.resetLessonCompletionForPlugin).toHaveBeenCalledWith(
        claims.installationId,
        claims.organizationId,
        claims.sub,
        sampleLesson.id
      );
      expect(mocks.recordPluginAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'plugin.api.lesson.progress.write',
          outcome: 'success',
          resource: sampleLesson.id
        })
      );
    });

    it('requires learner.progress:write permission', async () => {
      mocks.verifyPluginApiAccessToken.mockResolvedValue({
        ...claims,
        scopes: ['learner.progress:read']
      });

      const response = await pluginApiRouter.request(`/v1/lessons/${sampleLesson.id}/progress`, {
        method: 'DELETE',
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error.code).toBe('permission_denied');
      expect(mocks.resetLessonCompletionForPlugin).not.toHaveBeenCalled();
    });
  });
});
