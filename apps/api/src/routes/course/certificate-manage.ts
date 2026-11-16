import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { courseTeamMemberMiddleware } from '@api/middlewares/course-team-member';
import { zValidator } from '@hono/zod-validator';
import { handleError, AppError, ErrorCodes } from '@api/utils/errors';
import {
  ZCertificateIdParam,
  ZCertificateMemberParam,
  ZCertificateMetadata,
  ZCertificateRevoke
} from '@cio/utils/validation/certificate/manage';
import {
  getCertificateById,
  getLatestCertificateByCourseProfile,
  updateCertificateMetadata,
  updateCertificateRevocation
} from '@cio/db/queries/certificate/certificate';
import { getCourseById } from '@cio/db/queries';
import { getProfileById } from '@cio/db/queries';

export const certificateManageRouter = new Hono()
  .get(
    '/:courseId/certificates/:memberId',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZCertificateMemberParam),
    async (c) => {
      try {
        const { courseId, memberId } = c.req.valid('param');

        const [courseRow] = await getCourseById(courseId);
        if (!courseRow) {
          throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
        }

        const profileId = memberId;
        const certificate = await getLatestCertificateByCourseProfile(courseId, profileId);

        if (!certificate) {
          return c.json({ success: false as const, error: 'Certificate not found', code: 'NOT_FOUND' }, 404);
        }

        const profile = await getProfileById(profileId);
        const revokedByProfile = certificate.revokedBy ? await getProfileById(certificate.revokedBy) : null;

        return c.json({
          success: true as const,
          data: {
            certificate: {
              ...certificate,
              revokedByName: revokedByProfile?.fullname ?? null
            },
            profile: profile ? { id: profile.id, fullname: profile.fullname, email: profile.email } : null,
            course: { id: courseRow.id, title: courseRow.title }
          }
        });
      } catch (error) {
        return handleError(c, error, 'Failed to fetch certificate');
      }
    }
  )
  .post(
    '/:courseId/certificates/:certificateId/revoke',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZCertificateIdParam),
    zValidator('json', ZCertificateRevoke),
    async (c) => {
      try {
        const { courseId, certificateId } = c.req.valid('param');
        const { reason, note } = c.req.valid('json');
        const user = c.get('user')!;

        const certificate = await getCertificateById(certificateId);
        if (!certificate || certificate.courseId !== courseId) {
          throw new AppError('Certificate not found', ErrorCodes.COURSE_NOT_FOUND, 404);
        }

        if (certificate.revokedAt) {
          throw new AppError('Certificate already revoked', ErrorCodes.VALIDATION_ERROR, 400);
        }

        const revokedAt = new Date().toISOString();
        const revokeReason = note ? `${reason} · ${note}` : reason;

        const updated = await updateCertificateRevocation(certificateId, {
          revokedAt,
          revokedBy: user.id,
          revokeReason
        });

        return c.json({ success: true as const, data: updated });
      } catch (error) {
        return handleError(c, error, 'Failed to revoke certificate');
      }
    }
  )
  .post(
    '/:courseId/certificates/:certificateId/reinstate',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZCertificateIdParam),
    async (c) => {
      try {
        const { courseId, certificateId } = c.req.valid('param');

        const certificate = await getCertificateById(certificateId);
        if (!certificate || certificate.courseId !== courseId) {
          throw new AppError('Certificate not found', ErrorCodes.COURSE_NOT_FOUND, 404);
        }

        if (!certificate.revokedAt) {
          throw new AppError('Certificate is not revoked', ErrorCodes.VALIDATION_ERROR, 400);
        }

        const updated = await updateCertificateRevocation(certificateId, {
          revokedAt: null,
          revokedBy: null,
          revokeReason: null
        });

        return c.json({ success: true as const, data: updated });
      } catch (error) {
        return handleError(c, error, 'Failed to reinstate certificate');
      }
    }
  )
  .put(
    '/:courseId/certificates/:certificateId/metadata',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZCertificateIdParam),
    zValidator('json', ZCertificateMetadata),
    async (c) => {
      try {
        const { courseId, certificateId } = c.req.valid('param');
        const { metadata } = c.req.valid('json');

        const certificate = await getCertificateById(certificateId);
        if (!certificate || certificate.courseId !== courseId) {
          throw new AppError('Certificate not found', ErrorCodes.COURSE_NOT_FOUND, 404);
        }

        if (certificate.revokedAt) {
          throw new AppError('Cannot edit metadata of a revoked certificate', ErrorCodes.VALIDATION_ERROR, 400);
        }

        const updated = await updateCertificateMetadata(certificateId, metadata);

        return c.json({ success: true as const, data: updated });
      } catch (error) {
        return handleError(c, error, 'Failed to update certificate metadata');
      }
    }
  );
