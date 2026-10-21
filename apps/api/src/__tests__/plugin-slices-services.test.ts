import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbMocks = vi.hoisted(() => ({
  getInstallationById: vi.fn(),
  getInstallationGrants: vi.fn(),
  getUserOrgRole: vi.fn(),
  getPluginCourseEnrollmentsList: vi.fn(),
  getPluginCourseEnrollmentById: vi.fn(),
  getPluginExercisesList: vi.fn(),
  getPluginExerciseById: vi.fn(),
  getPluginIssuedCertificatesList: vi.fn(),
  getPluginIssuedCertificateById: vi.fn()
}));

const accessMocks = vi.hoisted(() => ({
  assertCourseMemberOrOrgAdmin: vi.fn()
}));

vi.mock('@cio/db/queries', () => dbMocks);
vi.mock('@api/services/v1/shared', () => accessMocks);

import { getCourseEnrollmentForPlugin, listCourseEnrollmentsForPlugin } from '@api/services/plugin/enrollments';
import { getExerciseForPlugin, listExercisesForPlugin } from '@api/services/plugin/exercises';
import {
  getIssuedCertificateForPlugin,
  listIssuedCertificatesForPlugin
} from '@api/services/plugin/issued-certificates';

describe('plugin slices services', () => {
  const installationId = '90d329c9-df43-416c-a8b6-1a739d2be966';
  const organizationId = 'f993bf31-e76f-4f5b-831c-c05f2f571bd0';
  const actorId = '2194bd50-7590-41e3-b381-917dc347176f';
  const courseId = 'b194bd50-7590-41e3-b381-917dc347176b';

  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.getInstallationById.mockResolvedValue({
      id: installationId,
      ownerType: 'organization',
      organizationId,
      status: 'active',
      orgApprovalStatus: 'approved'
    });
    dbMocks.getUserOrgRole.mockResolvedValue(1);
    dbMocks.getInstallationGrants.mockResolvedValue([
      { scope: 'course.enrollment:read' },
      { scope: 'exercise.metadata:read' },
      { scope: 'certificate.issued:read' }
    ]);
  });

  describe('course enrollments service', () => {
    const sampleEnrollment = {
      id: '369a0319-9404-4b53-a3d5-1f953047a06b',
      courseId,
      profileId: actorId,
      role: 'student' as const,
      status: 'active' as const,
      enrolledAt: '2026-01-01T00:00:00.000Z',
      completedAt: null
    };

    it('lists enrollments and asserts course membership', async () => {
      dbMocks.getPluginCourseEnrollmentsList.mockResolvedValueOnce({
        items: [sampleEnrollment],
        nextCursor: null
      });

      const result = await listCourseEnrollmentsForPlugin(installationId, organizationId, actorId, courseId);

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual(sampleEnrollment);
      expect(accessMocks.assertCourseMemberOrOrgAdmin).toHaveBeenCalledWith(courseId, actorId);
      expect(dbMocks.getPluginCourseEnrollmentsList).toHaveBeenCalledWith(
        organizationId,
        courseId,
        actorId,
        true,
        undefined
      );
    });

    it('passes canReadAll as false for student role', async () => {
      dbMocks.getUserOrgRole.mockResolvedValueOnce(3);
      dbMocks.getPluginCourseEnrollmentsList.mockResolvedValueOnce({
        items: [sampleEnrollment],
        nextCursor: null
      });

      await listCourseEnrollmentsForPlugin(installationId, organizationId, actorId, courseId);

      expect(dbMocks.getPluginCourseEnrollmentsList).toHaveBeenCalledWith(
        organizationId,
        courseId,
        actorId,
        false,
        undefined
      );
    });

    it('gets enrollment by ID and rejects if missing', async () => {
      dbMocks.getPluginCourseEnrollmentById.mockResolvedValueOnce(sampleEnrollment).mockResolvedValueOnce(null);

      await expect(
        getCourseEnrollmentForPlugin(installationId, organizationId, actorId, courseId, sampleEnrollment.id)
      ).resolves.toEqual(sampleEnrollment);

      await expect(
        getCourseEnrollmentForPlugin(installationId, organizationId, actorId, courseId, 'nonexistent')
      ).rejects.toMatchObject({
        code: 'ENROLLMENT_NOT_FOUND',
        statusCode: 404
      });
    });
  });

  describe('exercise metadata service', () => {
    const sampleExercise = {
      id: '469a0319-9404-4b53-a3d5-1f953047a06c',
      courseId,
      lessonId: '569a0319-9404-4b53-a3d5-1f953047a06d',
      title: 'Practice Quiz',
      description: 'Test your understanding',
      order: 1,
      allowMultipleAttempts: true,
      completionPolicy: 'pass_threshold',
      passThreshold: 80,
      questionCount: 5,
      totalPoints: 100,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    };

    it('lists exercises with zero solution or answer key leak', async () => {
      dbMocks.getPluginExercisesList.mockResolvedValueOnce({
        items: [sampleExercise],
        nextCursor: null
      });

      const result = await listExercisesForPlugin(installationId, organizationId, actorId, courseId);

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual(sampleExercise);
      expect(result.items[0]).not.toHaveProperty('questions');
      expect(result.items[0]).not.toHaveProperty('answers');
      expect(accessMocks.assertCourseMemberOrOrgAdmin).toHaveBeenCalledWith(courseId, actorId);
    });

    it('gets exercise by ID and asserts course membership', async () => {
      dbMocks.getPluginExerciseById.mockResolvedValueOnce(sampleExercise).mockResolvedValueOnce(null);

      await expect(getExerciseForPlugin(installationId, organizationId, actorId, sampleExercise.id)).resolves.toEqual(
        sampleExercise
      );
      expect(accessMocks.assertCourseMemberOrOrgAdmin).toHaveBeenCalledWith(courseId, actorId);

      await expect(getExerciseForPlugin(installationId, organizationId, actorId, 'nonexistent')).rejects.toMatchObject({
        code: 'EXERCISE_NOT_FOUND',
        statusCode: 404
      });
    });
  });

  describe('issued certificates service', () => {
    const sampleCertificate = {
      id: '669a0319-9404-4b53-a3d5-1f953047a06e',
      courseId,
      profileId: actorId,
      cycleNumber: 1,
      issuedAt: '2026-01-01T00:00:00.000Z',
      expiresAt: '2027-01-01T00:00:00.000Z',
      status: 'ACTIVE',
      verificationUrl: 'https://verify.classroomio.com/cert/669a0319'
    };

    it('lists issued certificates and optionally asserts course membership', async () => {
      dbMocks.getPluginIssuedCertificatesList.mockResolvedValueOnce({
        items: [sampleCertificate],
        nextCursor: null
      });

      const result = await listIssuedCertificatesForPlugin(installationId, organizationId, actorId, { courseId });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual(sampleCertificate);
      expect(accessMocks.assertCourseMemberOrOrgAdmin).toHaveBeenCalledWith(courseId, actorId);
    });

    it('gets issued certificate by ID and rejects if not found', async () => {
      dbMocks.getPluginIssuedCertificateById.mockResolvedValueOnce(sampleCertificate).mockResolvedValueOnce(null);

      await expect(
        getIssuedCertificateForPlugin(installationId, organizationId, actorId, sampleCertificate.id)
      ).resolves.toEqual(sampleCertificate);

      await expect(
        getIssuedCertificateForPlugin(installationId, organizationId, actorId, 'nonexistent')
      ).rejects.toMatchObject({
        code: 'CERTIFICATE_NOT_FOUND',
        statusCode: 404
      });
    });
  });
});
