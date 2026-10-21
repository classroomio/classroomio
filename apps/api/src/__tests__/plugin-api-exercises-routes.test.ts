import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@api/utils/errors';

const mocks = vi.hoisted(() => ({
  verifyPluginApiAccessToken: vi.fn(),
  getExerciseForPlugin: vi.fn(),
  recordPluginAuditEvent: vi.fn()
}));

vi.mock('@api/services/plugin/access-token', () => ({
  verifyPluginApiAccessToken: mocks.verifyPluginApiAccessToken
}));
vi.mock('@api/services/plugin/exercises', () => ({
  getExerciseForPlugin: mocks.getExerciseForPlugin
}));
vi.mock('@cio/db/queries', () => ({ recordPluginAuditEvent: mocks.recordPluginAuditEvent }));

import { pluginApiRouter } from '@api/routes/plugin-api';

describe('plugin API exercises routes', () => {
  const claims = {
    iss: 'classroomio' as const,
    aud: 'classroomio:plugin-api:v1' as const,
    sub: '2194bd50-7590-41e3-b381-917dc347176f',
    jti: '93567c57-d8a4-4bf6-a9c7-01c65ef42f50',
    iat: 1,
    exp: 4_000_000_000,
    pluginId: 'com.classroomio.exercises-helper',
    versionId: '747b1324-b281-43d3-b468-032727fe5819',
    installationId: '90d329c9-df43-416c-a8b6-1a739d2be966',
    organizationId: 'f993bf31-e76f-4f5b-831c-c05f2f571bd0',
    organizationRole: 'student' as const,
    contributionTarget: 'plugin.page' as const,
    resource: null,
    clientAudience: 'https://exercises.classroomio.com',
    scopes: ['exercise.metadata:read']
  };

  const sampleExercise = {
    id: 'a194bd50-7590-41e3-b381-917dc347176a',
    courseId: 'b194bd50-7590-41e3-b381-917dc347176b',
    lessonId: 'c194bd50-7590-41e3-b381-917dc347176c',
    title: 'Variables and Scopes Quiz',
    description: 'Check your understanding of TypeScript variables',
    order: 1,
    allowMultipleAttempts: true,
    completionPolicy: 'pass_threshold',
    passThreshold: 75,
    questionCount: 4,
    totalPoints: 100,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verifyPluginApiAccessToken.mockResolvedValue(claims);
    mocks.getExerciseForPlugin.mockResolvedValue(sampleExercise);
    mocks.recordPluginAuditEvent.mockResolvedValue({ id: 'audit-1' });
  });

  describe('GET /v1/exercises/:exerciseId', () => {
    it('returns single exercise metadata with request ID', async () => {
      const response = await pluginApiRouter.request(`/v1/exercises/${sampleExercise.id}`, {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        success: true,
        data: sampleExercise,
        requestId: expect.any(String)
      });
      expect(mocks.getExerciseForPlugin).toHaveBeenCalledWith(
        claims.installationId,
        claims.organizationId,
        claims.sub,
        sampleExercise.id
      );
      expect(mocks.recordPluginAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'plugin.api.exercise.get',
          outcome: 'success',
          resource: sampleExercise.id
        })
      );
    });

    it('requires exercise.metadata:read permission', async () => {
      mocks.verifyPluginApiAccessToken.mockResolvedValue({ ...claims, scopes: [] });

      const response = await pluginApiRouter.request(`/v1/exercises/${sampleExercise.id}`, {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error.code).toBe('permission_denied');
      expect(mocks.getExerciseForPlugin).not.toHaveBeenCalled();
    });

    it('returns 404 when exercise is not found', async () => {
      mocks.getExerciseForPlugin.mockRejectedValue(new AppError('Exercise not found', 'EXERCISE_NOT_FOUND', 404));

      const response = await pluginApiRouter.request(`/v1/exercises/${sampleExercise.id}`, {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error.code).toBe('resource_not_found');
      expect(mocks.recordPluginAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'plugin.api.exercise.get',
          outcome: 'denied',
          resource: sampleExercise.id
        })
      );
    });
  });
});
